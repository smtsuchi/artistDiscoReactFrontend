import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import '../css/Header.css';

// Inlined rather than imported from @mui/icons-material: that one icon dragged
// in @mui/material and @emotion/* for a single 24x24 glyph.
const QueueMusicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
  </svg>
);

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
