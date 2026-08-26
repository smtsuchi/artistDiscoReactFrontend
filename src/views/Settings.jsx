import React, { Component } from 'react'
import "../css/Settings.css"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            current_playlist: '',
            add_to_playlist_on_like: true,
            fav_on_like: true,
            follow_on_like: true
        };
    
        this.handleATP = this.handleATP.bind(this);
        this.handleFav = this.handleFav.bind(this);
        this.handleFollow = this.handleFollow.bind(this);
        // this.handleSubmit = this.handleSubmit.bind(this);
    }

    async componentDidMount() {
        // Get settings from database
        if (this.props.current_user_id){
            let getres = await fetch(`${BACKEND_URL}/userData/settings/${this.props.current_user_id}`, {
                method: "GET"
            });
            let getdata = await getres.json();
            this.setState({
                current_playlist: getdata.current_playlist,
                add_to_playlist_on_like: getdata.add_to_playlist_on_like,
                fav_on_like: getdata.fav_on_like,
                follow_on_like : getdata.follow_on_like
            })
        }
    }
    
    handleATP = async (event) => {
        let newVal = !this.state.add_to_playlist_on_like
        this.props.updateSettings(newVal, this.state.follow_on_like, this.state.fav_on_like);
        this.setState((prevState) => {
           return {
                ...prevState,
                add_to_playlist_on_like: !prevState.add_to_playlist_on_like
            }
        })
        
        let raw = JSON.stringify({value: newVal});
        // console.log('atp', raw)
        
        let postres = await fetch(`${BACKEND_URL}/atp/${this.props.current_user_id}`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: raw
        });
        let postdata = await postres.json();
        // console.log(postdata);
    }

    handleFav = async (event) => {
        let newVal = !this.state.fav_on_like
        this.props.updateSettings(this.state.add_to_playlist_on_like, this.state.follow_on_like, newVal)
        this.setState((prevState) => {
           return {
                ...prevState,
                fav_on_like: !prevState.fav_on_like
            }
        });
        
        let raw = JSON.stringify({value: newVal});
        // console.log('fav', raw)
        let postres = await fetch(`${BACKEND_URL}/fav/${this.props.current_user_id}`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: raw
        });
        let postdata = await postres.json();
        // console.log(postdata);
    }

    handleFollow = async (event) => {
        let newVal = !this.state.follow_on_like
        this.props.updateSettings(this.state.add_to_playlist_on_like, newVal, this.state.fav_on_like)
        this.setState((prevState) => {
            return {
                ...prevState,
              follow_on_like: !prevState.follow_on_like
            }
        })
        
        let raw = JSON.stringify({value: newVal});
        // console.log('follow', raw)
        let postres = await fetch(`${BACKEND_URL}/follow/${this.props.current_user_id}`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: raw
        });
        let postdata = await postres.json();
        console.log(postdata);
    }
    
    render() {
        return (
            <div className= "settings-view">
                <div className="">
                    <form className="my-form">
                        <div className="cur_play"><h1>Current Genre: </h1>
                            <div><h3>{this.state.current_playlist}</h3></div>
                        </div>
                        <div className='desc'><h3 className="border-gradient-purple">On Swipe Right:</h3></div>
                        <div className="atp-txt txt"><h3>Add Preview Song to Playlist</h3></div>
                        <div className="atp">
                            <label className="switch" htmlFor="add_to_playlist_on_like">
                                <input type="checkbox" id="add_to_playlist_on_like" checked={this.state.add_to_playlist_on_like} onChange={this.handleATP}/>
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div className="fav-txt txt"><h3>Add Preview Song to Favorite</h3></div>
                        <div className="fav">
                            <label className="switch" htmlFor="fav_on_like">
                                <input type="checkbox" id="fav_on_like" checked={this.state.fav_on_like} onChange={this.handleFav}/>
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div className="fol-txt txt"><h3>Follow Artist Page</h3></div>
                        <div className="fol">
                            <label className="switch" htmlFor="follow_on_like">
                                <input type="checkbox" id="follow_on_like" checked={this.state.follow_on_like} onChange={this.handleFollow} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}
