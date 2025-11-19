import React, { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { categoryApi } from '../services/api';
import '../css/GenreSelect.css';

const GENRES = [
  { id: '37i9dQZF1DX0XUsuxWHRQd', name: 'Hip Hop' },
  { id: '37i9dQZF1DXcBWIGoYBM5M', name: 'Pop' },
  { id: '37i9dQZF1DWXRqgorJj26U', name: 'Rock' },
  { id: '37i9dQZF1DX9tPFwDMOaN1', name: 'K-Pop' },
  { id: '37i9dQZF1DX4dyzvuaRJ0n', name: 'Electronic Dance Music' },
  { id: '37i9dQZF1DX10zKzsJ2jva', name: 'Latin Trap' },
  { id: '37i9dQZF1DX1lVhptIYRda', name: 'Country' },
  { id: '37i9dQZF1DX4SBhb3fqCJd', name: 'Contemporary R&B' },
  { id: '37i9dQZF1DX2Nc3B70tvx0', name: 'Indie Rock' },
  { id: '37i9dQZF1DX0KpeLFwA3tO', name: 'Punk Rock' },
  { id: '37i9dQZF1DXa8NOEUWPn9W', name: 'House Music' },
  { id: '37i9dQZF1DX82GYcclJ3Ug', name: 'Alternative Rock' },
  { id: '37i9dQZF1DWTx0xog3gN3q', name: 'Soul' },
  { id: '37i9dQZF1DWY7IeIP1cdjF', name: 'Reggaeton' },
  { id: '37i9dQZF1DWWQRwui0ExPn', name: 'Lo-Fi Music' },
  { id: '37i9dQZF1DWZgauS5j6pMv', name: 'Funk' },
  { id: '37i9dQZF1DX1MUPbVKMgJE', name: 'Disco' },
  { id: '37i9dQZF1DWWEJlAGA9gs0', name: 'Classical Music' },
  { id: '37i9dQZF1DWTR4ZOXTfd9K', name: 'Jazz' },
  { id: '37i9dQZF1DX7Qo2zphj7u3', name: 'Latin Music' },
  { id: '37i9dQZF1DWTcqUzwhNmKv', name: 'Metal' },
];

const GenreSelect: React.FC = () => {
  const { currentUser } = useAuth();
  const { userId, categoryNames, settings, myPlaylist, addCategory, setCurrentPlaylist } = useUser();
  const navigate = useNavigate();

  const generateArtists = async (playlistId: string, categoryName: string) => {
    if (categoryNames.includes(categoryName)) {
      // Load saved database data
      try {
        const result = await categoryApi.getCategory(userId, categoryName);

        // Handle multiple response formats
        let categoryData = null;

        if (result.success && result.data) {
          // Check if data.myCategory exists (wrapped format)
          if ((result.data as any).myCategory) {
            categoryData = (result.data as any).myCategory;
          }
          // Check if data.buffer exists directly (unwrapped format)
          else if ((result.data as any).buffer) {
            categoryData = result.data;
          }
        }
        // Old format: { myCategory: {...} } directly in result
        else if ((result as any).myCategory) {
          categoryData = (result as any).myCategory;
        }
        // Very old format: buffer directly in result
        else if ((result as any).buffer) {
          categoryData = result;
        }

        if (categoryData && (categoryData as any).buffer) {
          setCurrentPlaylist(categoryName);
          return { buffer: (categoryData as any).buffer, first_time: false };
        } else {
          console.error('Error loading category - no buffer found:', result);
          return null;
        }
      } catch (error) {
        console.error('Error loading category - exception:', error);
        return null;
      }
    } else {
      // Create new category from Spotify API
      const token = Cookies.get('spotifyAuthToken');
      if (!token) {
        navigate('/callback');
        return null;
      }

      try {
        const res = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=US`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + token,
            },
          }
        );
        const data = await res.json();
        const buffer = data.items.map((item: any) => item.track.artists[0].id);

        // Save to backend
        const result = await categoryApi.createCategory(userId, categoryName, buffer);

        if (result.success) {
          addCategory(categoryName);
          setCurrentPlaylist(categoryName);
          return { buffer, first_time: true };
        } else {
          console.error('Error creating category:', result.error);
          return null;
        }
      } catch (error) {
        console.error('Error creating category:', error);
        return null;
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const select = form.elements.namedItem('playlist') as HTMLSelectElement;
    const playlistId = select.value;
    const categoryName = select.options[select.selectedIndex].text;

    const result = await generateArtists(playlistId, categoryName);

    if (result) {
      navigate('/', {
        state: {
          artist_id: result.buffer,
          first_time: result.first_time,
          category_name: categoryName,
          current_user_id: userId,
          atp: settings.add_to_playlist_on_like,
          fav: settings.fav_on_like,
          follow: settings.follow_on_like,
          my_playlist: myPlaylist,
        },
      });
    }
  };

  const handleRelogin = () => {
    navigate('/callback');
  };

  const isLoggedIn = !!currentUser;

  return (
    <div className="main">
      <div className="text">
        <h1>Select a Genre</h1>
      </div>

      <div className="genreForm">
        <form id="selectgenre" onSubmit={handleSubmit}>
          <select
            className="form-control"
            name="playlist"
            id="genres"
          >
            {GENRES.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
          <div className="submit">
            <button type="submit" form="selectgenre" className="button">
              Submit
            </button>
          </div>
        </form>
      </div>

      <div className="loggedin">
        {isLoggedIn ? (
          <h3>Logged in as: {currentUser.display_name}</h3>
        ) : (
          <button id="login-btn" className="button" onClick={handleRelogin}>
            Re-Log In
          </button>
        )}
      </div>
    </div>
  );
};

export default GenreSelect;
