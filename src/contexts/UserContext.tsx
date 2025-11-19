import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserSettings } from '../types';

interface UserContextType {
  userId: string;
  displayName: string;
  categoryNames: string[];
  settings: UserSettings;
  myPlaylist: string;
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
  });

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
