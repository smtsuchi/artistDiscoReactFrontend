import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { categoryApi, userApi } from '../services/api';
import { GenreOption } from '../types';
import '../css/GenreSelect.css';

const GenreSelect: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { userId, categoryNames, settings, myPlaylist, addCategory, setCurrentPlaylist,
          profileStatus, profileError, loadProfile } = useUser();
  const navigate = useNavigate();

  const [options, setOptions] = useState<GenreOption[]>([]);
  const [source, setSource] = useState<'library' | 'fallback' | null>(null);
  const [libraryArtists, setLibraryArtists] = useState(0);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const loadOptions = async () => {
    // Without a user id there is nothing to ask for. Returning while
    // loadingOptions stayed true is what left this stuck on "Reading your
    // library…" forever when the profile hadn't loaded.
    if (!userId) {
      setLoadingOptions(false);
      return;
    }
    setLoadingOptions(true);
    setOptionsError('');
    try {
      const data = await userApi.getGenreOptions(userId);
      setOptions(data.options || []);
      setSource(data.source);
      setLibraryArtists(data.library_artists || 0);
    } catch (err) {
      console.error('Error loading genre options:', err);
      setOptionsError(err instanceof Error ? err.message : 'Could not load genres.');
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, [userId]);

  /**
   * A brand-new account has too thin a library to profile, so the backend
   * returns generic options with no seeds — and a category with no seeds comes
   * back exhausted. Seed from the user's top artists instead, which the new
   * user-top-read scope makes available.
   */
  const seedsFromTopArtists = async (): Promise<string[]> => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/top/artists?limit=20', {
        headers: { Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken') },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []).map((a: any) => a.id);
    } catch {
      return [];
    }
  };

  const prepareCategory = async (option: GenreOption): Promise<boolean> => {
    const categoryName = option.genre;

    if (categoryNames.includes(categoryName)) {
      // Already exists. The deck is built server-side from the user's history,
      // so there's no buffer to read back — but opening the category is what
      // makes the backend record it as the current playlist, so still call it.
      await categoryApi.getCategory(userId, categoryName);
      setCurrentPlaylist(categoryName);
      return true;
    }

    let seeds = option.seed_artist_ids || [];
    if (seeds.length === 0) {
      seeds = await seedsFromTopArtists();
    }

    const result = await categoryApi.createCategory(userId, categoryName, seeds);
    if (!result.success) {
      setSubmitError(result.error || 'Could not create that category.');
      return false;
    }

    addCategory(categoryName);
    setCurrentPlaylist(categoryName);
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const select = form.elements.namedItem('playlist') as HTMLSelectElement;
    const chosen = options.find((o) => o.genre === select.value);
    if (!chosen) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const ok = await prepareCategory(chosen);
      if (!ok) return;

      navigate('/', {
        state: {
          category_name: chosen.genre,
          current_user_id: userId,
          atp: settings.add_to_playlist_on_like,
          fav: settings.fav_on_like,
          follow: settings.follow_on_like,
          my_playlist: myPlaylist,
        },
      });
    } catch (err) {
      console.error('Error starting category:', err);
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // Signed in is about holding a Spotify token. currentUser is the profile
  // fetched from Spotify afterwards — using it to decide "logged in" meant a
  // slow or failed profile fetch showed a "Re-Log In" button to an already
  // authenticated user, which re-logging in could never fix.
  const signedIn = isAuthenticated;
  const profileLoaded = !!currentUser;

  const yours = options.filter((o) => o.kind === 'library');
  const stretch = options.filter((o) => o.kind === 'stretch');
  const generic = options.filter((o) => o.kind === 'fallback');
  const ready = !loadingOptions && options.length > 0;

  return (
    <div className="main">
      <div className="text">
        <h1>Select a Genre</h1>
      </div>

      <div className="genreForm">
        {profileStatus === 'loading' && <h3>Loading your profile…</h3>}

        {profileStatus === 'error' && (
          <div className="genre-problem">
            <h3>Couldn't load your profile.</h3>
            <div className="auth-detail">{profileError}</div>
            <button className="button" onClick={loadProfile}>Retry</button>
          </div>
        )}

        {userId && loadingOptions && <h3>Reading your library…</h3>}

        {optionsError && (
          <div className="genre-problem">
            <h3>Couldn't load your genres.</h3>
            <div className="auth-detail">{optionsError}</div>
            <button className="button" onClick={loadOptions}>Retry</button>
          </div>
        )}

        {ready && (
          <form id="selectgenre" onSubmit={handleSubmit}>
            <select className="form-control" name="playlist" id="genres">
              {yours.length > 0 && (
                <optgroup label="Your genres">
                  {yours.map((o) => (
                    <option key={o.genre} value={o.genre}>{o.label}</option>
                  ))}
                </optgroup>
              )}
              {stretch.length > 0 && (
                <optgroup label="Explore">
                  {stretch.map((o) => (
                    <option key={o.genre} value={o.genre}>{o.label}</option>
                  ))}
                </optgroup>
              )}
              {generic.length > 0 && (
                <optgroup label="Popular genres">
                  {generic.map((o) => (
                    <option key={o.genre} value={o.genre}>{o.label}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <div className="submit">
              <button type="submit" form="selectgenre" className="button" disabled={submitting}>
                {submitting ? 'Starting…' : 'Submit'}
              </button>
            </div>
          </form>
        )}

        {source === 'library' && libraryArtists > 0 && (
          <div className="auth-detail">Built from {libraryArtists} artists in your library.</div>
        )}
        {source === 'fallback' && (
          <div className="auth-detail">
            Not enough listening history yet to personalise these — we'll use your top
            artists to get started.
          </div>
        )}
        {submitError && <div className="auth-detail error">{submitError}</div>}
      </div>

      <div className="loggedin">
        {!signedIn ? (
          <h3>Not signed in.</h3>
        ) : profileLoaded ? (
          <h3>Logged in as: {currentUser.display_name}</h3>
        ) : (
          <>
            <h3>Loading your profile…</h3>
            <button className="button" onClick={logout}>Sign out</button>
          </>
        )}
      </div>
    </div>
  );
};

export default GenreSelect;
