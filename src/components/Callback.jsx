import React, { Component } from 'react'
import { Navigate } from 'react-router-dom'
// import { getHashParams } from '../getHash'

export default class Callback extends Component {
    constructor() {
        super();
        this.state = {
            data: {}
        }
    }

    async componentDidMount() {
        let res = await this.props.getCurrentUserData()
        // console.log('callback', res)
    }
    render() {
        if (true) {
            return <Navigate to="/genreselect" replace />
        }
        return (
            
            <div>
                Hi
            </div>
        )
    }
}
