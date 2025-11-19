declare module 'react-spotify-auth' {
  import { FC } from 'react';

  export interface SpotifyAuthProps {
    redirectUri: string;
    clientID: string;
    scopes: string[];
  }

  export const SpotifyAuth: FC<SpotifyAuthProps>;

  export const Scopes: {
    userReadPrivate: string;
    userReadEmail: string;
    playlistModifyPublic: string;
    playlistModifyPrivate: string;
    userFollowModify: string;
    userLibraryModify: string;
  };
}
