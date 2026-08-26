import React, { Component } from 'react'
// import Cookies from 'js-cookie';
import "../css/GenreSelect.css"
import withRouter from '../withRouter'

class GenreSelect extends Component {
    constructor(props) {
        super(props);
        this.relog = this.relog.bind(this);
    }

    async letsRedirect(e) {
        e.preventDefault();
        const selected_index = e.target[0].options.selectedIndex;
        const category_name = e.target[0][selected_index].innerHTML;
        let response = await this.props.generateArtists(e);
        if (!response) { return }

        this.props.navigate('/', {
            state: {
                artist_id: response.buffer,
                first_time: response.first_time,
                category_name: category_name,
                current_user_id: this.props.current_user_id,
                atp: this.props.settings.add_to_playlist_on_like,
                fav: this.props.settings.fav_on_like,
                follow: this.props.settings.follow_on_like,
                my_playlist: this.props.my_playlist
            }
        })
    }

    relog(){
        this.props.navigate('/callback')
    }


    render() {
        // console.log('rendering genre access')
        let loggedin = this.props.checkLogin()
        if (loggedin.loggedin){
            return (
                <div className="main">
                    <div className="text"><h1>Select a Genre</h1></div>
                    
                    <div className="genreForm">
                        <form id='selectgenre' onSubmit={(e) => this.letsRedirect(e)}>
                            <select className='form-control' name="playlist" id="genres">
                                <option value="37i9dQZF1DX0XUsuxWHRQd">Hip Hop</option>
                                <option value="37i9dQZF1DXcBWIGoYBM5M">Pop</option>
                                <option value="37i9dQZF1DWXRqgorJj26U">Rock</option>
                                <option value="37i9dQZF1DX9tPFwDMOaN1">K-Pop</option>
                                <option value="37i9dQZF1DX4dyzvuaRJ0n">Electronic Dance Music</option>
                                <option value="37i9dQZF1DX10zKzsJ2jva">Latin Trap</option>
                                <option value="37i9dQZF1DX1lVhptIYRda">Country</option>
                                <option value="37i9dQZF1DX4SBhb3fqCJd">Contemporary R&B</option>
                                <option value="37i9dQZF1DX2Nc3B70tvx0">Indie Rock</option>
                                <option value="37i9dQZF1DX0KpeLFwA3tO">Punk Rock</option>
                                <option value="37i9dQZF1DXa8NOEUWPn9W">House Music</option>
                                <option value="37i9dQZF1DX82GYcclJ3Ug">Alternative Rock</option>
                                <option value="37i9dQZF1DWTx0xog3gN3q">Soul</option>
                                <option value="37i9dQZF1DWY7IeIP1cdjF">Reggaeton</option>
                                <option value="37i9dQZF1DWWQRwui0ExPn">Lo-Fi Music</option>
                                <option value="37i9dQZF1DWZgauS5j6pMv">Funk</option>
                                <option value="37i9dQZF1DX1MUPbVKMgJE">Disco</option>
                                <option value="37i9dQZF1DWWEJlAGA9gs0">Classical Music</option>
                                <option value="37i9dQZF1DWTR4ZOXTfd9K">Jazz</option>
                                <option value="37i9dQZF1DX7Qo2zphj7u3">Latin Music</option>
                                <option value="37i9dQZF1DWTcqUzwhNmKv">Metal</option>
                            </select>
                            <div className="submit"><button type='submit' form='selectgenre' className='button'>Submit</button></div>
                        </form>
                    </div>
                    <div className="loggedin"><h3>Logged in as: {loggedin.current_user_name}</h3></div>
                </div>
            )
        }
        return (
            <div className="main">
                <div className="text"><h1>Select a Genre</h1></div>
                
                <div className="genreForm">
                    <form id='selectgenre' onSubmit={(e) => this.letsRedirect(e)}>
                        <select className='form-control' name="playlist" id="genres">
                            <option value="37i9dQZF1DX0XUsuxWHRQd">Hip Hop</option>
                            <option value="37i9dQZF1DXcBWIGoYBM5M">Pop</option>
                            <option value="37i9dQZF1DWXRqgorJj26U">Rock</option>
                            <option value="37i9dQZF1DX9tPFwDMOaN1">K-Pop</option>
                            <option value="37i9dQZF1DX4dyzvuaRJ0n">Electronic Dance Music</option>
                            <option value="37i9dQZF1DX10zKzsJ2jva">Latin Trap</option>
                            <option value="37i9dQZF1DX1lVhptIYRda">Country</option>
                            <option value="37i9dQZF1DX4SBhb3fqCJd">Contemporary R&B</option>
                            <option value="37i9dQZF1DX2Nc3B70tvx0">Indie Rock</option>
                            <option value="37i9dQZF1DX0KpeLFwA3tO">Punk Rock</option>
                            <option value="37i9dQZF1DXa8NOEUWPn9W">House Music</option>
                            <option value="37i9dQZF1DX82GYcclJ3Ug">Alternative Rock</option>
                            <option value="37i9dQZF1DWTx0xog3gN3q">Soul</option>
                            <option value="37i9dQZF1DWY7IeIP1cdjF">Reggaeton</option>
                            <option value="37i9dQZF1DWWQRwui0ExPn">Lo-Fi Music</option>
                            <option value="37i9dQZF1DWZgauS5j6pMv">Funk</option>
                            <option value="37i9dQZF1DX1MUPbVKMgJE">Disco</option>
                            <option value="37i9dQZF1DWWEJlAGA9gs0">Classical Music</option>
                            <option value="37i9dQZF1DWTR4ZOXTfd9K">Jazz</option>
                            <option value="37i9dQZF1DX7Qo2zphj7u3">Latin Music</option>
                            <option value="37i9dQZF1DWTcqUzwhNmKv">Metal</option>
                        </select>
                        <div className="submit"><button type='submit' form='selectgenre' className='button'>Submit</button></div>
                    </form>
                </div>
                <div className="loggedin"><button id="login-btn" className="button" onClick={this.relog}>Re-Log In</button></div>
            </div>
        )
    }
}

export default withRouter(GenreSelect);
