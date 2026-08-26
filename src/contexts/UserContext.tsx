import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserSettings } from '../types';
import { useAuth } from './AuthContext';
import { loadUserProfile } from '../services/profile';

interface UserContextType {
  userId: string;
  displayName: string;
  categoryNames: string[];
  settings: UserSettings;
  myPlaylist: string;
  /** Loading the backend profile is separate from being signed in. */
  profileStatus: 'idle' | 'loading' | 'ready' | 'error';
  profileError: string;
  loadProfile: () => void;
  setUserData: (data: {
    userId: string;
    displayName: string;
    categoryNames: string[];
    settings: UserSettings;
    myPlaylist: string;
  }) => void;
  updateSettings: (
    addToPlaylist: boolean,
    followOnLike: boolean,
    favOnLike: boolean
  ) => void;
  addCategory: (categoryName: string) => void;
  setCurrentPlaylist: (playlistName: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Initialize state from localStorage if available
  const getInitialState = () => {
    const savedData = localStorage.getItem('spotifyUserData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch {
        return null;
      }
    }
    return null;
  };

  const initialData = getInitialState();

  const [userId, setUserId] = useState<string>(initialData?.userId || '');
  const [displayName, setDisplayName] = useState<string>(initialData?.displayName || '');
  const [categoryNames, setCategoryNames] = useState<string[]>(initialData?.categoryNames || []);
  const [myPlaylist, setMyPlaylist] = useState<string>(initialData?.myPlaylist || '');
  const [settings, setSettings] = useState<UserSettings>(initialData?.settings || {
    current_playlist: null,
    add_to_playlist_on_like: true,
    follow_on_like: true,
    fav_on_like: true,
    adventurousness: 0.5,
  });

  const { currentUser } = useAuth();
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    initialData?.userId ? 'ready' : 'idle'
  );
  const [profileError, setProfileError] = useState('');

  const setUserData = (data: {
    userId: string;
    displayName: string;
    categoryNames: string[];
    settings: UserSettings;
    myPlaylist: string;
  }) => {
    setUserId(data.userId);
    setDisplayName(data.displayName);
    setCategoryNames(data.categoryNames);
    setSettings(data.settings);
    setMyPlaylist(data.myPlaylist);

    // Cache in localStorage with new key
    localStorage.setItem(
      'spotifyUserData',
      JSON.stringify({
        userId: data.userId,
        displayName: data.displayName,
        categoryNames: data.categoryNames,
        settings: data.settings,
        myPlaylist: data.myPlaylist,
      })
    );
  };

  const loadProfile = useCallback(async () => {
    if (!currentUser) return;
    setProfileStatus('loading');
    setProfileError('');
    try {
      const profile = await loadUserProfile(currentUser);
      setUserData(profile);
      setProfileStatus('ready');
    } catch (err) {
      console.error('Error loading profile:', err);
      setProfileError(err instanceof Error ? err.message : 'Could not load your profile.');
      setProfileStatus('error');
    }
  }, [currentUser]);

  // Bootstrap on boot rather than only after an OAuth redirect.
  useEffect(() => {
    if (currentUser && !userId && profileStatus === 'idle') {
      loadProfile();
    }
  }, [currentUser, userId, profileStatus, loadProfile]);

  const persistToLocalStorage = () => {
    localStorage.setItem(
      'spotifyUserData',
      JSON.stringify({
        userId,
        displayName,
        categoryNames,
        settings,
        myPlaylist,
      })
    );
  };

  const updateSettings = (
    addToPlaylist: boolean,
    followOnLike: boolean,
    favOnLike: boolean
  ) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        add_to_playlist_on_like: addToPlaylist,
        follow_on_like: followOnLike,
        fav_on_like: favOnLike,
      };
      // Persist after state update
      setTimeout(() => persistToLocalStorage(), 0);
      return newSettings;
    });
  };

  const addCategory = (categoryName: string) => {
    if (!categoryNames.includes(categoryName)) {
      setCategoryNames((prev) => {
        const newCategories = [...prev, categoryName];
        // Persist after state update
        setTimeout(() => persistToLocalStorage(), 0);
        return newCategories;
      });
    }
  };

  const setCurrentPlaylist = (playlistName: string) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        current_playlist: playlistName,
      };
      // Persist after state update
      setTimeout(() => persistToLocalStorage(), 0);
      return newSettings;
    });
  };

  const value: UserContextType = {
    userId,
    displayName,
    categoryNames,
    settings,
    myPlaylist,
    profileStatus,
    profileError,
    loadProfile,
    setUserData,
    updateSettings,
    addCategory,
    setCurrentPlaylist,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
