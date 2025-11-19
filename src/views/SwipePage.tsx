import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { SpotifyArtist, SwipePageLocationState } from '../types';
import Footer from '../components/Footer';
import ArtistCards from '../components/ArtistCards';
import { categoryApi } from '../services/api';
import '../css/ArtistCards.css';
import '../css/Footer.css';
import '../css/SwipePage.css';

const SwipePage: React.FC = () => {
  const location = useLocation();
  const state = location.state as SwipePageLocationState | null;

  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [used, setUsed] = useState<string[]>([]);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [childRefs, setChildRefs] = useState<React.RefObject<any>[]>([]);
  const [buffer, setBuffer] = useState<string[]>([]);
  const [redirect, setRedirect] = useState(false);

  const exButton = useRef<HTMLDivElement>(null);

  const getTopTracks = async (artistId: string) => {
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken'),
          },
        }
      );
      const data = await res.json();

      if (!data.tracks || data.tracks.length === 0) {
        return {
          preview_url: null,
          track_id: null,
          track_name: null,
          track_thumbnail: null,
        };
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
      const trackThumbnail =
        myTrack.album.images && myTrack.album.images[0]
          ? myTrack.album.images[0].url
          : null;

      return {
        preview_url: myTrack.preview_url,
        track_id: myTrack.id,
        track_name: myTrack.name,
        track_thumbnail: trackThumbnail,
      };
    } catch (error) {
      console.error('Error getting top tracks:', error);
      return {
        preview_url: null,
        track_id: null,
        track_name: null,
        track_thumbnail: null,
      };
    }
  };

  const getRelatedArtists = useCallback(
    async (artistId: string, remainingDeckLength?: number) => {
      const token = Cookies.get('spotifyAuthToken');
      if (!token || !state) {
        setRedirect(true);
        return;
      }

      try {
        const res = await fetch(
          `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
          {
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + token,
            },
          }
        );
        const data = await res.json();

        if (!data.artists || data.artists.length === 0) return 'empty';

        // Capture the current visited state for filtering
        const visitedSnapshot = await new Promise<Set<string>>((resolve) => {
          setVisited((current) => {
            resolve(current);
            return current;
          });
        });

        // Pre-filter against visited and do deduplication
        const checklist = new Set(data.artists.map((a: any) => a.id));
        const preFilteredData = data.artists
          .filter((artist: any) => {
            if (checklist.has(artist.id)) {
              checklist.delete(artist.id);
              return true;
            }
            return false;
          })
          .filter(
            (artist: any) =>
              !visitedSnapshot.has(artist.id) &&
              artist.images.length > 0
          );

        // Fetch track details for all pre-filtered artists
        for (let i = 0; i < preFilteredData.length; i++) {
          const trackDetails = await getTopTracks(preFilteredData[i].id);
          preFilteredData[i].track_preview = trackDetails.preview_url;
          preFilteredData[i].track_id = trackDetails.track_id;
          preFilteredData[i].track_name = trackDetails.track_name;
          preFilteredData[i].track_thumbnail = trackDetails.track_thumbnail;
        }

        // Capture current used state
        const usedSnapshot = await new Promise<string[]>((resolve) => {
          setUsed((current) => {
            resolve(current);
            return current;
          });
        });

        // Use functional update to merge with the most current state
        let finalArtistsLength = 0;
        setArtists((currentArtists) => {
          // When remainingDeckLength is provided, keep only that many current artists
          // Otherwise keep all current artists
          const currentForMerge = remainingDeckLength !== undefined
            ? currentArtists.slice(0, remainingDeckLength)
            : currentArtists;

          // Filter out any artists that are already in the current deck
          const currentIds = new Set(currentForMerge.map(a => a.id));
          const filteredData = preFilteredData.filter(
            (artist: any) => !currentIds.has(artist.id)
          );

          // New artists go to the bottom of the visual stack (beginning of array)
          // Since the last card in array appears on top, new cards go at the start
          const updatedArtists = [...filteredData, ...currentForMerge];
          finalArtistsLength = updatedArtists.length;

          // Update backend with the new state
          categoryApi.updateCategory(
            state.current_user_id,
            state.category_name,
            {
              artists: updatedArtists,
              used: [...usedSnapshot, artistId],
              child_refs: Array(updatedArtists.length).fill(0).map(() => React.createRef()),
            }
          );

          return updatedArtists;
        });

        setChildRefs(() => {
          // Create refs matching the final artists length
          return Array(finalArtistsLength)
            .fill(0)
            .map(() => React.createRef());
        });

        setUsed((prev) => [...prev, artistId]);

        return 'done';
      } catch (error) {
        console.error('Error getting related artists:', error);
        setRedirect(true);
      }
    },
    [visited, used, state]
  );

  useEffect(() => {
    const initializeArtists = async () => {
      if (!state) {
        setRedirect(true);
        return;
      }

      const { category_name, first_time, artist_id, current_user_id } = state;

      if (first_time) {
        let count = 0;
        while (count < used.length && used.includes(artist_id[count])) {
          count++;
        }
        getRelatedArtists(artist_id[count]);
        setBuffer(artist_id);
      } else {
        // Load from database
        try {
          const getData = await categoryApi.getCategory(current_user_id, category_name);

          if (getData.success && getData.data) {
            // The backend returns data directly, not wrapped in myCategory
            const data = getData.data as any;

            // Fetch track details for cached artists if they don't have them
            const artists = data.artists || [];
            const artistsWithTracks = await Promise.all(
              artists.map(async (artist: any) => {
                // Check if artist already has track preview data
                if (artist.track_preview) {
                  return artist;
                }
                // Fetch track details for this artist
                const trackDetails = await getTopTracks(artist.id);
                return {
                  ...artist,
                  track_preview: trackDetails.preview_url,
                  track_id: trackDetails.track_id,
                  track_name: trackDetails.track_name,
                  track_thumbnail: trackDetails.track_thumbnail,
                };
              })
            );

            // Create fresh refs for all artists
            const newChildRefs = Array(artistsWithTracks.length)
              .fill(0)
              .map(() => React.createRef());

            setArtists(artistsWithTracks);
            setBuffer(data.buffer || []);
            setUsed(data.used || []);
            setChildRefs(newChildRefs);
            setLiked(data.liked || []);
            setLikedCount(data.liked_count || 0);
            setVisited(new Set(data.visited || []));
          }
        } catch (error) {
          console.error('Error loading category data:', error);
        }
      }
    };

    initializeArtists();
  }, []);

  const updateLiked = async (artistId: string) => {
    if (!state) return;

    try {
      const result = await categoryApi.addLikedArtist(
        state.current_user_id,
        state.category_name,
        artistId
      );

      if (!result.success) {
        console.error('Error updating liked:', result.error);
      }
    } catch (error) {
      console.error('Error updating liked:', error);
    }
  };

  const follow = (artistId: string) => {
    fetch(
      `https://api.spotify.com/v1/me/following?type=artist&ids=${artistId}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken'),
        },
      }
    );
  };

  const fav = (trackId: string | null | undefined) => {
    if (trackId) {
      fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken'),
        },
      });
    }
  };

  const atp = (trackId: string | null | undefined) => {
    if (!state || !trackId) return;

    const playlistId = state.my_playlist;
    fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=spotify%3Atrack%3A${trackId}`,
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
    // Pause all audio
    const sounds = document.getElementsByTagName('audio');
    for (let i = 0; i < sounds.length; i++) sounds[i].pause();

    if (direction === 'right' && state) {
      setLiked((prev) => [...prev, artistObject.id]);
      updateLiked(artistObject.id);
      if (state.atp) atp(artistObject.track_id);
      if (state.fav) fav(artistObject.track_id);
      if (state.follow) follow(artistObject.id);
    }
  };

  const swipe = (direction: string) => {
    const cardsLeft = artists;
    if (cardsLeft.length) {
      let indexToBeRemoved = cardsLeft.length - 1;
      while (
        indexToBeRemoved > -1 &&
        (!childRefs[indexToBeRemoved] || !childRefs[indexToBeRemoved].current)
      ) {
        indexToBeRemoved -= 1;
      }
      if (indexToBeRemoved >= 0 && childRefs[indexToBeRemoved].current) {
        childRefs[indexToBeRemoved].current.swipe(direction);
      }
    }
  };

  const updateAfterLeaveScreen = async (
    visitedSet: Set<string>,
    artistsList: SpotifyArtist[]
  ) => {
    if (!state) return;

    try {
      const visitedArr = Array.from(visitedSet);
      const result = await categoryApi.updateOnLeave(
        state.current_user_id,
        state.category_name,
        { visited: visitedArr, artists: artistsList }
      );

      if (!result.success) {
        console.error('Error updating after leave screen:', result.error);
      }
    } catch (error) {
      console.error('Error updating after leave screen:', error);
    }
  };

  const onCardLeftScreen = (_myName: string, myIdentifier: string) => {
    if (exButton.current) {
      exButton.current.removeAttribute('disabled');
    }

    const newVisited = new Set(visited).add(myIdentifier);
    const newArtists = artists.filter((artist) => artist.id !== myIdentifier);
    const deckElement = document.getElementById('deck');
    const deckLength = deckElement
      ? deckElement.getElementsByClassName('individual-card').length
      : 0;

    setVisited(newVisited);
    setArtists(newArtists);
    updateAfterLeaveScreen(newVisited, newArtists);

    if (deckLength <= 11) {
      let count = likedCount;
      while (used.includes(liked[count])) {
        count++;
      }
      setLikedCount(count);
      setUsed((prev) => [...prev, ...liked.slice(0, count)]);

      if (liked[count]) {
        getRelatedArtists(liked[count], deckLength - 1);
      } else {
        for (const playlistArtist of buffer) {
          if (!used.includes(playlistArtist)) {
            getRelatedArtists(playlistArtist);
            break;
          }
        }
      }
    }
  };

  if (redirect) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="swipePage">
      <div className="media-container">
        <div className="loading-gif"></div>
      </div>
      <div id="deck" className="artistCards__cardContainer">
        {artists.map((artist, i) => (
          <ArtistCards
            key={artist.id}
            childRef={childRefs[i]}
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
