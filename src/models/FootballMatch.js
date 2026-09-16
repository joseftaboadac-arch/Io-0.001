const { BET_TYPES } = require('../config/footballConstants');

class FootballMatch {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.league = data.league || '';
    this.season = data.season || '';
    this.round = data.round || 'Regular';
    this.date = data.date || new Date().toISOString();
    this.status = data.status || 'upcoming'; // upcoming, in_progress, completed, cancelled
    this.venue = data.venue || '';
    this.neutral = data.neutral || false;

    this.homeTeam = data.homeTeam || null;
    this.awayTeam = data.awayTeam || null;
    this.homeTeamId = data.homeTeamId || null;
    this.awayTeamId = data.awayTeamId || null;

    this.result = data.result || null; // { homeGoals, awayGoals, winner }
    this.htResult = data.htResult || null; // { homeGoals, awayGoals }
    this.stats = data.stats || this.initializeStats();
    this.odds = data.odds || this.initializeOdds();
    this.betHistory = data.betHistory || [];

    this.lastUpdated = data.lastUpdated || new Date().toISOString();
  }

  generateId() {
    return 'fmatch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  initializeStats() {
    return {
      home: {
        possession: 0, shots: 0, shotsOnTarget: 0, corners: 0,
        fouls: 0, yellowCards: 0, redCards: 0, offsides: 0, xG: 0
      },
      away: {
        possession: 0, shots: 0, shotsOnTarget: 0, corners: 0,
        fouls: 0, yellowCards: 0, redCards: 0, offsides: 0, xG: 0
      }
    };
  }

  initializeOdds() {
    return {
      [BET_TYPES.MATCH_WINNER]: { home: null, draw: null, away: null },
      [BET_TYPES.DOUBLE_CHANCE]: { homeDraw: null, homeAway: null, drawAway: null },
      [BET_TYPES.OVER_UNDER_GOALS]: [], // [{ line, over, under }]
      [BET_TYPES.BOTH_TEAMS_SCORE]: { yes: null, no: null },
      [BET_TYPES.ASIAN_HANDICAP]: [],
      [BET_TYPES.CORRECT_SCORE]: [],
      lastUpdated: null
    };
  }

  setTeams(homeTeam, awayTeam) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.homeTeamId = homeTeam ? homeTeam.id : null;
    this.awayTeamId = awayTeam ? awayTeam.id : null;
    this.lastUpdated = new Date().toISOString();
  }

  setResult(result) {
    this.result = result;
    this.status = 'completed';
    this.lastUpdated = new Date().toISOString();
  }

  setHTResult(htResult) {
    this.htResult = htResult;
    this.lastUpdated = new Date().toISOString();
  }

  updateOdds(betType, oddsData) {
    if (this.odds[betType]) {
      if (Array.isArray(this.odds[betType])) {
        this.odds[betType] = oddsData;
      } else {
        this.odds[betType] = { ...this.odds[betType], ...oddsData };
      }
      this.odds.lastUpdated = new Date().toISOString();
    }
    this.lastUpdated = new Date().toISOString();
  }

  isCompleted() { return this.status === 'completed'; }
  isInProgress() { return this.status === 'in_progress'; }
  isUpcoming() { return this.status === 'upcoming'; }

  getTotalGoals() {
    if (!this.result) return 0;
    return (this.result.homeGoals || 0) + (this.result.awayGoals || 0);
  }

  getWinner() {
    if (!this.result) return null;
    if (this.result.homeGoals > this.result.awayGoals) return 'home';
    if (this.result.awayGoals > this.result.homeGoals) return 'away';
    return 'draw';
  }

  getTeamNames() {
    const home = this.homeTeam ? this.homeTeam.name : this.homeTeamId || 'TBD';
    const away = this.awayTeam ? this.awayTeam.name : this.awayTeamId || 'TBD';
    return { home, away };
  }

  getScoreString() {
    if (!this.result) return 'N/A';
    return `${this.result.homeGoals} - ${this.result.awayGoals}`;
  }

  toJSON() {
    return {
      id: this.id,
      league: this.league,
      season: this.season,
      round: this.round,
      date: this.date,
      status: this.status,
      venue: this.venue,
      neutral: this.neutral,
      homeTeam: this.homeTeam ? this.homeTeam.toJSON() : null,
      awayTeam: this.awayTeam ? this.awayTeam.toJSON() : null,
      homeTeamId: this.homeTeamId,
      awayTeamId: this.awayTeamId,
      result: this.result,
      htResult: this.htResult,
      stats: this.stats,
      odds: this.odds,
      betHistory: this.betHistory,
      lastUpdated: this.lastUpdated
    };
  }

  toString() {
    const { home, away } = this.getTeamNames();
    const score = this.isCompleted() ? ` (${this.getScoreString()})` : '';
    return `${this.league} - ${home} vs ${away}${score}`;
  }
}

module.exports = FootballMatch;
