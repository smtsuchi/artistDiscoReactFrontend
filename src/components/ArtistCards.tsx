import React, { RefObject } from 'react';
import TinderCard from 'react-tinder-card';
import { SpotifyArtist } from '../types';

interface ArtistCardsProps {
  artist: SpotifyArtist;
  childRef: RefObject<any>;
  onSwipe: (direction: string, artist: SpotifyArtist) => void;
  onCardLeftScreen: (name: string, id: string) => void;
}

const ArtistCards: React.FC<ArtistCardsProps> = ({
  artist,
  childRef,
  onSwipe,
  onCardLeftScreen,
}) => {
  return (
    <div className="individual-card" id={artist.id}>
      <TinderCard
        ref={childRef}
        className="swipe"
        key={artist.id}
        preventSwipe={['up', 'down']}
        onSwipe={(dir) => onSwipe(dir, artist)}
        onCardLeftScreen={() => onCardLeftScreen(artist.name, artist.id)}
      >
        <div
          className="photo-card"
          style={{ backgroundImage: `url(${artist.images[0]?.url})` }}
        >
          <h1>{artist.name}</h1>
          <div className="preview-track">
            <img
              className="thmbnl"
              alt="Track Thumbnail"
              src={artist.track_thumbnail || ''}
            />
            {/* CSS marquee, replacing react-ticker: its peer range caps at
                React 17, so it makes `npm install` fail outright on React 18. */}
            <div className="tckr">
              <h3 data-title={artist.track_name} aria-label={artist.track_name}>
                {artist.track_name}
              </h3>
            </div>
            <div className="adctrl">
              <audio controls>
                <source src={artist.track_preview || ''} type="audio/mpeg" />
              </audio>
            </div>
          </div>
          <p>{artist.id}</p>
        </div>
      </TinderCard>
    </div>
  );
};

export default ArtistCards;
