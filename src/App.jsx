import React, { Component } from "react";
import Cookies from 'js-cookie';
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Callback from "./components/Callback";
import "./css/App.css"
import GenreSelect from "./components/GenreSelect";
import SwipePage from "./views/SwipePage";
import Settings from "./views/Settings"
import IndividualCard from "./views/IndividualCard";
import Login from "./components/Login";
import SpotifyLoginButton from "./components/SpotifyLoginButton";
import { completeLogin, hasAuthResponse, canRefresh, refreshToken, logout } from "./spotifyAuth";
import { getJson } from "./api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default class App extends Component {
  constructor() {
    super();

    const spotifyUser = localStorage.getItem('spotifyUser');
    // if (spotifyUser){
    //   const foundUser = JSON.parse(spotifyUser);
    //   this.state = {
    //     access_token: Cookies.get('spotifyAuthToken'),
    //     current_user: foundUser.current_user,
    //     current_user_id: foundUser.current_user_id,
    //     category_names: foundUser.category_names,
    //     settings: foundUser.settings,
    //     my_playlist: foundUser.my_playlist
    //   }
    // } else {
      this.state = {
        access_token: Cookies.get('spotifyAuthToken'),
        current_user: '',
        current_user_id: '',
        category_names: [],
        settings: {current_playlist: null, add_to_playlist_on_like: true, follow_on_like: true, fav_on_like: true},
        my_playlist: '',
        // Spotify has redirected us back with a ?code=, or we have a refresh
        // token to spend — either way, hold off rendering until it resolves.
        auth_pending: hasAuthResponse() || (!Cookies.get('spotifyAuthToken') && canRefresh()),
        auth_error: '',
        // Loading the backend profile is a SEPARATE concern from being signed
        // in. Treating "no profile" as "logged out" is what made a dead
        // backend show a login prompt to an already-authenticated user.
        profile_status: 'idle', // idle | loading | ready | error
        profile_error: ''
      }
    // }
    this.returning_from_spotify = hasAuthResponse();
    this.loadProfile = this.loadProfile.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.getCurrentUserData = this.getCurrentUserData.bind(this);
    this.generateArtists = this.generateArtists.bind(this);
    this.reset = this.reset.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.checkLogin = this.checkLogin.bind(this);
  }

  async componentDidMount() {
    let token = Cookies.get('spotifyAuthToken');

    if (this.state.auth_pending) {
      try {
        token = this.returning_from_spotify ? await completeLogin() : await refreshToken();
        this.setState({access_token: token, auth_pending: false})
      } catch (err) {
        logout();
        this.setState({auth_pending: false, auth_error: err.message})
        return
      }
    }

    // Load the profile whenever we hold a token — not only after an OAuth
    // redirect. Previously this ran solely from /callback, so a refresh or a
    // deep link left current_user empty forever.
    if (token) { this.loadProfile() }
  }

  async loadProfile() {
    if (this.state.profile_status === 'loading') { return }
    this.setState({profile_status: 'loading', profile_error: ''})
    try {
      await this.getCurrentUserData();
      this.setState({profile_status: 'ready'})
    } catch (err) {
      // A 401 means the token itself is dead, which re-authenticating does fix.
      // Anything else is a backend problem, and bouncing the user to the login
      // screen would just be a lie.
      if (err.status === 401) {
        logout();
        this.setState({
          access_token: undefined,
          current_user: '',
          current_user_id: '',
          profile_status: 'idle',
          auth_error: 'Your Spotify session expired. Please sign in again.'
        })
        return
      }
      this.setState({profile_status: 'error', profile_error: err.message})
    }
  }

  reset(){
    logout();
    this.setState({
      access_token: undefined,
      current_user: '',
      current_user_id: '',
      category_names: [],
      my_playlist: ''
    })
  }

  updateSettings(atp, follow, fav) {
    let updatedSettings = {current_playlist: this.state.settings.current_playlist, add_to_playlist_on_like: atp, follow_on_like: follow, fav_on_like: fav}
    this.setState({
      settings: updatedSettings
    })
  }

  async getCurrentUser() {
    // console.log('getting current user');
    let data = await getJson('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + Cookies.get('spotifyAuthToken')
      }
    })
    // console.log('spotify get cur_user', data)
    // this.setState({
    //   current_user: data.display_name,
    //   current_user_id: data.id
    // })
    return data
  }

  async getCurrentUserData() {
    const my_current_spotify = await this.getCurrentUser();
    // console.log('getting current user data from backend');
    // getJson maps the backend's 404 ("no such user yet") to null, which is the
    // create-a-profile branch below.
    let data = await getJson(`${BACKEND_URL}/userData/${my_current_spotify.id}`, {
      method: 'GET'
    })
    // console.log('this backend', data)
    if (data) {
      const user={
        current_user: my_current_spotify.display_name,
        current_user_id: my_current_spotify.id,
        category_names: data.category_names,
        settings: data.settings,
        my_playlist: data.my_playlist
      }
      this.setState(user)
      localStorage.setItem('spotifyUser', JSON.stringify(user ))
      return data
    } else {
      // Create User Profile
      let urlencoded = new URLSearchParams();
      urlencoded.append("user_id", my_current_spotify.id);

      let raw = JSON.stringify({
        "name": "Curated by Artist Disco",
        "description": "Your new playlist playlist curated by Artist Disco! Ever time you swipe right, your songs will be added here.",
        "public": true
      });
      let playlist_res = await fetch(`https://api.spotify.com/v1/users/${my_current_spotify.id}/playlists`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "Bearer " + Cookies.get('spotifyAuthToken')
        },
        body: raw
      });
      let playlist_data = await playlist_res.json();
      // console.log('playlist_data', playlist_data)
      urlencoded.append("my_playlist", playlist_data.id);
      
      // add cover art

      // Returns the created user document itself now, not {createdUser: ...}.
      let createdUser = await getJson(`${BACKEND_URL}/userData`, {
        method: 'POST',
        body: urlencoded
      });
      // console.log('just created a new user', createdUser)
      this.setState({
        current_user: my_current_spotify.display_name,
        current_user_id: my_current_spotify.id,
        category_names: createdUser.category_names,
        settings: createdUser.settings,
        my_playlist: playlist_data.id
      })
      return postdata
    }
  }

  async generateArtists(e) {
    e.preventDefault();
    // console.log(e);
    const selected_index = e.target[0].options.selectedIndex;
    const category_name = e.target[0][selected_index].innerHTML;
    // console.log(category_name);
    
    if (this.state.category_names.includes(category_name)) {
      // Load the saved database data
      // Returns the category document itself now, not {myCategory: ...}.
      let category = await getJson(`${BACKEND_URL}/category/${this.state.current_user_id}/${category_name}`, {
        method: "GET"
      })
      let buffer = category.buffer

      let mySettings = this.state.settings;
      mySettings.current_playlist = category_name;

      this.setState({
        settings: mySettings
      })

      return {buffer:buffer, first_time: false}
    }
    else {
      if (Cookies.get('spotifyAuthToken')){
        // Create new category: initialize with data from the API call
        let playlist_id=e.target[0].value;
        let res = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?market=US`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + Cookies.get('spotifyAuthToken')
          }
        })
        let data = await res.json()
        
        let buffer = data.items.map(d => d.track.artists[0].id)

        // add buffer to Database: category
        let urlencoded = new URLSearchParams();
        urlencoded.append("category_name", category_name);
        urlencoded.append("buffer", buffer);
        let postres = await fetch(`${BACKEND_URL}/category/${this.state.current_user_id}`, {
          method: "POST",
          body: urlencoded
        })
        let postdata = await postres.json()
        // console.log(postdata)

        let mySettings = this.state.settings;
        mySettings.current_playlist = category_name;

        this.setState({
          category_names: this.state.category_names.concat(category_name),
          settings: mySettings
        })

        return {buffer:buffer, first_time: true}
      }
      else {this.reset()}
    }
  }

  checkLogin(){
    // Signed in is about holding a Spotify token. The display name only shows
    // up once the backend profile loads, so it must not gate "logged in".
    return {
      loggedin: !!Cookies.get('spotifyAuthToken'),
      current_user_name: this.state.current_user,
      profile_status: this.state.profile_status,
      profile_error: this.state.profile_error
    }
  }

  render () {
    const token = Cookies.get('spotifyAuthToken')

    if (this.state.auth_pending) {
      return (
        <div className="App">
          <div className="media-container">
            <div className="landing-page photo">
              <div className="auth-status">Signing you in…</div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="App">
        {token||this.state.current_user_id ? (
        <>
          <Header my_playlist={this.state.my_playlist} settings={this.state.settings} current_user_id={this.state.current_user_id}/>
            <Routes>
              <Route path="/callback" element={<Callback profile_status={this.state.profile_status} profile_error={this.state.profile_error} loadProfile={this.loadProfile} reset={this.reset}/>} />
              <Route path="/" element={<SwipePage />} />
              <Route path="/artistdetails" element={<IndividualCard current_user_id={this.state.current_user_id} category_name={this.state.settings.current_playlist} />} />
              <Route path="/settings" element={<Settings updateSettings={this.updateSettings} current_user_id={this.state.current_user_id} settings={this.state.settings} />} />
              <Route path="/genreselect" element={<GenreSelect checkLogin={this.checkLogin} loadProfile={this.loadProfile} reset={this.reset} my_playlist={this.state.my_playlist} settings={this.state.settings} generateArtists={this.generateArtists} current_user_id={this.state.current_user_id} category_names={this.state.category_names}/>} />
              <Route path="/login" element={<Login reset={this.reset} />} />
            </Routes>
        </>
      ) : (
        // Display the login page
        <div className="media-container">
          <div className="landing-page photo">
            <SpotifyLoginButton />
            {this.state.auth_error && (
              <div className="auth-status error">Could not sign in: {this.state.auth_error}</div>
            )}
          </div>
        </div>
      )}
      </div>
    );
  }
}
