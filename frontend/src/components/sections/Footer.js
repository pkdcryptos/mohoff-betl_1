import React, { Component } from 'react'

import './Footer.css'


class Footer extends Component {
  render = () => {
    return (
      <footer>
        <div className="content has-text-centered has-text-grey-light">
          <p><b>Betl</b></p>
          <p>Running on the Ethereum blockchain<br/>
          Built with React</p>
        </div>
      </footer>
    )
  }
}

export default Footer