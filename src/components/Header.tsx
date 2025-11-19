import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import { useUser } from '../contexts/UserContext';
import '../css/Header.css';

const Header: React.FC = () => {
  const { settings, userId, myPlaylist } = useUser();
  const navigate = useNavigate();

  const regenerateArtists = () => {
    if (settings && settings.current_playlist) {
      // Navigate back to SwipePage with current playlist
      navigate('/', {
        state: {
          first_time: false,
          category_name: settings.current_playlist,
          current_user_id: userId,
          atp: settings.add_to_playlist_on_like,
          fav: settings.fav_on_like,
          follow: settings.follow_on_like,
          my_playlist: myPlaylist,
        },
      });
    }
  };

  return (
    <div className="header">
      <div className="appbtn">
        <div className="spread" id="appbtn" onClick={regenerateArtists}>
          <i className="fas fa-clone"></i>
        </div>
      </div>
      <div className="playlistbtn">
        <Link className="spread" id="playlistbtn" to="/artistdetails">
          <i className="fas fa-id-badge"></i>
        </Link>
      </div>
      <div className="sparebtn">
        <Link className="spread" to="/settings">
          <i className="fas fa-user-cog"></i>
        </Link>
      </div>
      <div className="profbtn">
        <Link className="spread" to="/genreselect">
          <QueueMusicIcon id="mui" className="fas fa-music" />
        </Link>
      </div>
    </div>
  );
};

export default Header;
