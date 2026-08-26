import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

/**
 * Waiting room for the OAuth return trip.
 *
 * The profile load itself now lives in UserContext so it runs on every entry,
 * not just this one. This component only reflects its progress — and it must
 * wait for it: it previously rendered <Navigate> unconditionally on the first
 * render, before the profile request had even started.
 */
const Callback: React.FC = () => {
  const { logout } = useAuth();
  const { profileStatus, profileError, loadProfile } = useUser();

  if (profileStatus === 'ready') {
    return <Navigate to="/genreselect" replace />;
  }

  if (profileStatus === 'error') {
    return (
      <div className="media-container">
        <div className="landing-page photo">
          <div className="auth-status error">
            Signed in to Spotify, but your profile could not be loaded.
            <div className="auth-detail">{profileError}</div>
          </div>
          <button className="btn" onClick={loadProfile}>Try again</button>
          <button className="btn" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="media-container">
      <div className="landing-page photo">
        <div className="auth-status">Setting up your account…</div>
      </div>
    </div>
  );
};

export default Callback;
