import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { userApi } from '../services/api';

const Callback: React.FC = () => {
  const { token, setCurrentUser } = useAuth();
  const { setUserData } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const res = await fetch('https://api.spotify.com/v1/me', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken'),
          },
        });
        const data = await res.json();
        setCurrentUser({
          display_name: data.display_name,
          id: data.id,
          email: data.email,
        });
        return data;
      } catch (error) {
        console.error('Error getting current user:', error);
        return null;
      }
    };

    const getCurrentUserData = async () => {
      const currentSpotifyUser = await getCurrentUser();
      if (!currentSpotifyUser) {
        setLoading(false);
        return;
      }

      try {
        const result = await userApi.getUser(currentSpotifyUser.id);

        if (result.success && result.data) {
          // User exists in backend
          setUserData({
            userId: currentSpotifyUser.id,
            displayName: currentSpotifyUser.display_name,
            categoryNames: result.data.category_names,
            settings: result.data.settings,
            myPlaylist: result.data.my_playlist,
          });
        } else {
          // Create new user profile
          const playlistBody = JSON.stringify({
            name: 'Curated by Artist Disco',
            description:
              'Your new playlist curated by Artist Disco! Every time you swipe right, your songs will be added here.',
            public: true,
          });

          const playlistRes = await fetch(
            `https://api.spotify.com/v1/users/${currentSpotifyUser.id}/playlists`,
            {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken'),
              },
              body: playlistBody,
            }
          );
          const playlistData = await playlistRes.json();

          const createResult = await userApi.createUser(
            currentSpotifyUser.id,
            Cookies.get('spotifyAuthToken') || '',
            playlistData.id
          );

          if (createResult.success && createResult.data) {
            setUserData({
              userId: currentSpotifyUser.id,
              displayName: currentSpotifyUser.display_name,
              categoryNames: createResult.data.createdUser.category_names,
              settings: createResult.data.createdUser.settings,
              myPlaylist: playlistData.id,
            });
          } else {
            console.error('Error creating user:', createResult.error);
          }
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      getCurrentUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Navigate to="/genreselect" replace />;
};

export default Callback;
