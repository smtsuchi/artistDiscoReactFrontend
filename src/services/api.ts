/**
 * Backend API Service
 * Handles all API calls to the Artist Disco Express backend
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
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
   * Update a single setting
   */
  updateSetting: (
    userId: string,
    settingName: 'add_to_playlist_on_like' | 'fav_on_like' | 'follow_on_like',
    value: boolean
  ): Promise<ApiResponse> => {
    if (!userId) {
      console.error('updateSetting called with empty userId');
      return Promise.resolve({ success: false, error: 'User ID is required' } as ApiResponse);
    }

    const endpoint = settingName === 'add_to_playlist_on_like' ? 'atp' :
                     settingName === 'fav_on_like' ? 'fav' : 'follow';

    return apiCall(`/${endpoint}/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  },
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
   * Update category (artists, used, childRefs)
   */
  updateCategory: (
    userId: string,
    categoryName: string,
    data: { artists: any[]; used: string[]; child_refs: any[] }
  ): Promise<ApiResponse> => {
    if (!userId || !categoryName) {
      console.error('updateCategory called with missing params:', { userId, categoryName });
      return Promise.resolve({ success: false, error: 'User ID and category name are required' } as ApiResponse);
    }

    return apiCall(`/patch-category/${userId}/${categoryName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
   * Update on card leave screen
   */
  updateOnLeave: (
    userId: string,
    categoryName: string,
    data: { visited: string[]; artists: any[] }
  ): Promise<ApiResponse> => {
    if (!userId || !categoryName) {
      console.error('updateOnLeave called with missing params:', { userId, categoryName });
      return Promise.resolve({ success: false, error: 'User ID and category name are required' } as ApiResponse);
    }

    return apiCall(`/patch-category-leave-screen/${userId}/${categoryName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
