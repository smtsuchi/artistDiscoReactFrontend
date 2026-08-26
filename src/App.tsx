import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import SpotifyLoginButton from './components/SpotifyLoginButton';
import './css/App.css';

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
  const { isAuthenticated, authPending, authError } = useAuth();

  // Don't flash the login screen while a code exchange or refresh is in flight.
  if (authPending) {
    return (
      <div className="App">
        <div className="media-container">
          <div className="landing-page photo">
            <div className="auth-status">Signing you in…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <>
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
        </>
      ) : (
        // Display the Spotify login page
        <div className="media-container">
          <div className="landing-page photo">
            <SpotifyLoginButton />
            {authError && (
              <div className="auth-status error">Could not sign in: {authError}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
