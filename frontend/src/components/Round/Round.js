import React, { Component } from 'react'

import { Web3Context } from '../Web3Wrapper'

import { RoundStatus } from './RoundStatus'
import { RoundOutcomesWithStats } from './RoundOutcomesWithStats'
import { RoundStats } from './RoundStats'
import { RoundHost } from './RoundHost'
import { RoundQuestion } from './RoundQuestion'
import { RoundTimes } from './RoundTimes'
import { RoundFee } from './RoundFee'
import {
  LoadingRound,
  RoundNotFound,
  ToggleText,
  ButtonPrimary
} from '../generic'

import './Round.scss'



class Round extends Component {
  constructor(props) {
  	super(props)
    this.state = {
      hostAddress: null,
      hostName: null,
      hostId: props.match.params.hostId.toLowerCase(),
      // contract expects byte parameters to be prefixed with '0x'
      roundId: '0x' + props.match.params.roundId.toLowerCase(),

      status: null,
      createdAt: 0,
      endedAt: 0,
      timeoutAt: 0,
      question: '',
      numOutcomes: 0,
      numBets: 0,
      poolSize: 0,
      hostBonus: 0,
      hostFee: 0,
      outcomes: [],
      outcomesBetPool: [5000000000000000, 1200000000000000, 7000000000000000],
      outcomesBetNum: [23, 56, 11],
      outcomesMyBet: [500000000000000, 0, 5000000],
      outcomesWinShare: [0, 10, 90],

      selectedOutcome: null,
      areOutcomeStatsToggled: false,
      arePoolUnitsToggled: false
    }
  }

  componentDidMount = async () => {
    if(this.props.isAddress(this.state.hostId)) {
      this.setState({ hostAddress: this.state.hostId })
      this.props.getUserName(this.state.hostId).then(hostName => {
        this.setState({ hostName: hostName })
      })
    } else {
      this.setState({ hostName: this.state.hostId })
      const hostAddress = await this.props.getUserAddress(this.state.hostId)
      this.setState({ hostAddress: hostAddress })
    }
    this.getRound(this.state.hostAddress, this.state.roundId)
  }

  getRound = async(hostAddress, roundId) => {
    const status = await this.getRoundInfo(hostAddress, roundId)
    if (this.isValidRound(status)) {
      await this.getRoundOutcomes(hostAddress, roundId)
      //await this.getRoundOutcomePools(hostAddress, roundId)
      //await this.getRoundOutcomeNumBets(hostAddress, roundId)
      //await this.getMyRoundOutcomeBet(hostAddress, roundId)
      ///wait this.getRoundOutcomeWinShare(hostAddress, roundId)
    } else {
      // TODO: rework this so this error is reflected in the UI properly
      throw new Error('Fetched round is not valid')
    }
    console.log(this.state)
  }

  getRoundInfo = async () => {
    return new Promise((resolve, reject) => {
      this.props.betl && this.props.betl.getRoundInfo(this.state.hostId, this.state.roundId).then(r => {
        let [status, createdAt, endedAt, timeoutAt, question, numOutcomes, numBets, poolSize, hostBonus, hostFee] = r
        if (Number(status) === 0) reject()

        console.log('Success: getRoundInfo for roundId: ' + this.state.roundId)
        this.setState({
          status: Number(status),
          createdAt: Number(createdAt),
          endedAt: Number(endedAt),
          timeoutAt: Number(timeoutAt),
          question: this.props.web3.utils.hexToUtf8(question),
          numOutcomes: Number(numOutcomes),
          numBets: Number(numBets),
          poolSize: Number(poolSize),
          hostBonus: Number(hostBonus),
          hostFee: Number(hostFee),
        })
        resolve(Number(status))
      }).catch(err => {
        reject()
      })
    })
  }

  isValidRound = (status) => {
    return status < 7
  }

  getRoundOutcomes = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcome(
          this.state.hostId,
          this.state.roundId,
          i
        ).then(outcomeInHex => {
          resolve(this.props.web3.utils.hexToUtf8(outcomeInHex))
        })
      })
    })
    const outcomes = await Promise.all(promises)
    this.setState({ outcomes: outcomes })
  }

  getOutcomeId = (outcome) => {
    return this.props.web3.utils.sha3(outcome)
  }

  getRoundOutcomePools = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      const outcomeId = this.getOutcomeId(this.state.outcomes[i])
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcomePool(
          this.state.hostId,
          this.state.roundId,
          outcomeId
        ).then(wei => {
          const ether = this.props.web3.utils.fromWei(String(wei))
          resolve(ether)
        })
      })
    })
    const outcomePools = await Promise.all(promises)
    this.setState({ outcomesBetPool: outcomePools })
  }

  getRoundOutcomeNumBets = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      const outcomeId = this.getOutcomeId(this.state.outcomes[i])
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcomeNumBets(
          this.state.hostId,
          this.state.roundId,
          outcomeId
        ).then(r => {
          resolve(Number(r))
        })
      })
    })
    const outcomeNumBets = await Promise.all(promises)
    this.setState({ outcomesBetNum: outcomeNumBets })
  }

  getMyRoundOutcomeBet = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      const outcomeId = this.getOutcomeId(this.state.outcomes[i])
      return new Promise((resolve, reject) => {
        this.props.betl.getMyRoundOutcomeBet(
          this.state.hostId,
          this.state.roundId,
          outcomeId
        ).then(wei => {
          const ether = this.props.web3.utils.fromWei(String(wei))
          resolve(ether)
        })
      })
    })
    const outcomesMyBet = await Promise.all(promises)
    this.setState({ outcomesMyBet: outcomesMyBet })
    console.log(this.state)
  }

  getRoundOutcomeWinShare = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      const outcomeId = this.getOutcomeId(this.state.outcomes[i])
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcomeWinShare(
          this.state.hostId,
          this.state.roundId,
          outcomeId
        ).then(winShare => {
          resolve(Number(winShare))
        })
      })
    })
    const outcomesWinShare = await Promise.all(promises)
    this.setState({ outcomesWinShare: outcomesWinShare })
  }

  handleSelect = () => {
    console.log('handleSelect')
  }

  handleOutcomeStatsToggle = () => {
    this.setState({ areOutcomeStatsToggled: !this.state.areOutcomeStatsToggled })
  }

  handleUnitToggle = () => {
    this.setState({ arePoolUnitsToggled: !this.state.arePoolUnitsToggled })
  }
  
  render() {
    if (this.state.status === null) {
      return <LoadingRound />
    }
    if (this.state.status === 0) {
      return <RoundNotFound />
    }
    return (
      <div>
        <RoundHost
          hostAddress={this.state.hostAddress}
          hostName={this.state.hostName} />

        <RoundQuestion>
          {this.state.question}
        </RoundQuestion>

        <RoundTimes
          createdAt={this.state.createdAt}
          timeoutAt={this.state.timeoutAt} />

        <RoundStatus
          status={this.state.status} />

        <RoundStats
          bets={this.state.numBets}
          pool={this.state.poolSize}
          bonus={this.state.hostBonus}
          unitToggled={this.state.arePoolUnitsToggled}
          handleUnitToggle={this.handleUnitToggle} />
       
        <ToggleText
          theDefaultActive="BETS"
          theOther="#PLAYERS"
          toggled={this.state.areOutcomeStatsToggled} 
          handleToggle={this.handleOutcomeStatsToggle}
          alignLeft={false} />

        <RoundOutcomesWithStats
          status={this.state.status}
          numOutcomes={this.state.numOutcomes}
          outcomes={this.state.outcomes}
          winShares={this.state.outcomesWinShare}
          stats={this.state.areOutcomeStatsToggled
            ? this.state.outcomesBetNum
            : this.state.outcomesBetPool}
          statsSum={this.state.areOutcomeStatsToggled
            ? this.state.outcomesBetNum.reduce((a, b) => a + b, 0)
            : this.state.outcomesBetPool.reduce((a, b) => a + b, 0)}
          selectedOutcome={this.state.selectedOutcome}
          handleSelect={this.handleSelect} />
       
        <ButtonPrimary>
          Vote
        </ButtonPrimary>

        <RoundFee
          fee={this.state.hostFee} />
      </div>
    )
  }
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <Round {...props} {...context} />}
  </Web3Context.Consumer>
)