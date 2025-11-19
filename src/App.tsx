import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SpotifyApiContext } from 'react-spotify-api';
import { SpotifyAuth, Scopes } from 'react-spotify-auth';
import 'react-spotify-auth/dist/index.css';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import './css/App.css';

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'https://artist-disco-react-frontend.web.app/callback';

// Lazy load route components for code splitting
const Callback = lazy(() => import('./components/Callback'));
const SwipePage = lazy(() => import('./views/SwipePage'));
const IndividualCard = lazy(() => import('./views/IndividualCard'));
const Settings = lazy(() => import('./views/Settings'));
const GenreSelect = lazy(() => import('./components/GenreSelect'));
const Login = lazy(() => import('./components/Login'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-container" style={{ padding: '2rem', textAlign: 'center' }}>
    <div>Loading...</div>
  </div>
);

const App: React.FC = () => {
  const { token, isAuthenticated } = useAuth();

  return (
    <div className="App">
      {isAuthenticated ? (
        <SpotifyApiContext.Provider value={token}>
          <Header />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/callback" element={<Callback />} />
              <Route path="/" element={<SwipePage />} />
              <Route path="/artistdetails" element={<IndividualCard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/genreselect" element={<GenreSelect />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Suspense>
        </SpotifyApiContext.Provider>
      ) : (
        // Display the Spotify login page
        <div className="media-container">
          <div className="landing-page photo">
            <SpotifyAuth
              redirectUri={REDIRECT_URI}
              clientID={SPOTIFY_CLIENT_ID}
              scopes={[
                Scopes.userReadPrivate,
                'ugc-image-upload',
                'user-read-email',
                'playlist-modify-public',
                'playlist-modify-private',
                'user-follow-modify',
                'user-library-modify',
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
