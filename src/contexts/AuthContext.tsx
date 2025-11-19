import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { SpotifyUser } from '../types';

interface AuthContextType {
  token: string | undefined;
  currentUser: SpotifyUser | null;
  isAuthenticated: boolean;
  setToken: (token: string | undefined) => void;
  setCurrentUser: (user: SpotifyUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setTokenState] = useState<string | undefined>(
    Cookies.get('spotifyAuthToken')
  );
  const [currentUser, setCurrentUser] = useState<SpotifyUser | null>(() => {
    // Try to restore user from localStorage on initial load
    const savedUser = localStorage.getItem('spotifyAuthUser');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setToken = (newToken: string | undefined) => {
    setTokenState(newToken);
    if (newToken) {
      Cookies.set('spotifyAuthToken', newToken);
    } else {
      Cookies.remove('spotifyAuthToken');
    }
  };

  const setCurrentUserWithPersistence = (user: SpotifyUser | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('spotifyAuthUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('spotifyAuthUser');
    }
  };

  const logout = () => {
    setToken(undefined);
    setCurrentUser(null);
    localStorage.removeItem('spotifyAuthUser');
    localStorage.removeItem('spotifyUserData'); // Also clear UserContext data
  };

  const isAuthenticated = !!token && token !== 'expired';

  useEffect(() => {
    // Update token from cookies on mount
    const cookieToken = Cookies.get('spotifyAuthToken');
    if (cookieToken && cookieToken !== token) {
      setTokenState(cookieToken);
    }

    // If we have a token but no user, try to fetch the user
    if (cookieToken && !currentUser) {
      const fetchCurrentUser = async () => {
        try {
          const res = await fetch('https://api.spotify.com/v1/me', {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + cookieToken,
            },
          });
          if (res.ok) {
            const data = await res.json();
            const user = {
              display_name: data.display_name,
              id: data.id,
              email: data.email,
            };
            setCurrentUserWithPersistence(user);
          }
        } catch (error) {
          console.error('Error fetching user on mount:', error);
        }
      };
      fetchCurrentUser();
    }
  }, []);

  const value: AuthContextType = {
    token,
    currentUser,
    isAuthenticated,
    setToken,
    setCurrentUser: setCurrentUserWithPersistence,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
