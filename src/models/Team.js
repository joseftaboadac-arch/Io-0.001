const { TEAM_STATS } = require('../config/footballConstants');

class Team {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.shortName = data.shortName || data.name || '';
    this.country = data.country || '';
    this.league = data.league || '';
    this.leaguePosition = data.leaguePosition || null;
    this.leaguePoints = data.leaguePoints || 0;
    this.formations = data.formations || [];

    this.stats = data.stats || this.initializeStats();
    this.homeStats = data.homeStats || this.initializeVenueStats();
    this.awayStats = data.awayStats || this.initializeVenueStats();
    this.form = data.form || []; // ultimos partidos: 'W', 'D', 'L'
    this.matchHistory = data.matchHistory || [];
    this.injuries = data.injuries || [];
    this.suspensions = data.suspensions || [];

    this.lastUpdated = data.lastUpdated || new Date().toISOString();
  }

  generateId() {
    return 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  initializeStats() {
    return {
      [TEAM_STATS.WIN_PERCENTAGE]: 0,
      [TEAM_STATS.DRAW_PERCENTAGE]: 0,
      [TEAM_STATS.LOSS_PERCENTAGE]: 0,
      [TEAM_STATS.POINTS_PER_GAME]: 0,
      [TEAM_STATS.GOALS_SCORED_PER_GAME]: 0,
      [TEAM_STATS.GOALS_CONCEDED_PER_GAME]: 0,
      [TEAM_STATS.SHOTS_PER_GAME]: 0,
      [TEAM_STATS.SHOTS_ON_TARGET_PER_GAME]: 0,
      [TEAM_STATS.XG_PER_GAME]: 0,
      [TEAM_STATS.BTTS_RATE]: 0,
      [TEAM_STATS.OVER_25_RATE]: 0,
      [TEAM_STATS.CLEAN_SHEET_RATE]: 0,
      [TEAM_STATS.AVG_CORNERS]: 0,
      [TEAM_STATS.AVG_CARDS]: 0,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0
    };
  }

  initializeVenueStats() {
    return {
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winRate: 0,
      [TEAM_STATS.WIN_PERCENTAGE]: 0,
      [TEAM_STATS.GOALS_SCORED_PER_GAME]: 0,
      [TEAM_STATS.GOALS_CONCEDED_PER_GAME]: 0,
      [TEAM_STATS.BTTS_RATE]: 0,
      [TEAM_STATS.OVER_25_RATE]: 0,
      [TEAM_STATS.AVG_CORNERS]: 0
    };
  }

  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
    this.lastUpdated = new Date().toISOString();
  }

  updateHomeStats(newStats) {
    this.homeStats = { ...this.homeStats, ...newStats };
    this.homeStats.winRate = this.homeStats.matchesPlayed > 0
      ? (this.homeStats.wins / this.homeStats.matchesPlayed) * 100 : 0;
    this.homeStats[TEAM_STATS.WIN_PERCENTAGE] = this.homeStats.winRate;
    this.lastUpdated = new Date().toISOString();
  }

  updateAwayStats(newStats) {
    this.awayStats = { ...this.awayStats, ...newStats };
    this.awayStats.winRate = this.awayStats.matchesPlayed > 0
      ? (this.awayStats.wins / this.awayStats.matchesPlayed) * 100 : 0;
    this.awayStats[TEAM_STATS.WIN_PERCENTAGE] = this.awayStats.winRate;
    this.lastUpdated = new Date().toISOString();
  }

  setForm(formArray) {
    this.form = formArray;
    this.lastUpdated = new Date().toISOString();
  }

  addMatchToHistory(matchData) {
    this.matchHistory.push({ ...matchData, date: matchData.date || new Date().toISOString() });
    if (matchData.result) {
      this.form.unshift(matchData.result);
      if (this.form.length > 10) this.form = this.form.slice(0, 10);
    }
    this.lastUpdated = new Date().toISOString();
  }

  getCurrentForm(lastN = 5) {
    const recent = this.form.slice(0, lastN);
    const wins = recent.filter(r => r === 'W').length;
    const draws = recent.filter(r => r === 'D').length;
    const losses = recent.filter(r => r === 'L').length;
    // Puntos de forma: 3 por W, 1 por D, 0 por L, normalizado sobre maximo
    const points = wins * 3 + draws * 1;
    const maxPoints = recent.length * 3;
    return {
      matches: recent.length,
      wins,
      draws,
      losses,
      winRate: recent.length > 0 ? (wins / recent.length) * 100 : 0,
      formScore: maxPoints > 0 ? (points / maxPoints) * 100 : 0
    };
  }

  getHeadToHead(opponentId) {
    const matches = this.matchHistory.filter(m => m.opponentId === opponentId);
    const wins = matches.filter(m => m.result === 'W').length;
    const draws = matches.filter(m => m.result === 'D').length;
    const losses = matches.filter(m => m.result === 'L').length;
    return {
      totalMatches: matches.length,
      wins,
      draws,
      losses,
      winRate: matches.length > 0 ? (wins / matches.length) * 100 : 0
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      shortName: this.shortName,
      country: this.country,
      league: this.league,
      leaguePosition: this.leaguePosition,
      leaguePoints: this.leaguePoints,
      stats: this.stats,
      homeStats: this.homeStats,
      awayStats: this.awayStats,
      form: this.form,
      matchHistory: this.matchHistory,
      injuries: this.injuries,
      suspensions: this.suspensions,
      lastUpdated: this.lastUpdated
    };
  }

  toString() {
    return `${this.name} (${this.country}) - Pos: ${this.leaguePosition || 'N/A'}, PPG: ${this.stats[TEAM_STATS.POINTS_PER_GAME].toFixed(2)}`;
  }
}

module.exports = Team;
