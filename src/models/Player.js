const { SURFACES, STAT_CATEGORIES } = require('../config/constants');

/**
 * Clase que representa un jugador de tenis
 * Contiene toda la información relevante para análisis de apuestas
 */
class Player {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.country = data.country || '';
    this.birthDate = data.birthDate || null;
    this.age = data.age || this.calculateAge();
    this.height = data.height || null; // en cm
    this.weight = data.weight || null; // en kg
    this.hand = data.hand || 'right'; // 'right' o 'left'
    this.backhand = data.backhand || 'two-handed'; // 'one-handed' o 'two-handed'
    this.turnedPro = data.turnedPro || null;
    this.ranking = data.ranking || null;
    this.highestRanking = data.highestRanking || null;
    this.rankingPoints = data.rankingPoints || 0;
    this.prizeMoney = data.prizeMoney || 0; // en USD
    this.coach = data.coach || null;
    
    // Estadísticas generales
    this.stats = data.stats || this.initializeStats();
    
    // Estadísticas por superficie
    this.surfaceStats = data.surfaceStats || this.initializeSurfaceStats();
    
    // Historial de lesiones
    this.injuries = data.injuries || [];
    
    // Historial de partidos
    this.matchHistory = data.matchHistory || [];
    
    // Estilo de juego
    this.playStyle = data.playStyle || this.analyzePlayStyle();
    
    // Fecha de última actualización
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
  }
  
  /**
   * Genera un ID único para el jugador
   */
  generateId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Calcula la edad del jugador
   */
  calculateAge() {
    if (!this.birthDate) return null;
    const birthYear = new Date(this.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  }
  
  /**
   * Inicializa estadísticas vacías
   */
  initializeStats() {
    return {
      [STAT_CATEGORIES.WIN_PERCENTAGE]: 0,
      [STAT_CATEGORIES.ACE_PERCENTAGE]: 0,
      [STAT_CATEGORIES.DOUBLE_FAULT_PERCENTAGE]: 0,
      [STAT_CATEGORIES.FIRST_SERVE_PERCENTAGE]: 0,
      [STAT_CATEGORIES.FIRST_SERVE_POINTS_WON]: 0,
      [STAT_CATEGORIES.SECOND_SERVE_POINTS_WON]: 0,
      [STAT_CATEGORIES.SERVICE_POINTS_WON]: 0,
      [STAT_CATEGORIES.FIRST_SERVE_RETURN_WON]: 0,
      [STAT_CATEGORIES.SECOND_SERVE_RETURN_WON]: 0,
      [STAT_CATEGORIES.RETURN_POINTS_WON]: 0,
      [STAT_CATEGORIES.BREAK_POINTS_CONVERTED]: 0,
      [STAT_CATEGORIES.BREAK_POINTS_SAVED]: 0,
      [STAT_CATEGORIES.TIEBREAK_WIN_PERCENTAGE]: 0,
      [STAT_CATEGORIES.AVERAGE_ACES]: 0,
      [STAT_CATEGORIES.AVERAGE_DOUBLE_FAULTS]: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      titles: 0,
      grandSlams: 0,
      masters1000: 0,
      atp500: 0,
      atp250: 0
    };
  }
  
  /**
   * Inicializa estadísticas por superficie
   */
  initializeSurfaceStats() {
    const surfaces = Object.values(SURFACES);
    const surfaceStats = {};
    
    surfaces.forEach(surface => {
      surfaceStats[surface] = {
        matchesPlayed: 0,
        matchesWon: 0,
        winRate: 0,
        [STAT_CATEGORIES.FIRST_SERVE_PERCENTAGE]: 0,
        [STAT_CATEGORIES.SERVICE_POINTS_WON]: 0,
        [STAT_CATEGORIES.RETURN_POINTS_WON]: 0,
        [STAT_CATEGORIES.BREAK_POINTS_CONVERTED]: 0,
        titles: 0
      };
    });
    
    return surfaceStats;
  }
  
  /**
   * Analiza el estilo de juego del jugador
   */
  analyzePlayStyle() {
    // Este es un análisis básico, se puede mejorar con más datos
    const styles = [];
    
    // Verificar si es zurdo
    if (this.hand === 'left') {
      styles.push('left-handed');
    }
    
    // Verificar estilo de revés
    if (this.backhand === 'one-handed') {
      styles.push('one-handed backhand');
    } else {
      styles.push('two-handed backhand');
    }
    
    // Basado en altura
    if (this.height && this.height > 190) {
      styles.push('big server');
    }
    
    // Basado en estadísticas de servicio (si están disponibles)
    if (this.stats[STAT_CATEGORIES.ACE_PERCENTAGE] > 10) {
      styles.push('serve-and-volley');
    }
    
    if (this.stats[STAT_CATEGORIES.BREAK_POINTS_CONVERTED] > 40) {
      styles.push('return specialist');
    }
    
    return styles.length > 0 ? styles : ['all-court'];
  }
  
  /**
   * Obtiene el nombre completo del jugador
   */
  getFullName() {
    return this.name || `${this.firstName} ${this.lastName}`.trim();
  }
  
  /**
   * Obtiene el nombre corto (iniciales + apellido)
   */
  getShortName() {
    const firstInitial = this.firstName ? this.firstName.charAt(0) : '';
    const lastName = this.lastName || this.name || '';
    return `${firstInitial}. ${lastName}`.trim();
  }
  
  /**
   * Obtiene estadísticas para una superficie específica
   */
  getSurfaceStats(surface) {
    return this.surfaceStats[surface] || this.initializeSurfaceStats()[surface];
  }
  
  /**
   * Obtiene el win rate en piso duro
   */
  getHardCourtWinRate() {
    const hardStats = this.getSurfaceStats(SURFACES.HARD);
    return hardStats.winRate || 0;
  }
  
  /**
   * Obtiene el win rate general
   */
  getWinRate() {
    return this.stats[STAT_CATEGORIES.WIN_PERCENTAGE] || 
           (this.stats.matchesPlayed > 0 ? 
            (this.stats.matchesWon / this.stats.matchesPlayed) * 100 : 0);
  }
  
  /**
   * Obtiene el win rate en una superficie específica
   */
  getSurfaceWinRate(surface) {
    const surfaceStat = this.getSurfaceStats(surface);
    return surfaceStat.winRate || 
           (surfaceStat.matchesPlayed > 0 ? 
            (surfaceStat.matchesWon / surfaceStat.matchesPlayed) * 100 : 0);
  }
  
  /**
   * Actualiza las estadísticas del jugador
   */
  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats };
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Actualiza las estadísticas por superficie
   */
  updateSurfaceStats(surface, newStats) {
    if (!this.surfaceStats[surface]) {
      this.surfaceStats[surface] = this.initializeSurfaceStats()[surface];
    }
    this.surfaceStats[surface] = { ...this.surfaceStats[surface], ...newStats };
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Añade un partido al historial
   */
  addMatch(matchData) {
    this.matchHistory.push({
      ...matchData,
      date: new Date().toISOString()
    });
    
    // Actualizar estadísticas basadas en el partido
    this.updateStatsFromMatch(matchData);
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Actualiza estadísticas basadas en un partido
   */
  updateStatsFromMatch(matchData) {
    const isWin = matchData.result === 'win';
    const surface = matchData.surface || SURFACES.HARD;
    
    // Actualizar estadísticas generales
    this.stats.matchesPlayed = (this.stats.matchesPlayed || 0) + 1;
    if (isWin) {
      this.stats.matchesWon = (this.stats.matchesWon || 0) + 1;
    }
    
    // Actualizar win rate
    this.stats[STAT_CATEGORIES.WIN_PERCENTAGE] = this.getWinRate();
    
    // Actualizar estadísticas por superficie
    const surfaceStat = this.getSurfaceStats(surface);
    surfaceStat.matchesPlayed = (surfaceStat.matchesPlayed || 0) + 1;
    if (isWin) {
      surfaceStat.matchesWon = (surfaceStat.matchesWon || 0) + 1;
      surfaceStat.titles = (surfaceStat.titles || 0) + (matchData.isFinal ? 1 : 0);
    }
    surfaceStat.winRate = surfaceStat.matchesPlayed > 0 ? 
      (surfaceStat.matchesWon / surfaceStat.matchesPlayed) * 100 : 0;
    
    // Actualizar estadísticas específicas si están disponibles
    if (matchData.stats) {
      Object.keys(matchData.stats).forEach(statKey => {
        if (this.stats[statKey] !== undefined) {
          // Promedio simple para demostración
          const currentTotal = this.stats[statKey] * (this.stats.matchesPlayed - 1);
          this.stats[statKey] = (currentTotal + matchData.stats[statKey]) / this.stats.matchesPlayed;
        }
      });
    }
  }
  
  /**
   * Añade una lesión al historial
   */
  addInjury(injuryData) {
    this.injuries.push({
      type: injuryData.type,
      severity: injuryData.severity || 'medium',
      startDate: injuryData.startDate || new Date().toISOString(),
      endDate: injuryData.endDate || null,
      description: injuryData.description || '',
      affectedArea: injuryData.affectedArea || ''
    });
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Obtiene el formulario actual del jugador (últimos N partidos)
   */
  getCurrentForm(lastMatches = 5) {
    const recentMatches = this.matchHistory.slice(-lastMatches);
    const wins = recentMatches.filter(m => m.result === 'win').length;
    return {
      matches: recentMatches.length,
      wins,
      losses: recentMatches.length - wins,
      winRate: recentMatches.length > 0 ? (wins / recentMatches.length) * 100 : 0
    };
  }
  
  /**
   * Verifica si el jugador está lesionado actualmente
   */
  isInjured() {
    const now = new Date();
    return this.injuries.some(injury => {
      const endDate = injury.endDate ? new Date(injury.endDate) : null;
      return !endDate || endDate >= now;
    });
  }
  
  /**
   * Obtiene el rendimiento contra un oponente específico
   */
  getHeadToHead(opponentId) {
    const matches = this.matchHistory.filter(m => 
      m.opponentId === opponentId || m.opponentName === opponentId
    );
    
    const wins = matches.filter(m => m.result === 'win').length;
    const losses = matches.length - wins;
    
    return {
      totalMatches: matches.length,
      wins,
      losses,
      winRate: matches.length > 0 ? (wins / matches.length) * 100 : 0,
      matches: matches
    };
  }
  
  /**
   * Convierte el jugador a un objeto simple (para JSON)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.getFullName(),
      firstName: this.firstName,
      lastName: this.lastName,
      country: this.country,
      birthDate: this.birthDate,
      age: this.age,
      height: this.height,
      weight: this.weight,
      hand: this.hand,
      backhand: this.backhand,
      turnedPro: this.turnedPro,
      ranking: this.ranking,
      highestRanking: this.highestRanking,
      rankingPoints: this.rankingPoints,
      prizeMoney: this.prizeMoney,
      coach: this.coach,
      stats: this.stats,
      surfaceStats: this.surfaceStats,
      injuries: this.injuries,
      matchHistory: this.matchHistory,
      playStyle: this.playStyle,
      lastUpdated: this.lastUpdated
    };
  }
  
  /**
   * Convierte el jugador a una cadena legible
   */
  toString() {
    return `${this.getFullName()} (${this.country}) - Ranking: ${this.ranking || 'N/A'}, Win Rate: ${this.getWinRate().toFixed(1)}%`;
  }
}

module.exports = Player;
