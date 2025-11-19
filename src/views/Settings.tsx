import React, { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { userApi } from '../services/api';
import '../css/Settings.css';

const Settings: React.FC = () => {
  const { userId, settings, updateSettings } = useUser();
  const [addToPlaylistOnLike, setAddToPlaylistOnLike] = useState(true);
  const [favOnLike, setFavOnLike] = useState(true);
  const [followOnLike, setFollowOnLike] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return;

      try {
        const result = await userApi.getSettings(userId);
        if (result.success && result.data) {
          setAddToPlaylistOnLike(result.data.add_to_playlist_on_like);
          setFavOnLike(result.data.fav_on_like);
          setFollowOnLike(result.data.follow_on_like);
        } else {
          console.error('Error fetching settings:', result.error);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, [userId]);

  const handleATP = async () => {
    const newVal = !addToPlaylistOnLike;
    updateSettings(newVal, followOnLike, favOnLike);
    setAddToPlaylistOnLike(newVal);

    try {
      const result = await userApi.updateSetting(userId, 'add_to_playlist_on_like', newVal);
      if (!result.success) {
        console.error('Error updating ATP setting:', result.error);
      }
    } catch (error) {
      console.error('Error updating ATP setting:', error);
    }
  };

  const handleFav = async () => {
    const newVal = !favOnLike;
    updateSettings(addToPlaylistOnLike, followOnLike, newVal);
    setFavOnLike(newVal);

    try {
      const result = await userApi.updateSetting(userId, 'fav_on_like', newVal);
      if (!result.success) {
        console.error('Error updating fav setting:', result.error);
      }
    } catch (error) {
      console.error('Error updating fav setting:', error);
    }
  };

  const handleFollow = async () => {
    const newVal = !followOnLike;
    updateSettings(addToPlaylistOnLike, newVal, favOnLike);
    setFollowOnLike(newVal);

    try {
      const result = await userApi.updateSetting(userId, 'follow_on_like', newVal);
      if (!result.success) {
        console.error('Error updating follow setting:', result.error);
      }
    } catch (error) {
      console.error('Error updating follow setting:', error);
    }
  };

  return (
    <div className="settings-view">
      <div className="">
        <form className="my-form">
          <div className="cur_play">
            <h1>Current Genre: </h1>
            <div>
              <h3>{settings.current_playlist || 'None selected'}</h3>
            </div>
          </div>
          <div className="desc">
            <h3 className="border-gradient-purple">On Swipe Right:</h3>
          </div>
          <div className="atp-txt txt">
            <h3>Add Preview Song to Playlist</h3>
          </div>
          <div className="atp">
            <label className="switch" htmlFor="add_to_playlist_on_like">
              <input
                type="checkbox"
                id="add_to_playlist_on_like"
                checked={addToPlaylistOnLike}
                onChange={handleATP}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="fav-txt txt">
            <h3>Add Preview Song to Favorite</h3>
          </div>
          <div className="fav">
            <label className="switch" htmlFor="fav_on_like">
              <input
                type="checkbox"
                id="fav_on_like"
                checked={favOnLike}
                onChange={handleFav}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="fol-txt txt">
            <h3>Follow Artist Page</h3>
          </div>
          <div className="fol">
            <label className="switch" htmlFor="follow_on_like">
              <input
                type="checkbox"
                id="follow_on_like"
                checked={followOnLike}
                onChange={handleFollow}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
