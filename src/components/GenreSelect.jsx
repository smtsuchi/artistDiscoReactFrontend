import React, { Component } from 'react'
import "../css/GenreSelect.css"
import withRouter from '../withRouter'

const GENRES = [
    ['37i9dQZF1DX0XUsuxWHRQd', 'Hip Hop'],
    ['37i9dQZF1DXcBWIGoYBM5M', 'Pop'],
    ['37i9dQZF1DWXRqgorJj26U', 'Rock'],
    ['37i9dQZF1DX9tPFwDMOaN1', 'K-Pop'],
    ['37i9dQZF1DX4dyzvuaRJ0n', 'Electronic Dance Music'],
    ['37i9dQZF1DX10zKzsJ2jva', 'Latin Trap'],
    ['37i9dQZF1DX1lVhptIYRda', 'Country'],
    ['37i9dQZF1DX4SBhb3fqCJd', 'Contemporary R&B'],
    ['37i9dQZF1DX2Nc3B70tvx0', 'Indie Rock'],
    ['37i9dQZF1DX0KpeLFwA3tO', 'Punk Rock'],
    ['37i9dQZF1DXa8NOEUWPn9W', 'House Music'],
    ['37i9dQZF1DX82GYcclJ3Ug', 'Alternative Rock'],
    ['37i9dQZF1DWTx0xog3gN3q', 'Soul'],
    ['37i9dQZF1DWY7IeIP1cdjF', 'Reggaeton'],
    ['37i9dQZF1DWWQRwui0ExPn', 'Lo-Fi Music'],
    ['37i9dQZF1DWZgauS5j6pMv', 'Funk'],
    ['37i9dQZF1DX1MUPbVKMgJE', 'Disco'],
    ['37i9dQZF1DWWEJlAGA9gs0', 'Classical Music'],
    ['37i9dQZF1DWTR4ZOXTfd9K', 'Jazz'],
    ['37i9dQZF1DX7Qo2zphj7u3', 'Latin Music'],
    ['37i9dQZF1DWTcqUzwhNmKv', 'Metal']
];

class GenreSelect extends Component {
    constructor(props) {
        super(props);
        this.state = { submitting: false, submit_error: '' };
        this.letsRedirect = this.letsRedirect.bind(this);
    }

    async letsRedirect(e) {
        e.preventDefault();
        const selected_index = e.target[0].options.selectedIndex;
        const category_name = e.target[0][selected_index].innerHTML;

        this.setState({ submitting: true, submit_error: '' });
        let response;
        try {
            response = await this.props.generateArtists(e);
        } catch (err) {
            this.setState({ submitting: false, submit_error: err.message });
            return
        }
        if (!response) {
            this.setState({ submitting: false, submit_error: 'Could not start a deck. Try signing in again.' });
            return
        }

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

    /**
     * Being signed in and having a profile loaded are different things, and
     * this footer is where that distinction used to get lost — a backend
     * failure rendered a "Re-Log In" button at an already-authenticated user,
     * which could never fix it because the token was never the problem.
     */
    renderStatus() {
        const { loggedin, current_user_name, profile_status, profile_error } = this.props.checkLogin();

        if (!loggedin) {
            return <h3>Not signed in.</h3>
        }
        if (profile_status === 'loading') {
            return <h3>Loading your profile…</h3>
        }
        if (profile_status === 'error') {
            return (
                <div className="profile-problem">
                    <h3>Signed in, but your profile could not be loaded.</h3>
                    <div className="auth-detail">{profile_error}</div>
                    <button className="button" onClick={() => this.props.loadProfile()}>Retry</button>
                    <button className="button" onClick={() => this.props.reset()}>Sign out</button>
                </div>
            )
        }
        return <h3>Logged in as: {current_user_name}</h3>
    }

    render() {
        const ready = this.props.checkLogin().profile_status === 'ready';
        return (
            <div className="main">
                <div className="text"><h1>Select a Genre</h1></div>

                <div className="genreForm">
                    <form id='selectgenre' onSubmit={this.letsRedirect}>
                        <select className='form-control' name="playlist" id="genres">
                            {GENRES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                        </select>
                        <div className="submit">
                            <button type='submit' form='selectgenre' className='button' disabled={!ready || this.state.submitting}>
                                {this.state.submitting ? 'Loading…' : 'Submit'}
                            </button>
                        </div>
                    </form>
                    {this.state.submit_error && <div className="auth-detail error">{this.state.submit_error}</div>}
                </div>

                <div className="loggedin">{this.renderStatus()}</div>
            </div>
        )
    }
}

export default withRouter(GenreSelect);
