import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { SpotifyArtist, DeckCard, SwipePageLocationState } from '../types';
import Footer from '../components/Footer';
import ArtistCards from '../components/ArtistCards';
import { categoryApi } from '../services/api';
import '../css/ArtistCards.css';
import '../css/Footer.css';
import '../css/SwipePage.css';

const DECK_SIZE = 20;
// Refill while there's still a comfortable buffer on screen.
const REFILL_THRESHOLD = 8;

const SwipePage: React.FC = () => {
  const location = useLocation();
  const state = location.state as SwipePageLocationState | null;

  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [redirect, setRedirect] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState('');

  const exButton = useRef<HTMLDivElement>(null);
  // One ref per artist id. Keyed by id rather than array index so refs survive
  // the deck being prepended to and spliced.
  const refsById = useRef<Record<string, React.RefObject<any>>>({});
  // Mirrors `artists` so callbacks can read the live deck without going stale.
  const artistsRef = useRef<SpotifyArtist[]>([]);
  const refilling = useRef(false);

  useEffect(() => {
    artistsRef.current = artists;
  }, [artists]);

  const getRef = (id: string): React.RefObject<any> => {
    if (!refsById.current[id]) {
      refsById.current[id] = React.createRef();
    }
    return refsById.current[id];
  };

  /**
   * Top-tracks lookup, kept only as the lazy fallback for cards the deck
   * endpoint left without a track (see flattenCard).
   */
  const getTopTracks = async (artistId: string) => {
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
        { method: 'GET', headers: { Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken') } }
      );
      const data = await res.json();
      if (!data.tracks || data.tracks.length === 0) {
        return { preview_url: null, track_id: null, track_name: null, track_thumbnail: null };
      }

      let trackNum = 0;
      while (!data.tracks[trackNum].preview_url) {
        trackNum++;
        if (trackNum > data.tracks.length - 1) {
          trackNum--;
          break;
        }
      }

      const myTrack = data.tracks[trackNum];
      return {
        preview_url: myTrack.preview_url,
        track_id: myTrack.id,
        track_name: myTrack.name,
        track_thumbnail: myTrack.album?.images?.[0]?.url ?? null,
      };
    } catch (err) {
      console.error('Error getting top tracks:', err);
      return { preview_url: null, track_id: null, track_name: null, track_thumbnail: null };
    }
  };

  /** Deck cards nest track data; the card component reads it flattened. */
  const flattenCard = (card: DeckCard): SpotifyArtist => ({
    ...card,
    track_id: card.track?.id,
    track_name: card.track?.name ?? undefined,
    track_preview: card.track?.preview_url ?? undefined,
    track_thumbnail: card.track?.thumbnail ?? null,
  });

  /**
   * The deck endpoint only populates `track` for the first 10 cards — fetching
   * 20 sets of top-tracks up front is what made the old flow slow. Those 10 are
   * the ones shown first, so the rest can be filled in while the user swipes.
   */
  const hydrateMissingTracks = useCallback(async (cards: SpotifyArtist[]) => {
    for (const card of cards) {
      if (card.track_name) continue;
      const t = await getTopTracks(card.id);
      setArtists((prev) =>
        prev.map((a) =>
          a.id === card.id
            ? {
                ...a,
                track_preview: t.preview_url ?? undefined,
                track_id: t.track_id ?? undefined,
                track_name: t.track_name ?? undefined,
                track_thumbnail: t.track_thumbnail,
              }
            : a
        )
      );
    }
  }, []);

  const loadDeck = useCallback(
    async (replace: boolean) => {
      if (!state || refilling.current) return;
      refilling.current = true;
      setError('');

      try {
        const data = await categoryApi.buildDeck(state.current_user_id, state.category_name, {
          size: DECK_SIZE,
          exclude_ids: artistsRef.current.map((a) => a.id),
          // adventurousness deliberately omitted so the user's stored setting wins.
        });

        if (data.meta.exhausted && data.deck.length === 0) {
          setExhausted(true);
          return;
        }

        // The server returns best-first, but the card stack renders the LAST
        // array element on top — so reverse, or the user silently sees the
        // worst recommendations first.
        const fresh = data.deck.map(flattenCard).reverse();

        setArtists((prev) => (replace ? fresh : [...fresh, ...prev]));
        hydrateMissingTracks(fresh);
      } catch (err) {
        console.error('Error building deck:', err);
        setError(err instanceof Error ? err.message : 'Could not load more artists.');
      } finally {
        refilling.current = false;
        setLoading(false);
      }
    },
    [state, hydrateMissingTracks]
  );

  useEffect(() => {
    if (!state) {
      // No genre chosen yet — go pick one, don't sign the user out.
      setRedirect('/genreselect');
      return;
    }
    // One call replaces the old first_time / resume split: the backend already
    // knows everything this user has liked, passed or seen.
    loadDeck(true);
  }, []);

  const updateLiked = async (artistId: string) => {
    if (!state) return;
    try {
      await categoryApi.addLikedArtist(state.current_user_id, state.category_name, artistId);
    } catch (err) {
      console.error('Error updating liked:', err);
    }
  };

  const recordPass = async (artistId: string) => {
    if (!state) return;
    try {
      await categoryApi.recordPass(state.current_user_id, state.category_name, artistId);
    } catch (err) {
      console.error('Error recording pass:', err);
    }
  };

  const follow = (artistId: string) => {
    fetch(`https://api.spotify.com/v1/me/following?type=artist&ids=${artistId}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken'),
      },
    });
  };

  const fav = (trackId: string | null | undefined) => {
    if (!trackId) return;
    fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken'),
      },
    });
  };

  const atp = (trackId: string | null | undefined) => {
    if (!state || !trackId) return;
    fetch(
      `https://api.spotify.com/v1/playlists/${state.my_playlist}/tracks?uris=spotify%3Atrack%3A${trackId}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken'),
        },
      }
    );
  };

  const onSwipe = (direction: string, artistObject: SpotifyArtist) => {
    const sounds = document.getElementsByTagName('audio');
    for (let i = 0; i < sounds.length; i++) sounds[i].pause();

    if (!state) return;

    if (direction === 'right') {
      updateLiked(artistObject.id);
      if (state.atp) atp(artistObject.track_id);
      if (state.fav) fav(artistObject.track_id);
      if (state.follow) follow(artistObject.id);
    } else if (direction === 'left') {
      // Previously a left swipe recorded nothing, so the recommender could only
      // ever learn what a user liked, never what they rejected.
      recordPass(artistObject.id);
    }
  };

  const swipe = (direction: string) => {
    const top = artistsRef.current[artistsRef.current.length - 1];
    if (!top) return;
    refsById.current[top.id]?.current?.swipe(direction);
  };

  const onCardLeftScreen = (_myName: string, myIdentifier: string) => {
    if (exButton.current) {
      exButton.current.removeAttribute('disabled');
    }

    delete refsById.current[myIdentifier];

    setArtists((prev) => {
      const next = prev.filter((artist) => artist.id !== myIdentifier);
      // Read the remaining count from state rather than counting DOM nodes.
      if (next.length <= REFILL_THRESHOLD && !exhausted) {
        loadDeck(false);
      }
      return next;
    });
  };

  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  if (loading) {
    return (
      <div className="swipePage">
        <div className="media-container">
          <div className="loading-gif"></div>
        </div>
      </div>
    );
  }

  if (exhausted && artists.length === 0) {
    return (
      <div className="swipePage">
        <div className="media-container">
          <div className="deck-message">
            <h2>That's everything</h2>
            <p>
              You've seen everything we can find for this genre. Try another, or turn
              adventurousness up in settings to reach further out.
            </p>
            <Link className="button" to="/genreselect">Pick another genre</Link>
            <Link className="button" to="/settings">Settings</Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && artists.length === 0) {
    return (
      <div className="swipePage">
        <div className="media-container">
          <div className="deck-message">
            <h2>Couldn't load artists</h2>
            <p>{error}</p>
            <button className="button" onClick={() => loadDeck(true)}>Try again</button>
            <Link className="button" to="/genreselect">Pick another genre</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="swipePage">
      <div className="media-container">
        <div className="loading-gif"></div>
      </div>
      <div id="deck" className="artistCards__cardContainer">
        {artists.map((artist) => (
          <ArtistCards
            key={artist.id}
            childRef={getRef(artist.id)}
            artist={artist}
            onSwipe={onSwipe}
            onCardLeftScreen={onCardLeftScreen}
          />
        ))}
      </div>
      <Footer exButton={exButton} swipe={swipe} />
    </div>
  );
};

export default SwipePage;
