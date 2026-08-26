import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import "../css/Header.css";
import withRouter from '../withRouter';

const QueueMusicIcon = (props) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
        <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
);

class Header extends Component {
    constructor(props) {
        super(props);
        this.regenerateArtists = this.regenerateArtists.bind(this);
    }

    regenerateArtists() {
        // console.log('regen')
        if (this.props.settings) {
            if (this.props.settings.current_playlist){
                // Load the saved database data
                this.props.navigate('/', {
                    state: {
                        first_time: false,
                        category_name: this.props.settings.current_playlist,
                        current_user_id: this.props.current_user_id,
                        atp: this.props.settings.add_to_playlist_on_like,
                        fav: this.props.settings.fav_on_like,
                        follow: this.props.settings.follow_on_like,
                        my_playlist: this.props.my_playlist
                    }
                })
            }
        }
    }


    render() {
        return (
            <div className='header'>
                <div className='appbtn'><div className='spread' id='appbtn'  onClick={this.regenerateArtists} ><i className="fas fa-clone"></i></div></div>
                <div className='playlistbtn'><Link className='spread' id='playlistbtn' to="/artistdetails"><i className="fas fa-id-badge"></i></Link></div>
                <div className='sparebtn'><Link className='spread' to="/settings"><i className="fas fa-user-cog"></i></Link></div>
                <div className='profbtn'><Link className='spread' to="/genreselect"><QueueMusicIcon id="mui" className="fas fa-music" /></Link></div>
            </div>
        )
    }
}

export default withRouter(Header);
