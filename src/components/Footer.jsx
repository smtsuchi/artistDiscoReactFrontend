import React, { Component } from 'react'

export default class Footer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            // exButton: React.createRef()
        }
        this.swipeLeft = this.swipeLeft.bind(this);
        this.swipeRight = this.swipeRight.bind(this);

    }

    // componentDidMount() {
    //     this.exButton = React.createRef()
    // }

    swipeLeft(e) {
        if (!this.props.exButton.current.getAttribute("disabled")) {
            this.props.swipe('left')
        }
        if (this.props.exButton) {
            this.props.exButton.current.setAttribute("disabled", "disabled");
        }
    }
    swipeRight() {
        if (!this.props.exButton.current.getAttribute("disabled")) {
            this.props.swipe('right')
        }
        if (this.props.exButton) {
            this.props.exButton.current.setAttribute("disabled", "disabled");
        }
    }
    render() {
        return (
            <div className="footer">
                <div className="ex foot" onClick={this.swipeLeft} ref={this.props.exButton} ><i id='ex' className="fas fa-times"></i></div>
                <div className="heart foot" onClick={this.swipeRight} ><i id='heart' className="fas fa-heart"></i></div>
            </div>
        )
    }
}
