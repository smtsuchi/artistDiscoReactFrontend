import React, { RefObject } from 'react';
import TinderCard from 'react-tinder-card';
import Ticker from 'react-ticker';
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
            <Ticker mode="smooth">
              {() => (
                <>
                  <div className="tckr">
                    <h3>
                      {artist.track_name}
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </h3>
                  </div>
                </>
              )}
            </Ticker>
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
