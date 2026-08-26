// Spotify API Types
export interface SpotifyUser {
  display_name: string;
  id: string;
  email?: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  // Roughly half of all Spotify artists return an empty genres array — in real
  // decks 11-16 of 20 cards have none. Never gate rendering or filtering on it.
  genres?: string[];
  popularity?: number;
  followers?: { total: number };
  track_preview?: string;
  track_id?: string;
  track_name?: string;
  track_thumbnail?: string | null;
  /** Deck-only: why this card was recommended. */
  score?: number;
  exploration?: boolean;
  why?: { seeds: string[]; genre_imputed?: boolean };
}

/** A card as returned by the deck endpoint, before flattening. */
export interface DeckCard extends SpotifyArtist {
  // Populated for the first 10 cards only; null beyond that, by design.
  track: {
    id: string;
    name: string;
    preview_url: string | null;
    thumbnail: string | null;
  } | null;
}

export interface DeckMeta {
  seed_ids: string[];
  candidates_considered: number;
  adventurousness: number;
  deck_size: number;
  exhausted: boolean;
  reason?: string;
  elapsed_ms: number;
}

export interface DeckResponse {
  order: 'best_first';
  deck: DeckCard[];
  meta: DeckMeta;
}

export interface GenreOption {
  genre: string;
  label: string;
  weight: number;
  count: number;
  seed_artist_ids: string[];
  kind: 'library' | 'stretch' | 'fallback';
}

export interface GenreOptionsResponse {
  source: 'library' | 'fallback';
  cached: boolean;
  library_artists: number;
  refreshed_at: string;
  options: GenreOption[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  album: {
    images: { url: string }[];
  };
}

// App Types
export interface UserSettings {
  current_playlist: string | null;
  add_to_playlist_on_like: boolean;
  follow_on_like: boolean;
  fav_on_like: boolean;
  /** 0 = mainstream, 1 = obscure. Default 0.5. */
  adventurousness: number;
}

export interface UserData {
  user_id: string;
  display_name: string;
  category_names: string[];
  settings: UserSettings;
  my_playlist: string;
}

// Route State Types
export interface SwipePageLocationState {
  // Seeds and the first_time split are obsolete now that decks are built
  // server-side from the user's history. Kept optional for older nav state.
  artist_id?: string[];
  first_time?: boolean;
  category_name: string;
  current_user_id: string;
  atp: boolean;
  fav: boolean;
  follow: boolean;
  my_playlist: string;
}

export interface IndividualCardLocationState {
  artist: SpotifyArtist;
}
