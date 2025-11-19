import React, { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { SpotifyArtist } from '../types';
import { categoryApi } from '../services/api';
import '../css/IndividualCard.css';

const IndividualCard: React.FC = () => {
  const { userId, settings } = useUser();
  const [currentArtist, setCurrentArtist] = useState<SpotifyArtist | null>(null);

  useEffect(() => {
    const fetchCurrentArtist = async () => {
      if (!userId || !settings.current_playlist) return;

      try {
        const result = await categoryApi.getCurrentArtist(userId, settings.current_playlist);

        if (result.success && result.data) {
          // Handle both formats: wrapped in individual_card or directly in data
          const artistData = (result.data as any).individual_card || result.data;
          setCurrentArtist(artistData as SpotifyArtist);
        } else {
          console.error('Error fetching current artist:', result.error);
        }
      } catch (error) {
        console.error('Error fetching current artist:', error);
      }
    };

    fetchCurrentArtist();
  }, [userId, settings.current_playlist]);

  if (!currentArtist) {
    return <div className="individual-view">Loading...</div>;
  }

  return (
    <div className="individual-view">
      <div
        className="single-photo"
        style={{ backgroundImage: `url(${currentArtist.images[0]?.url})` }}
      >
        <div className="info">
          <h1>{currentArtist.name}</h1>
          <h2>Follower Count: {currentArtist.followers?.total || 0}</h2>
          <p>{currentArtist.id}</p>
          <div className="genres">
            <h3>Genres:</h3>
            {currentArtist.genres?.map((genre, index) => (
              <h3 key={index}>{genre}</h3>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualCard;
