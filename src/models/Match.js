const { SURFACES, TOURNAMENTS, BET_TYPES } = require('../config/constants');

/**
 * Clase que representa un partido de tenis
 * Contiene toda la información necesaria para análisis de apuestas
 */
class Match {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.tournament = data.tournament || '';
    this.tournamentCategory = data.tournamentCategory || this.getTournamentCategory();
    this.round = data.round || 'R1'; // R1, R2, R3, QF, SF, F
    this.surface = data.surface || SURFACES.HARD;
    this.date = data.date || new Date().toISOString();
    this.status = data.status || 'upcoming'; // upcoming, in_progress, completed, cancelled
    
    // Jugadores
    this.player1 = data.player1 || null;
    this.player2 = data.player2 || null;
    this.player1Id = data.player1Id || null;
    this.player2Id = data.player2Id || null;
    
    // Resultados
    this.result = data.result || null; // { player1Score, player2Score, winner }
    this.score = data.score || null; // { sets: [{ gamesP1, gamesP2 }] }
    
    // Estadísticas del partido
    this.stats = data.stats || this.initializeStats();
    
    // Odds (cuotas)
    this.odds = data.odds || this.initializeOdds();
    
    // Condiciones del partido
    this.conditions = data.conditions || this.initializeConditions();
    
    // Historial de apuestas
    this.betHistory = data.betHistory || [];
    
    // Fecha de última actualización
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
  }
  
  /**
   * Genera un ID único para el partido
   */
  generateId() {
    return 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Obtiene la categoría del torneo
   */
  getTournamentCategory() {
    if (!this.tournament) return 'other';
    
    const grandSlams = Object.values(TOURNAMENTS).filter(t => 
      ['Australian Open', 'French Open', 'Wimbledon', 'US Open'].includes(t)
    );
    
    const masters1000 = Object.values(TOURNAMENTS).filter(t => 
      ['Indian Wells', 'Miami Open', 'Madrid Open', 'Rome Masters', 
       'Canadian Open', 'Cincinnati Masters', 'Shanghai Masters', 'Paris Masters'].includes(t)
    );
    
    const atp500 = Object.values(TOURNAMENTS).filter(t => 
      ['Dubai Tennis Championships', 'Acapulco', 'Barcelona Open', 'Hamburg European Open',
       'Citi Open', 'China Open', 'Swiss Indoors', 'Vienna Open'].includes(t)
    );
    
    if (grandSlams.includes(this.tournament)) return 'grand_slam';
    if (masters1000.includes(this.tournament)) return 'masters_1000';
    if (atp500.includes(this.tournament)) return 'atp_500';
    
    return 'atp_250';
  }
  
  /**
   * Inicializa estadísticas vacías
   */
  initializeStats() {
    return {
      player1: {
        aces: 0,
        doubleFaults: 0,
        firstServePercentage: 0,
        firstServePointsWon: 0,
        secondServePointsWon: 0,
        servicePointsWon: 0,
        firstServeReturnWon: 0,
        secondServeReturnWon: 0,
        returnPointsWon: 0,
        breakPointsConverted: 0,
        breakPointsSaved: 0,
        winners: 0,
        unforcedErrors: 0,
        netPointsWon: 0,
        netApproaches: 0,
        totalPointsWon: 0
      },
      player2: {
        aces: 0,
        doubleFaults: 0,
        firstServePercentage: 0,
        firstServePointsWon: 0,
        secondServePointsWon: 0,
        servicePointsWon: 0,
        firstServeReturnWon: 0,
        secondServeReturnWon: 0,
        returnPointsWon: 0,
        breakPointsConverted: 0,
        breakPointsSaved: 0,
        winners: 0,
        unforcedErrors: 0,
        netPointsWon: 0,
        netApproaches: 0,
        totalPointsWon: 0
      },
      match: {
        totalAces: 0,
        totalDoubleFaults: 0,
        longestRally: 0,
        averageRallyLength: 0,
        totalPoints: 0,
        duration: 0 // en minutos
      }
    };
  }
  
  /**
   * Inicializa odds vacías
   */
  initializeOdds() {
    return {
      [BET_TYPES.MATCH_WINNER]: {
        player1: null,
        player2: null,
        draw: null
      },
      [BET_TYPES.HANDICAP]: {
        player1: [], // Array de { handicap, odds }
        player2: []
      },
      [BET_TYPES.OVER_UNDER]: {
        totalGames: [], // Array de { line, over, under }
        totalSets: []
      },
      [BET_TYPES.CORRECT_SCORE]: {
        player1: [], // Array de { score, odds }
        player2: []
      },
      [BET_TYPES.FIRST_SET_WINNER]: {
        player1: null,
        player2: null
      },
      [BET_TYPES.TOTAL_SETS]: {
        over: [], // Array de { line, odds }
        under: []
      },
      [BET_TYPES.ACE_COUNT]: {
        player1: [], // Array de { line, over, under }
        player2: []
      },
      lastUpdated: null
    };
  }
  
  /**
   * Inicializa condiciones del partido
   */
  initializeConditions() {
    return {
      indoor: false,
      temperature: null, // en Celsius
      humidity: null, // en %
      windSpeed: null, // en km/h
      altitude: null, // en metros
      timeOfDay: 'day', // day, night, evening
      roof: false // si tiene techo
    };
  }
  
  /**
   * Establece los jugadores del partido
   */
  setPlayers(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
    this.player1Id = player1 ? player1.id : null;
    this.player2Id = player2 ? player2.id : null;
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Establece el resultado del partido
   */
  setResult(result) {
    this.result = result;
    this.status = 'completed';
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Establece el score detallado
   */
  setScore(score) {
    this.score = score;
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Actualiza las estadísticas del partido
   */
  updateStats(player, stats) {
    if (this.stats[player]) {
      this.stats[player] = { ...this.stats[player], ...stats };
    }
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Actualiza las odds
   */
  updateOdds(betType, oddsData) {
    if (this.odds[betType]) {
      this.odds[betType] = { ...this.odds[betType], ...oddsData };
      this.odds.lastUpdated = new Date().toISOString();
    }
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Actualiza las condiciones del partido
   */
  updateConditions(conditions) {
    this.conditions = { ...this.conditions, ...conditions };
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Añade una apuesta al historial
   */
  addBet(betData) {
    this.betHistory.push({
      ...betData,
      timestamp: new Date().toISOString()
    });
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Obtiene el ganador del partido
   */
  getWinner() {
    if (!this.result) return null;
    return this.result.winner === 'player1' ? this.player1 : this.player2;
  }
  
  /**
   * Obtiene el perdedor del partido
   */
  getLoser() {
    if (!this.result) return null;
    return this.result.winner === 'player1' ? this.player2 : this.player1;
  }
  
  /**
   * Verifica si el partido ha terminado
   */
  isCompleted() {
    return this.status === 'completed';
  }
  
  /**
   * Verifica si el partido está en progreso
   */
  isInProgress() {
    return this.status === 'in_progress';
  }
  
  /**
   * Verifica si el partido está programado
   */
  isUpcoming() {
    return this.status === 'upcoming';
  }
  
  /**
   * Obtiene la duración del partido en minutos
   */
  getDuration() {
    return this.stats.match.duration || 0;
  }
  
  /**
   * Obtiene el número total de sets
   */
  getTotalSets() {
    if (!this.score || !this.score.sets) return 0;
    return this.score.sets.length;
  }
  
  /**
   * Obtiene el número total de juegos
   */
  getTotalGames() {
    if (!this.score || !this.score.sets) return 0;
    return this.score.sets.reduce((total, set) => 
      total + (set.gamesP1 || 0) + (set.gamesP2 || 0), 0);
  }
  
  /**
   * Obtiene el score en formato legible
   */
  getScoreString() {
    if (!this.score || !this.score.sets) return 'N/A';
    return this.score.sets.map(set => 
      `${set.gamesP1 || 0}-${set.gamesP2 || 0}`
    ).join(', ');
  }
  
  /**
   * Obtiene el nombre de la ronda
   */
  getRoundName() {
    const roundNames = {
      'R1': '1st Round',
      'R2': '2nd Round',
      'R3': '3rd Round',
      'R4': '4th Round',
      'R16': 'Round of 16',
      'QF': 'Quarterfinals',
      'SF': 'Semifinals',
      'F': 'Final',
      'RR': 'Round Robin'
    };
    return roundNames[this.round] || this.round;
  }
  
  /**
   * Obtiene la categoría del torneo como texto
   */
  getTournamentCategoryName() {
    const categoryNames = {
      'grand_slam': 'Grand Slam',
      'masters_1000': 'ATP Masters 1000',
      'atp_500': 'ATP 500',
      'atp_250': 'ATP 250',
      'other': 'Other'
    };
    return categoryNames[this.tournamentCategory] || this.tournamentCategory;
  }
  
  /**
   * Verifica si el partido es de piso duro
   */
  isHardCourt() {
    return this.surface === SURFACES.HARD;
  }
  
  /**
   * Obtiene los nombres de los jugadores
   */
  getPlayerNames() {
    const p1Name = this.player1 ? this.player1.getFullName() : this.player1Id || 'TBD';
    const p2Name = this.player2 ? this.player2.getFullName() : this.player2Id || 'TBD';
    return { player1: p1Name, player2: p2Name };
  }
  
  /**
   * Convierte el partido a un objeto simple (para JSON)
   */
  toJSON() {
    return {
      id: this.id,
      tournament: this.tournament,
      tournamentCategory: this.tournamentCategory,
      round: this.round,
      surface: this.surface,
      date: this.date,
      status: this.status,
      player1: this.player1 ? this.player1.toJSON() : null,
      player2: this.player2 ? this.player2.toJSON() : null,
      player1Id: this.player1Id,
      player2Id: this.player2Id,
      result: this.result,
      score: this.score,
      stats: this.stats,
      odds: this.odds,
      conditions: this.conditions,
      betHistory: this.betHistory,
      lastUpdated: this.lastUpdated
    };
  }
  
  /**
   * Convierte el partido a una cadena legible
   */
  toString() {
    const { player1, player2 } = this.getPlayerNames();
    const scoreStr = this.getScoreString();
    const statusStr = this.isCompleted() ? ` (${scoreStr})` : '';
    return `${this.tournament} - ${this.getRoundName()}: ${player1} vs ${player2}${statusStr}`;
  }
  
  /**
   * Obtiene un resumen del partido para apuestas
   */
  getBetSummary() {
    const { player1, player2 } = this.getPlayerNames();
    const winner = this.getWinner();
    
    return {
      matchId: this.id,
      tournament: this.tournament,
      tournamentCategory: this.tournamentCategory,
      round: this.getRoundName(),
      surface: this.surface,
      date: this.date,
      players: { player1, player2 },
      status: this.status,
      winner: winner ? winner.getFullName() : null,
      score: this.getScoreString(),
      odds: this.odds,
      conditions: this.conditions
    };
  }
}

module.exports = Match;
