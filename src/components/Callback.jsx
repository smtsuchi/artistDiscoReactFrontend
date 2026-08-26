import React, { Component } from 'react'
import { Navigate } from 'react-router-dom'

/**
 * Waiting room for the OAuth return trip.
 *
 * This used to render <Navigate to="/genreselect"> unconditionally on its very
 * first render — before componentDidMount had even fired, let alone before the
 * profile finished loading. So we always landed on the genre screen with no
 * user data, and any failure along the way vanished silently.
 */
export default class Callback extends Component {
    componentDidMount() {
        // App already kicks this off on boot; this covers landing here directly.
        if (this.props.profile_status === 'idle') {
            this.props.loadProfile();
        }
    }

    render() {
        const { profile_status, profile_error } = this.props;

        if (profile_status === 'ready') {
            return <Navigate to="/genreselect" replace />
        }

        if (profile_status === 'error') {
            return (
                <div className="media-container">
                    <div className="landing-page photo">
                        <div className="auth-status error">
                            Signed in to Spotify, but your profile could not be loaded.
                            <div className="auth-detail">{profile_error}</div>
                        </div>
                        <button className="btn" onClick={() => this.props.loadProfile()}>Try again</button>
                        <button className="btn" onClick={() => this.props.reset()}>Sign out</button>
                    </div>
                </div>
            )
        }

        return (
            <div className="media-container">
                <div className="landing-page photo">
                    <div className="auth-status">Setting up your account…</div>
                </div>
            </div>
        )
    }
}
