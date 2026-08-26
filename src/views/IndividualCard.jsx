import React, { Component } from 'react'
import "../css/IndividualCard.css"
import { getJson } from '../api'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
export default class IndividualCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            current_artist: ''
        };
    }

    async componentDidMount(){
        // Returns the artist itself now, not {individual_card: ...}.
        let artist = await getJson(`${BACKEND_URL}/category/single/${this.props.current_user_id}/${this.props.category_name}`, {
            method: "GET"
        });
        this.setState({
            current_artist: artist
        })
    }

    render() {
        const a = this.state.current_artist;
        if (this.state.current_artist) {
            return (
                <div className="individual-view">
                    <div className="single-photo" style={{ backgroundImage: `url(${a.images[0].url})` }}>
                        <div className="info">
                            <h1>{a.name}</h1>
                            <h2>Follower Count: {a.followers.total}</h2>
                            <p>{a.id}</p>
                            <div className="genres">
                                <h3>Genres:</h3>
                                {a.genres.map( (genre) => (<h3>{genre}</h3>))}
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div className="individual-view">

            </div>
        )
    }
}
