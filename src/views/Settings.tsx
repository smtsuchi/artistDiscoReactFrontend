import React, { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { userApi } from '../services/api';
import '../css/Settings.css';

const Settings: React.FC = () => {
  const { userId, settings, updateSettings } = useUser();
  const [addToPlaylistOnLike, setAddToPlaylistOnLike] = useState(true);
  const [favOnLike, setFavOnLike] = useState(true);
  const [followOnLike, setFollowOnLike] = useState(true);
  const [adventurousness, setAdventurousness] = useState(0.5);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return;

      try {
        // GET settings merges every setting over its defaults, so a user
        // created before adventurousness existed still reads 0.5, not undefined.
        const result = await userApi.getSettings(userId);
        if (result.success && result.data) {
          setAddToPlaylistOnLike(result.data.add_to_playlist_on_like);
          setFavOnLike(result.data.fav_on_like);
          setFollowOnLike(result.data.follow_on_like);
          if (typeof result.data.adventurousness === 'number') {
            setAdventurousness(result.data.adventurousness);
          }
        } else {
          console.error('Error fetching settings:', result.error);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoaded(true);
      }
    };

    fetchSettings();
  }, [userId]);

  // updateSetting throws on failure now rather than returning {success:false}.
  const persist = async (
    name: 'add_to_playlist_on_like' | 'fav_on_like' | 'follow_on_like' | 'adventurousness',
    value: boolean | number
  ) => {
    try {
      await userApi.updateSetting(userId, name, value);
    } catch (error) {
      console.error(`Error updating ${name}:`, error);
    }
  };

  const handleATP = () => {
    const newVal = !addToPlaylistOnLike;
    updateSettings(newVal, followOnLike, favOnLike);
    setAddToPlaylistOnLike(newVal);
    persist('add_to_playlist_on_like', newVal);
  };

  const handleFav = () => {
    const newVal = !favOnLike;
    updateSettings(addToPlaylistOnLike, followOnLike, newVal);
    setFavOnLike(newVal);
    persist('fav_on_like', newVal);
  };

  const handleFollow = () => {
    const newVal = !followOnLike;
    updateSettings(addToPlaylistOnLike, newVal, favOnLike);
    setFollowOnLike(newVal);
    persist('follow_on_like', newVal);
  };

  // Debounced so dragging the slider doesn't fire a write per pixel. Deck calls
  // omit adventurousness entirely, so the stored value here is what they use.
  useEffect(() => {
    if (!loaded || !userId) return;
    const timer = setTimeout(() => persist('adventurousness', adventurousness), 400);
    return () => clearTimeout(timer);
  }, [adventurousness, loaded, userId]);

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

        <div className="adventurousness">
          <h3 className="border-gradient-purple">Adventurousness</h3>
          <input
            type="range"
            id="adventurousness"
            min={0}
            max={1}
            step={0.1}
            value={adventurousness}
            onChange={(e) => setAdventurousness(parseFloat(e.target.value))}
          />
          <div className="adventurousness-scale">
            <span>Familiar</span>
            <span>{Math.round(adventurousness * 100)}%</span>
            <span>Obscure</span>
          </div>
          <p className="adventurousness-hint">
            How far outside your usual taste new artists are drawn from.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
