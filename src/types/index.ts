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
  genres?: string[];
  followers?: { total: number };
  track_preview?: string;
  track_id?: string;
  track_name?: string;
  track_thumbnail?: string | null;
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
  artist_id: string[];
  first_time: boolean;
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
