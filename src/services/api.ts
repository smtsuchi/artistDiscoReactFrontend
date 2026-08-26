/**
 * Backend API Service
 * Handles all API calls to the Artist Disco Express backend
 */

import { getToken, refreshToken } from './spotifyAuth';
import { DeckResponse, GenreOptionsResponse } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  details?: string[];
}

/** Backend failure carrying the HTTP status and the backend's `code`. */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface SendOptions {
  method?: 'POST' | 'PATCH' | 'PUT';
  body?: unknown;
  /** Send the user's Spotify token so the backend can call Spotify for them. */
  withSpotifyToken?: boolean;
}

async function rawSend(
  endpoint: string,
  method: string,
  body: unknown,
  spotifyToken?: string
): Promise<{ res: Response; json: ApiResponse | null }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // A dedicated header, not Authorization — the backend reserves that for its
  // own session layer. The backend never stores or refreshes Spotify tokens:
  // PKCE rotates the refresh token, so two refreshers would invalidate each
  // other. The client owns the token lifecycle and presents a live one per call.
  if (spotifyToken) {
    headers['X-Spotify-Token'] = spotifyToken;
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${endpoint}`, { method, headers, body: JSON.stringify(body ?? {}) });
  } catch {
    throw new ApiError(`Could not reach the server. It may be offline.`, 0);
  }

  const text = await res.text();
  let json: ApiResponse | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse;
    } catch {
      throw new ApiError(`Server returned ${res.status} instead of JSON.`, res.status);
    }
  }
  return { res, json };
}

/**
 * POST/PATCH JSON and return the unwrapped `data`.
 *
 * On a 401 with code SPOTIFY_TOKEN_EXPIRED, refreshes the Spotify token and
 * retries exactly once — a genuinely dead token would otherwise spin forever.
 */
export async function sendJson<T = any>(endpoint: string, options: SendOptions = {}): Promise<T> {
  const { method = 'POST', body, withSpotifyToken = false } = options;

  let { res, json } = await rawSend(endpoint, method, body, withSpotifyToken ? getToken() : undefined);

  if (withSpotifyToken && res.status === 401 && json?.code === 'SPOTIFY_TOKEN_EXPIRED') {
    const fresh = await refreshToken();
    if (fresh) {
      ({ res, json } = await rawSend(endpoint, method, body, fresh));
    }
  }

  if (!res.ok) {
    const detail = json?.error || json?.message || `Request failed (${res.status})`;
    const extra = json?.details?.length ? ` (${json.details.join('; ')})` : '';
    throw new ApiError(detail + extra, res.status, json?.code);
  }

  return (json?.data ?? json) as T;
}

/**
 * Generic API call wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error [${response.status}]:`, data);
    }

    return data;
  } catch (error) {
    console.error('API Call Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * User API calls
 */
export const userApi = {
  /**
   * Get user data
   */
  getUser: (userId: string): Promise<ApiResponse> => {
    if (!userId) {
      console.error('getUser called with empty userId');
      return Promise.resolve({ success: false, error: 'User ID is required' } as ApiResponse);
    }
    // Use old endpoint for compatibility
    return apiCall(`/userData/${userId}`);
  },

  /**
   * Create new user
   */
  createUser: (userId: string, accessToken: string, myPlaylist: string) => {
    const formData = new URLSearchParams();
    formData.append('user_id', userId);
    formData.append('access_token', accessToken);
    formData.append('my_playlist', myPlaylist);

    return fetch(`${BACKEND_URL}/userData`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  },

  /**
   * Get user settings
   */
  getSettings: (userId: string): Promise<ApiResponse> => {
    if (!userId) {
      console.error('getSettings called with empty userId');
      return Promise.resolve({ success: false, error: 'User ID is required' } as ApiResponse);
    }
    return apiCall(`/userData/settings/${userId}`);
  },

  /**
   * Update a single setting.
   *
   * Uses the generic, type-aware endpoint: `value` is validated against the
   * type declared for the named setting, so one call handles both the boolean
   * toggles and numeric adventurousness, and future settings need no new route.
   */
  updateSetting: (
    userId: string,
    settingName: 'add_to_playlist_on_like' | 'fav_on_like' | 'follow_on_like' | 'adventurousness',
    value: boolean | number
  ): Promise<any> =>
    sendJson(`/api/users/${userId}/settings`, {
      method: 'PATCH',
      body: { setting: settingName, value },
    }),

  /**
   * Genre options derived from the user's own library.
   *
   * Replaces the hardcoded editorial-playlist list, which was identical for
   * every user and relied on the class of access Spotify has been withdrawing.
   * 5-8 Spotify calls cold, then cached server-side for 7 days.
   */
  getGenreOptions: (userId: string, force = false): Promise<GenreOptionsResponse> =>
    sendJson<GenreOptionsResponse>(`/api/users/${userId}/genre-options`, {
      method: 'POST',
      body: { force },
      withSpotifyToken: true,
    }),
};

/**
 * Category API calls
 */
export const categoryApi = {
  /**
   * Get category data
   */
  getCategory: (userId: string, categoryName: string): Promise<ApiResponse> => {
    if (!userId || !categoryName) {
      console.error('getCategory called with missing params:', { userId, categoryName });
      return Promise.resolve({ success: false, error: 'User ID and category name are required' } as ApiResponse);
    }
    return apiCall(`/category/${userId}/${categoryName}`);
  },

  /**
   * Create new category
   */
  createCategory: (userId: string, categoryName: string, buffer: string[]): Promise<ApiResponse> => {
    if (!userId || !categoryName) {
      console.error('createCategory called with missing params:', { userId, categoryName });
      return Promise.resolve({ success: false, error: 'User ID and category name are required' } as ApiResponse);
    }

    const formData = new URLSearchParams();
    formData.append('category_name', categoryName);
    formData.append('buffer', buffer.join(','));

    return fetch(`${BACKEND_URL}/category/${userId}`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  },

  /**
   * Get current artist (last in array)
   */
  getCurrentArtist: (userId: string, categoryName: string): Promise<ApiResponse> => {
    if (!userId || !categoryName) {
      console.error('getCurrentArtist called with missing params:', { userId, categoryName });
      return Promise.resolve({ success: false, error: 'User ID and category name are required' } as ApiResponse);
    }
    return apiCall(`/category/single/${userId}/${categoryName}`);
  },

  /**
   * Add liked artist
   */
  addLikedArtist: (userId: string, categoryName: string, artistId: string): Promise<ApiResponse> => {
    if (!userId || !categoryName) {
      console.error('addLikedArtist called with missing params:', { userId, categoryName });
      return Promise.resolve({ success: false, error: 'User ID and category name are required' } as ApiResponse);
    }

    return apiCall(`/patch-category-liked/${userId}/${categoryName}`, {
      method: 'POST',
      body: JSON.stringify({ artist_id: artistId }),
    });
  },

  /**
   * Record a pass (left swipe). Without this the recommender only ever learns
   * what a user liked, never what they rejected. No Spotify token needed.
   */
  recordPass: (userId: string, categoryName: string, artistId: string): Promise<any> =>
    sendJson(`/api/users/${userId}/categories/${categoryName}/passed`, {
      method: 'PATCH',
      body: { artist_id: artistId },
    }),

  /**
   * Build a scored, diversified deck server-side.
   *
   * `adventurousness` is deliberately omitted so the user's stored setting
   * applies; pass it only for a temporary override.
   */
  buildDeck: (
    userId: string,
    categoryName: string,
    opts: { size?: number; exclude_ids?: string[]; adventurousness?: number } = {}
  ): Promise<DeckResponse> =>
    sendJson<DeckResponse>(`/api/users/${userId}/categories/${categoryName}/deck`, {
      method: 'POST',
      body: opts,
      withSpotifyToken: true,
    }),

};
