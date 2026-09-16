const { TEAM_STATS, BET_TYPES, PREDICTION_WEIGHTS, LEAGUES, TOP_LEAGUES } = require('../config/footballConstants');
const Team = require('../models/Team');
const FootballMatch = require('../models/FootballMatch');

/**
 * Cerebro Robot de Futbol
 * Motor de analisis y prediccion de resultados para apuestas deportivas.
 */
class FootballAnalyzer {
  constructor() {
    this.teams = new Map();
    this.matches = new Map();
    this.statistics = {
      global: {
        totalMatches: 0,
        homeWinRate: 0,
        drawRate: 0,
        awayWinRate: 0,
        avgGoals: 0,
        bttsRate: 0,
        over25Rate: 0
      }
    };
  }

  addTeam(teamData) {
    const team = new Team(teamData);
    this.teams.set(team.id, team);
    return team;
  }

  addMatch(matchData) {
    const match = new FootballMatch(matchData);
    this.matches.set(match.id, match);
    if (match.isCompleted()) {
      this.updateGlobalStatistics(match);
    }
    return match;
  }

  updateGlobalStatistics(match) {
    const g = this.statistics.global;
    const total = match.getTotalGoals();
    const n = g.totalMatches;
    g.avgGoals = (g.avgGoals * n + total) / (n + 1);

    const winner = match.getWinner();
    let homeWins = g.homeWinRate / 100 * n;
    let draws = g.drawRate / 100 * n;
    let awayWins = g.awayWinRate / 100 * n;
    if (winner === 'home') homeWins++;
    else if (winner === 'draw') draws++;
    else if (winner === 'away') awayWins++;

    g.totalMatches = n + 1;
    g.homeWinRate = (homeWins / g.totalMatches) * 100;
    g.drawRate = (draws / g.totalMatches) * 100;
    g.awayWinRate = (awayWins / g.totalMatches) * 100;

    const btts = match.result.homeGoals > 0 && match.result.awayGoals > 0 ? 1 : 0;
    const over25 = total > 2.5 ? 1 : 0;
    let bttsCount = g.bttsRate / 100 * n + btts;
    let overCount = g.over25Rate / 100 * n + over25;
    g.bttsRate = (bttsCount / g.totalMatches) * 100;
    g.over25Rate = (overCount / g.totalMatches) * 100;
  }

  getTeam(teamId) { return this.teams.get(teamId); }
  getMatch(matchId) { return this.matches.get(matchId); }
  getAllTeams() { return Array.from(this.teams.values()); }
  getAllMatches() { return Array.from(this.matches.values()); }
  getUpcomingMatches() { return this.getAllMatches().filter(m => m.isUpcoming()); }
  getCompletedMatches() { return this.getAllMatches().filter(m => m.isCompleted()); }

  searchTeams(query) {
    const q = query.toLowerCase();
    return this.getAllTeams().filter(t =>
      t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q)
    );
  }

  searchMatchesByLeague(leagueName) {
    const q = leagueName.toLowerCase();
    return this.getAllMatches().filter(m => m.league.toLowerCase().includes(q));
  }

  getMatchesByLeague(league) {
    return this.getAllMatches().filter(m => m.league === league);
  }

  /**
   * Analiza un enfrentamiento entre dos equipos (local vs visitante)
   */
  analyzeMatch(homeTeamId, awayTeamId) {
    const home = this.getTeam(homeTeamId);
    const away = this.getTeam(awayTeamId);
    if (!home || !away) {
      throw new Error('Uno o ambos equipos no existen');
    }

    return {
      home: this.teamSummary(home, 'home'),
      away: this.teamSummary(away, 'away'),
      headToHead: home.getHeadToHead(away.id),
      predictions: this.predictMatchOutcome(home, away),
      recommendations: this.generateRecommendations(home, away)
    };
  }

  teamSummary(team, venue) {
    const venueStats = venue === 'home' ? team.homeStats : team.awayStats;
    return {
      id: team.id,
      name: team.name,
      league: team.league,
      leaguePosition: team.leaguePosition,
      pointsPerGame: team.stats[TEAM_STATS.POINTS_PER_GAME],
      overallForm: team.getCurrentForm(),
      venueWinRate: venueStats.winRate || 0,
      venueGoalsFor: venueStats[TEAM_STATS.GOALS_SCORED_PER_GAME] || 0,
      venueGoalsAgainst: venueStats[TEAM_STATS.GOALS_CONCEDED_PER_GAME] || 0,
      bttsRate: team.stats[TEAM_STATS.BTTS_RATE] || 0,
      over25Rate: team.stats[TEAM_STATS.OVER_25_RATE] || 0,
      cleanSheetRate: team.stats[TEAM_STATS.CLEAN_SHEET_RATE] || 0,
      avgCorners: team.stats[TEAM_STATS.AVG_CORNERS] || 0,
      injuries: team.injuries.length,
      suspensions: team.suspensions.length
    };
  }

  /**
   * Predice el resultado del partido (1X2 + goles + mercados)
   */
  predictMatchOutcome(home, away) {
    const probs = this.calculateProbabilities(home, away);
    const goals = this.predictGoals(home, away);

    const outcomes = [
      { result: 'home', prob: probs.home, label: `Gana ${home.name}` },
      { result: 'draw', prob: probs.draw, label: 'Empate' },
      { result: 'away', prob: probs.away, label: `Gana ${away.name}` }
    ].sort((a, b) => b.prob - a.prob);

    const favorite = outcomes[0];
    const confidence = this.confidenceLevel(favorite.prob);

    return {
      matchWinner: {
        homeProbability: probs.home.toFixed(2) + '%',
        drawProbability: probs.draw.toFixed(2) + '%',
        awayProbability: probs.away.toFixed(2) + '%',
        favorite: favorite.label,
        favoriteResult: favorite.result,
        confidence
      },
      doubleChance: {
        homeDraw: (probs.home + probs.draw).toFixed(2) + '%',
        homeAway: (probs.home + probs.away).toFixed(2) + '%',
        drawAway: (probs.draw + probs.away).toFixed(2) + '%'
      },
      goals: goals,
      btts: this.predictBTTS(home, away, goals),
      corners: this.predictCorners(home, away)
    };
  }

  /**
   * Calcula las probabilidades 1X2 usando el modelo ponderado del cerebro.
   */
  calculateProbabilities(home, away) {
    const w = PREDICTION_WEIGHTS;
    const homeForm = home.getCurrentForm().formScore;
    const awayForm = away.getCurrentForm().formScore;

    const homeVenue = home.homeStats.winRate || 0;
    const awayVenue = away.awayStats.winRate || 0;

    // Fuerza ataque/defensa: goles a favor - goles en contra
    const homeAttackDef = (home.stats[TEAM_STATS.GOALS_SCORED_PER_GAME] || 0)
      - (home.stats[TEAM_STATS.GOALS_CONCEDED_PER_GAME] || 0);
    const awayAttackDef = (away.stats[TEAM_STATS.GOALS_SCORED_PER_GAME] || 0)
      - (away.stats[TEAM_STATS.GOALS_CONCEDED_PER_GAME] || 0);

    const h2hHome = home.getHeadToHead(away.id);
    const h2hScore = h2hHome.totalMatches > 0
      ? h2hHome.winRate
      : 50;

    const homePos = home.leaguePosition || 10;
    const awayPos = away.leaguePosition || 10;
    const homePosScore = 100 - ((homePos - 1) / 19) * 100;
    const awayPosScore = 100 - ((awayPos - 1) / 19) * 100;

    const homeXG = home.stats[TEAM_STATS.XG_PER_GAME] || 1.2;
    const awayXG = away.stats[TEAM_STATS.XG_PER_GAME] || 1.0;

    // Ventaja de local: +10% al score del local
    const homeRaw =
      homeForm * w.FORM +
      homeVenue * w.HOME_AWAY +
      (50 + homeAttackDef * 10) * w.ATTACK_DEFENSE +
      h2hScore * w.H2H +
      homePosScore * w.LEAGUE_POSITION +
      (homeXG * 20) * w.XG;

    const awayRaw =
      awayForm * w.FORM +
      awayVenue * w.HOME_AWAY +
      (50 + awayAttackDef * 10) * w.ATTACK_DEFENSE +
      (100 - h2hScore) * w.H2H +
      awayPosScore * w.LEAGUE_POSITION +
      (awayXG * 20) * w.XG;

    // La probabilidad de empate es mayor cuando los scores son parecidos
    const diff = Math.abs(homeRaw - awayRaw);
    let drawProb = Math.max(18, 38 - diff * 0.9); // base de empate ~25%
    drawProb = Math.min(drawProb, 40);

    let homeProb = Math.max(5, homeRaw - diff * 0.4 - drawProb * 0.5);
    let awayProb = Math.max(5, awayRaw - diff * 0.4 - drawProb * 0.5);

    const total = homeProb + drawProb + awayProb;
    homeProb = (homeProb / total) * 100;
    drawProb = (drawProb / total) * 100;
    awayProb = (awayProb / total) * 100;

    return { home: homeProb, draw: drawProb, away: awayProb };
  }

  confidenceLevel(prob) {
    if (prob > 55) return 'high';
    if (prob > 42) return 'medium';
    return 'low';
  }

  /**
   * Predice el mercado de goles (over/under y resultado mas probable).
   */
  predictGoals(home, away) {
    // Goles esperados del local: promedio de lo que marca en casa y lo que recibe el visitante fuera
    const homeExpected = ((home.homeStats[TEAM_STATS.GOALS_SCORED_PER_GAME] || 1.3)
      + (away.awayStats[TEAM_STATS.GOALS_CONCEDED_PER_GAME] || 1.1)) / 2;
    // Goles esperados del visitante: promedio de lo que marca fuera y lo que recibe el local en casa
    const awayExpected = ((away.awayStats[TEAM_STATS.GOALS_SCORED_PER_GAME] || 1.0)
      + (home.homeStats[TEAM_STATS.GOALS_CONCEDED_PER_GAME] || 1.0)) / 2;
    // Ventaja de local: el local marca un 10% mas y el visitante un 10% menos
    const homeAdj = homeExpected * 1.10;
    const awayAdj = awayExpected * 0.90;

    const totalExpected = homeAdj + awayAdj;
    const line = 2.5;

    // Probabilidad de over 2.5 (Poisson): 1 - P(0) - P(1) - P(2) con lambda=totalExpected
    const p = (k) => Math.exp(-totalExpected) * Math.pow(totalExpected, k) / this.factorial(k);
    let overProb = (1 - p(0) - p(1) - p(2)) * 100;
    overProb = Math.min(98, Math.max(5, overProb));
    const underProb = 100 - overProb;

    // Resultado de goles mas probable (redondeo de goles esperados individuales)
    const homeGoals = Math.max(0, Math.round(homeAdj));
    const awayGoals = Math.max(0, Math.round(awayAdj));
    const likelyScore = `${homeGoals}-${awayGoals}`;

    return {
      expectedGoals: {
        home: homeExpected.toFixed(2),
        away: awayExpected.toFixed(2),
        total: totalExpected.toFixed(2)
      },
      overUnder25: {
        line,
        overProbability: overProb.toFixed(2) + '%',
        underProbability: underProb.toFixed(2) + '%',
        prediction: overProb > 50 ? 'Over 2.5' : 'Under 2.5'
      },
      likelyScore
    };
  }

  factorial(n) {
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  predictBTTS(home, away, goals) {
    // Probabilidad de que cada equipo marque al menos 1 gol (Poisson: 1 - e^-lambda)
    const homeLambda = parseFloat(goals.expectedGoals.home);
    const awayLambda = parseFloat(goals.expectedGoals.away);
    const pHomeScores = 1 - Math.exp(-Math.max(0, homeLambda));
    const pAwayScores = 1 - Math.exp(-Math.max(0, awayLambda));
    let adjusted = pHomeScores * pAwayScores * 100;

    // Ajustar ligeramente por tendencia historica de BTTS
    const homeBTTS = home.stats[TEAM_STATS.BTTS_RATE] || 45;
    const awayBTTS = away.stats[TEAM_STATS.BTTS_RATE] || 45;
    const avgBTTS = (homeBTTS + awayBTTS) / 2;
    adjusted = (adjusted * 0.75) + (avgBTTS * 0.25);
    adjusted = Math.min(95, Math.max(10, adjusted));
    return {
      yesProbability: adjusted.toFixed(2) + '%',
      noProbability: (100 - adjusted).toFixed(2) + '%',
      prediction: adjusted > 50 ? 'Si marcan ambos' : 'No marcan ambos'
    };
  }

  predictCorners(home, away) {
    const homeCorners = home.stats[TEAM_STATS.AVG_CORNERS] || 5;
    const awayCorners = away.stats[TEAM_STATS.AVG_CORNERS] || 4;
    const total = homeCorners + awayCorners;
    const line = 9.5;
    const overProb = Math.min(90, Math.max(20, 35 + (total - line) * 18));
    return {
      expectedCorners: total.toFixed(1),
      line,
      overProbability: overProb.toFixed(2) + '%',
      underProbability: (100 - overProb).toFixed(2) + '%',
      prediction: overProb > 50 ? `Over ${line}` : `Under ${line}`
    };
  }

  /**
   * Genera recomendaciones de apuestas con valor potencial.
   */
  generateRecommendations(home, away) {
    const predictions = this.predictMatchOutcome(home, away);
    const recs = [];

    const mw = predictions.matchWinner;
    const favProb = parseFloat(mw.favoriteResult === 'home'
      ? mw.homeProbability : mw.favoriteResult === 'away'
      ? mw.awayProbability : mw.drawProbability);

    // 1X2
    if (favProb > 50 && mw.confidence === 'high') {
      recs.push({
        betType: BET_TYPES.MATCH_WINNER,
        selection: mw.favoriteResult,
        confidence: 'high',
        reason: `${mw.favorite} con ${favProb.toFixed(1)}% de probabilidad segun el cerebro`,
        recommendedStake: favProb > 60 ? 'medium' : 'low'
      });
    }

    // Doble chance cuando el favorito no es claro
    if (favProb < 50) {
      const dc = predictions.doubleChance;
      const bestDC = [
        { selection: 'home_draw', prob: parseFloat(dc.homeDraw), label: `${home.name} o Empate` },
        { selection: 'home_away', prob: parseFloat(dc.homeAway), label: `${home.name} o ${away.name}` },
        { selection: 'draw_away', prob: parseFloat(dc.drawAway), label: `Empate o ${away.name}` }
      ].sort((a, b) => b.prob - a.prob)[0];
      if (bestDC.prob > 75) {
        recs.push({
          betType: BET_TYPES.DOUBLE_CHANCE,
          selection: bestDC.selection,
          confidence: 'medium',
          reason: `${bestDC.label} tiene ${bestDC.prob.toFixed(1)}% (doble chance segura)`,
          recommendedStake: 'low'
        });
      }
    }

    // Over/Under 2.5
    const ou = predictions.goals.overUnder25;
    const overProb = parseFloat(ou.overProbability);
    if (overProb > 60) {
      recs.push({
        betType: BET_TYPES.OVER_UNDER_GOALS,
        selection: { line: 2.5, direction: 'over' },
        confidence: overProb > 70 ? 'high' : 'medium',
        reason: `${ou.overProbability} de Over 2.5 goles (esperados ${predictions.goals.expectedGoals.total})`,
        recommendedStake: overProb > 70 ? 'medium' : 'low'
      });
    } else if (overProb < 40) {
      recs.push({
        betType: BET_TYPES.OVER_UNDER_GOALS,
        selection: { line: 2.5, direction: 'under' },
        confidence: overProb < 30 ? 'high' : 'medium',
        reason: `${ou.underProbability} de Under 2.5 goles (esperados ${predictions.goals.expectedGoals.total})`,
        recommendedStake: overProb < 30 ? 'medium' : 'low'
      });
    }

    // Ambos marcan
    const btts = predictions.btts;
    const yesProb = parseFloat(btts.yesProbability);
    if (yesProb > 60) {
      recs.push({
        betType: BET_TYPES.BOTH_TEAMS_SCORE,
        selection: 'yes',
        confidence: yesProb > 70 ? 'high' : 'medium',
        reason: `${btts.yesProbability} de que ambos equipos marquen`,
        recommendedStake: yesProb > 70 ? 'medium' : 'low'
      });
    } else if (yesProb < 40) {
      recs.push({
        betType: BET_TYPES.BOTH_TEAMS_SCORE,
        selection: 'no',
        confidence: yesProb < 30 ? 'high' : 'medium',
        reason: `${btts.noProbability} de que NO marquen ambos`,
        recommendedStake: yesProb < 30 ? 'medium' : 'low'
      });
    }

    // Ordenar por confianza
    const order = { high: 3, medium: 2, low: 1 };
    recs.sort((a, b) => order[b.confidence] - order[a.confidence]);
    return recs;
  }

  /**
   * Analiza el valor de una apuesta comparando probabilidad predicha vs cuota.
   */
  analyzeBetValue(match, betType, selection, odds) {
    const analysis = this.analyzeMatch(match.homeTeamId, match.awayTeamId);
    const predictions = analysis.predictions;
    let predictedProbability = 0;

    switch (betType) {
      case BET_TYPES.MATCH_WINNER:
        if (selection === 'home') predictedProbability = parseFloat(predictions.matchWinner.homeProbability);
        else if (selection === 'draw') predictedProbability = parseFloat(predictions.matchWinner.drawProbability);
        else if (selection === 'away') predictedProbability = parseFloat(predictions.matchWinner.awayProbability);
        break;
      case BET_TYPES.DOUBLE_CHANCE:
        if (selection === 'home_draw') predictedProbability = parseFloat(predictions.doubleChance.homeDraw);
        else if (selection === 'home_away') predictedProbability = parseFloat(predictions.doubleChance.homeAway);
        else if (selection === 'draw_away') predictedProbability = parseFloat(predictions.doubleChance.drawAway);
        break;
      case BET_TYPES.OVER_UNDER_GOALS:
        if (selection.direction === 'over') predictedProbability = parseFloat(predictions.goals.overUnder25.overProbability);
        else predictedProbability = parseFloat(predictions.goals.overUnder25.underProbability);
        break;
      case BET_TYPES.BOTH_TEAMS_SCORE:
        if (selection === 'yes') predictedProbability = parseFloat(predictions.btts.yesProbability);
        else predictedProbability = parseFloat(predictions.btts.noProbability);
        break;
    }

    const decimalOdds = this.convertToDecimal(odds);
    const impliedProbability = (1 / decimalOdds) * 100;
    const value = predictedProbability - impliedProbability;

    let valueRating;
    if (value > 10) valueRating = 'high_value';
    else if (value > 5) valueRating = 'good_value';
    else if (value > 0) valueRating = 'slight_value';
    else if (value > -5) valueRating = 'fair';
    else if (value > -10) valueRating = 'poor_value';
    else valueRating = 'bad_value';

    return {
      predictedProbability: predictedProbability.toFixed(2) + '%',
      impliedProbability: impliedProbability.toFixed(2) + '%',
      value: value.toFixed(2) + '%',
      valueRating,
      recommendation: value > 0 ? 'Recomendada (valor positivo)' : 'No recomendada (sin valor)',
      confidence: Math.abs(value) > 10 ? 'high' : Math.abs(value) > 5 ? 'medium' : 'low'
    };
  }

  convertToDecimal(odds) {
    if (typeof odds === 'number') return odds;
    if (typeof odds === 'string') {
      if (odds.includes('/')) {
        const [num, den] = odds.split('/').map(Number);
        return num / den + 1;
      }
      if (odds.startsWith('+') || odds.startsWith('-')) {
        const num = parseInt(odds, 10);
        return num > 0 ? num / 100 + 1 : 100 / Math.abs(num) + 1;
      }
      return parseFloat(odds);
    }
    return parseFloat(odds);
  }

  getStatistics() {
    return { ...this.statistics.global };
  }

  /**
   * Carga datos de ejemplo (equipos y partidos) para demostracion.
   */
  loadSampleData() {
    const sampleTeams = [
      {
        name: 'Real Madrid', shortName: 'RMA', country: 'España', league: LEAGUES.LA_LIGA,
        leaguePosition: 1, leaguePoints: 78,
        stats: this.sampleTeamStats(2.1, 0.7, 70, 55, 38),
        homeStats: this.sampleVenueStats(16, 14, 2.4, 0.6, 60),
        awayStats: this.sampleVenueStats(16, 11, 1.8, 0.8, 45),
        form: ['W', 'W', 'W', 'D', 'W']
      },
      {
        name: 'FC Barcelona', shortName: 'BAR', country: 'España', league: LEAGUES.LA_LIGA,
        leaguePosition: 2, leaguePoints: 73,
        stats: this.sampleTeamStats(2.0, 0.9, 68, 52, 35),
        homeStats: this.sampleVenueStats(16, 13, 2.3, 0.8, 55),
        awayStats: this.sampleVenueStats(16, 10, 1.7, 1.0, 40),
        form: ['W', 'D', 'W', 'W', 'L']
      },
      {
        name: 'Atlético Madrid', shortName: 'ATM', country: 'España', league: LEAGUES.LA_LIGA,
        leaguePosition: 3, leaguePoints: 70,
        stats: this.sampleTeamStats(1.7, 0.85, 58, 48, 42),
        homeStats: this.sampleVenueStats(16, 12, 2.0, 0.7, 50),
        awayStats: this.sampleVenueStats(16, 8, 1.4, 1.0, 30),
        form: ['D', 'W', 'D', 'W', 'W']
      },
      {
        name: 'Manchester City', shortName: 'MCI', country: 'Inglaterra', league: LEAGUES.PREMIER_LEAGUE,
        leaguePosition: 1, leaguePoints: 85,
        stats: this.sampleTeamStats(2.4, 0.8, 75, 60, 40),
        homeStats: this.sampleVenueStats(16, 15, 2.8, 0.6, 65),
        awayStats: this.sampleVenueStats(16, 12, 2.0, 1.0, 50),
        form: ['W', 'W', 'W', 'W', 'D']
      },
      {
        name: 'Liverpool', shortName: 'LIV', country: 'Inglaterra', league: LEAGUES.PREMIER_LEAGUE,
        leaguePosition: 2, leaguePoints: 80,
        stats: this.sampleTeamStats(2.2, 1.0, 70, 58, 38),
        homeStats: this.sampleVenueStats(16, 14, 2.5, 0.8, 60),
        awayStats: this.sampleVenueStats(16, 11, 1.9, 1.2, 45),
        form: ['W', 'W', 'D', 'W', 'W']
      },
      {
        name: 'Bayern Munich', shortName: 'BAY', country: 'Alemania', league: LEAGUES.BUNDESLIGA,
        leaguePosition: 1, leaguePoints: 82,
        stats: this.sampleTeamStats(2.6, 1.0, 72, 65, 35),
        homeStats: this.sampleVenueStats(16, 14, 3.0, 0.9, 70),
        awayStats: this.sampleVenueStats(16, 11, 2.2, 1.1, 48),
        form: ['W', 'W', 'W', 'L', 'W']
      },
      {
        name: 'Borussia Dortmund', shortName: 'BVB', country: 'Alemania', league: LEAGUES.BUNDESLIGA,
        leaguePosition: 2, leaguePoints: 75,
        stats: this.sampleTeamStats(2.1, 1.2, 65, 60, 33),
        homeStats: this.sampleVenueStats(16, 13, 2.6, 1.0, 62),
        awayStats: this.sampleVenueStats(16, 9, 1.6, 1.4, 35),
        form: ['W', 'D', 'W', 'W', 'D']
      },
      {
        name: 'Girona FC', shortName: 'GIR', country: 'España', league: LEAGUES.LA_LIGA,
        leaguePosition: 7, leaguePoints: 55,
        stats: this.sampleTeamStats(1.5, 1.3, 45, 48, 38),
        homeStats: this.sampleVenueStats(16, 8, 1.7, 1.1, 45),
        awayStats: this.sampleVenueStats(16, 5, 1.3, 1.5, 28),
        form: ['L', 'D', 'L', 'W', 'D']
      }
    ];

    sampleTeams.forEach(t => this.addTeam(t));

    const teams = this.getAllTeams();
    const find = name => teams.find(t => t.name === name);

    const sampleMatches = [
      {
        league: LEAGUES.LA_LIGA, round: 'Jornada 30',
        date: new Date(Date.now() + 86400000 * 2).toISOString(),
        status: 'upcoming',
        homeTeamId: find('Real Madrid').id, awayTeamId: find('FC Barcelona').id,
        odds: {
          match_winner: { home: 1.95, draw: 3.40, away: 3.80 },
          over_under_goals: [{ line: 2.5, over: 1.75, under: 2.05 }],
          both_teams_score: { yes: 1.55, no: 2.40 }
        }
      },
      {
        league: LEAGUES.PREMIER_LEAGUE, round: 'Matchday 31',
        date: new Date(Date.now() + 86400000 * 3).toISOString(),
        status: 'upcoming',
        homeTeamId: find('Manchester City').id, awayTeamId: find('Liverpool').id,
        odds: {
          match_winner: { home: 2.05, draw: 3.50, away: 3.30 },
          over_under_goals: [{ line: 2.5, over: 1.65, under: 2.25 }],
          both_teams_score: { yes: 1.50, no: 2.50 }
        }
      },
      {
        league: LEAGUES.BUNDESLIGA, round: 'Spieltag 28',
        date: new Date(Date.now() + 86400000 * 4).toISOString(),
        status: 'upcoming',
        homeTeamId: find('Bayern Munich').id, awayTeamId: find('Borussia Dortmund').id,
        odds: {
          match_winner: { home: 1.70, draw: 4.00, away: 4.20 },
          over_under_goals: [{ line: 2.5, over: 1.55, under: 2.40 }],
          both_teams_score: { yes: 1.45, no: 2.65 }
        }
      },
      {
        league: LEAGUES.LA_LIGA, round: 'Jornada 29',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: 'completed',
        homeTeamId: find('Atlético Madrid').id, awayTeamId: find('Girona FC').id,
        result: { homeGoals: 2, awayGoals: 0, winner: 'home' },
        htResult: { homeGoals: 1, awayGoals: 0 }
      },
      {
        league: LEAGUES.LA_LIGA, round: 'Jornada 28',
        date: new Date(Date.now() - 86400000 * 12).toISOString(),
        status: 'completed',
        homeTeamId: find('FC Barcelona').id, awayTeamId: find('Atlético Madrid').id,
        result: { homeGoals: 1, awayGoals: 1, winner: 'draw' },
        htResult: { homeGoals: 0, awayGoals: 0 }
      }
    ];

    sampleMatches.forEach(md => {
      const match = this.addMatch(md);
      if (md.homeTeamId) {
        match.setTeams(this.getTeam(md.homeTeamId), this.getTeam(md.awayTeamId));
      }
    });

    return {
      teams: this.getAllTeams().length,
      matches: this.getAllMatches().length,
      upcoming: this.getUpcomingMatches().length
    };
  }

  sampleTeamStats(gf, ga, winPct, over25, btts) {
    return {
      [TEAM_STATS.WIN_PERCENTAGE]: winPct,
      [TEAM_STATS.DRAW_PERCENTAGE]: 100 - winPct - 15,
      [TEAM_STATS.LOSS_PERCENTAGE]: 15,
      [TEAM_STATS.POINTS_PER_GAME]: (winPct / 100 * 3 + (100 - winPct - 15) / 100 * 1) / 100 * 3,
      [TEAM_STATS.GOALS_SCORED_PER_GAME]: gf,
      [TEAM_STATS.GOALS_CONCEDED_PER_GAME]: ga,
      [TEAM_STATS.SHOTS_PER_GAME]: 13,
      [TEAM_STATS.SHOTS_ON_TARGET_PER_GAME]: 5,
      [TEAM_STATS.XG_PER_GAME]: gf - 0.2,
      [TEAM_STATS.BTTS_RATE]: btts,
      [TEAM_STATS.OVER_25_RATE]: over25,
      [TEAM_STATS.CLEAN_SHEET_RATE]: 100 - btts,
      [TEAM_STATS.AVG_CORNERS]: 5.5,
      [TEAM_STATS.AVG_CARDS]: 2.4,
      matchesPlayed: 28, wins: Math.round(28 * winPct / 100),
      draws: 28 - Math.round(28 * winPct / 100) - 5, losses: 5,
      goalsFor: Math.round(28 * gf), goalsAgainst: Math.round(28 * ga)
    };
  }

  sampleVenueStats(played, wins, gf, ga, over25) {
    const draws = Math.round((played - wins) * 0.4);
    const losses = played - wins - draws;
    return {
      matchesPlayed: played, wins, draws, losses,
      winRate: (wins / played) * 100,
      [TEAM_STATS.WIN_PERCENTAGE]: (wins / played) * 100,
      [TEAM_STATS.GOALS_SCORED_PER_GAME]: gf,
      [TEAM_STATS.GOALS_CONCEDED_PER_GAME]: ga,
      [TEAM_STATS.BTTS_RATE]: 48,
      [TEAM_STATS.OVER_25_RATE]: over25,
      [TEAM_STATS.AVG_CORNERS]: 5.8
    };
  }

  exportData() {
    return {
      teams: Array.from(this.teams.values()).map(t => t.toJSON()),
      matches: Array.from(this.matches.values()).map(m => m.toJSON()),
      statistics: this.statistics
    };
  }

  importData(data) {
    if (data.teams) {
      data.teams.forEach(td => {
        const team = new Team(td);
        this.teams.set(team.id, team);
      });
    }
    if (data.matches) {
      data.matches.forEach(md => {
        const match = new FootballMatch(md);
        this.matches.set(match.id, match);
        if (md.homeTeamId && this.teams.has(md.homeTeamId)) match.homeTeam = this.teams.get(md.homeTeamId);
        if (md.awayTeamId && this.teams.has(md.awayTeamId)) match.awayTeam = this.teams.get(md.awayTeamId);
      });
    }
    if (data.statistics) this.statistics = data.statistics;
  }
}

module.exports = FootballAnalyzer;
