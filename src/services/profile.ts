import Cookies from 'js-cookie';
import { userApi } from './api';
import { SpotifyUser, UserSettings } from '../types';

export interface LoadedProfile {
  userId: string;
  displayName: string;
  categoryNames: string[];
  settings: UserSettings;
  myPlaylist: string;
}

/**
 * Fetch the backend profile for a signed-in Spotify user, creating it (and the
 * "Curated by Artist Disco" playlist) on first run.
 *
 * Lives here rather than inside Callback because Callback only mounts after a
 * fresh OAuth redirect. When this logic was trapped there, any other entry —
 * a refresh, a deep link, a silent token refresh — left the app with no user
 * id at all, which silently broke every screen that needs one.
 */
export async function loadUserProfile(user: SpotifyUser): Promise<LoadedProfile> {
  const existing = await userApi.getUser(user.id);

  if (existing.success && existing.data) {
    return {
      userId: user.id,
      displayName: user.display_name,
      categoryNames: existing.data.category_names || [],
      settings: existing.data.settings,
      myPlaylist: existing.data.my_playlist,
    };
  }

  const playlistRes = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken'),
    },
    body: JSON.stringify({
      name: 'Curated by Artist Disco',
      description:
        'Your new playlist curated by Artist Disco! Every time you swipe right, your songs will be added here.',
      public: true,
    }),
  });

  if (!playlistRes.ok) {
    throw new Error('Could not create your Artist Disco playlist on Spotify.');
  }
  const playlistData = await playlistRes.json();

  const created = await userApi.createUser(
    user.id,
    Cookies.get('spotifyAuthToken') || '',
    playlistData.id
  );

  if (!created.success || !created.data) {
    throw new Error(created.error || 'Could not create your profile.');
  }

  return {
    userId: user.id,
    displayName: user.display_name,
    categoryNames: created.data.category_names || [],
    settings: created.data.settings,
    myPlaylist: playlistData.id,
  };
}
