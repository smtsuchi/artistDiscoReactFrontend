import React, { Component } from 'react'
import SwipeCard from './SwipeCard';

export default class ArtistCards extends Component {
    render() {
        const a = this.props.artist;
        return (
            <div className="individual-card" id={a.id}>
                <SwipeCard ref={this.props.childRef} className="swipe" preventSwipe={['up','down']} onSwipe={(dir) => this.props.onSwipe(dir, a)} onCardLeftScreen={() => this.props.onCardLeftScreen(a.name, a.id)}>
                    <div className="photo-card" style={{ backgroundImage: `url(${a.images[0].url})` }}>
                        <h1>{a.name}</h1>
                        <div className="preview-track">
                            <img className='thmbnl' alt="Track Thumbnail" src={a.track_thumbnail}></img>
                            <div className="tckr"><h3 data-title={a.track_name} aria-label={a.track_name}>{a.track_name}</h3></div>
                            <div className="adctrl"><audio controls name='media'><source src={a.track_preview} type="audio/mpeg" /></audio></div>
                        </div>
                        <p>{a.id}</p>
                    </div>
                </SwipeCard>
            </div>
        )
    }
}
