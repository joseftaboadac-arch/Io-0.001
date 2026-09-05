const { SURFACES, STAT_CATEGORIES, BET_TYPES, TOURNAMENTS, HARD_COURT_TOURNAMENTS } = require('../config/constants');
const Player = require('../models/Player');
const Match = require('../models/Match');

/**
 * Analizador especializado en tenis en piso duro
 * Proporciona análisis avanzados para apuestas en esta superficie
 */
class TennisAnalyzer {
  constructor() {
    this.players = new Map();
    this.matches = new Map();
    this.statistics = {
      hardCourt: {
        totalMatches: 0,
        averageAces: 0,
        averageDoubleFaults: 0,
        averageRallyLength: 0,
        tiebreakFrequency: 0,
        threeSetMatches: 0,
        twoSetMatches: 0
      }
    };
  }
  
  /**
   * Añade un jugador al analizador
   */
  addPlayer(playerData) {
    const player = new Player(playerData);
    this.players.set(player.id, player);
    return player;
  }
  
  /**
   * Añade un partido al analizador
   */
  addMatch(matchData) {
    const match = new Match(matchData);
    this.matches.set(match.id, match);
    
    // Si el partido es de piso duro, actualizar estadísticas
    if (match.isHardCourt()) {
      this.updateHardCourtStatistics(match);
    }
    
    return match;
  }
  
  /**
   * Actualiza estadísticas de piso duro
   */
  updateHardCourtStatistics(match) {
    this.statistics.hardCourt.totalMatches++;
    
    // Actualizar estadísticas basadas en el partido
    if (match.score && match.score.sets) {
      const totalSets = match.getTotalSets();
      if (totalSets === 2) {
        this.statistics.hardCourt.twoSetMatches++;
      } else if (totalSets === 3) {
        this.statistics.hardCourt.threeSetMatches++;
      }
    }
    
    // Actualizar estadísticas de aces y dobles faltas
    if (match.stats && match.stats.match) {
      const totalAces = match.stats.match.totalAces || 0;
      const totalDoubleFaults = match.stats.match.totalDoubleFaults || 0;
      
      // Promedio simple
      this.statistics.hardCourt.averageAces = 
        (this.statistics.hardCourt.averageAces * (this.statistics.hardCourt.totalMatches - 1) + totalAces) / 
        this.statistics.hardCourt.totalMatches;
      
      this.statistics.hardCourt.averageDoubleFaults = 
        (this.statistics.hardCourt.averageDoubleFaults * (this.statistics.hardCourt.totalMatches - 1) + totalDoubleFaults) / 
        this.statistics.hardCourt.totalMatches;
    }
  }
  
  /**
   * Obtiene un jugador por ID
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }
  
  /**
   * Obtiene un partido por ID
   */
  getMatch(matchId) {
    return this.matches.get(matchId);
  }
  
  /**
   * Obtiene todos los jugadores
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }
  
  /**
   * Obtiene todos los partidos
   */
  getAllMatches() {
    return Array.from(this.matches.values());
  }
  
  /**
   * Obtiene partidos de piso duro
   */
  getHardCourtMatches() {
    return Array.from(this.matches.values()).filter(match => match.isHardCourt());
  }
  
  /**
   * Obtiene jugadores especialistas en piso duro
   */
  getHardCourtSpecialists(minMatches = 10, minWinRate = 60) {
    return Array.from(this.players.values()).filter(player => {
      const hardStats = player.getSurfaceStats(SURFACES.HARD);
      return hardStats.matchesPlayed >= minMatches && 
             hardStats.winRate >= minWinRate;
    }).sort((a, b) => {
      const aRate = a.getSurfaceStats(SURFACES.HARD).winRate;
      const bRate = b.getSurfaceStats(SURFACES.HARD).winRate;
      return bRate - aRate;
    });
  }
  
  /**
   * Analiza el enfrentamiento entre dos jugadores
   */
  analyzeMatchup(player1Id, player2Id, surface = SURFACES.HARD) {
    const player1 = this.getPlayer(player1Id);
    const player2 = this.getPlayer(player2Id);
    
    if (!player1 || !player2) {
      throw new Error('Uno o ambos jugadores no existen');
    }
    
    const analysis = {
      player1: {
        id: player1.id,
        name: player1.getFullName(),
        ranking: player1.ranking,
        winRate: player1.getWinRate(),
        surfaceWinRate: player1.getSurfaceWinRate(surface),
        hardCourtWinRate: player1.getHardCourtWinRate(),
        currentForm: player1.getCurrentForm(),
        stats: player1.stats,
        surfaceStats: player1.getSurfaceStats(surface),
        headToHead: player1.getHeadToHead(player2.id),
        isInjured: player1.isInjured()
      },
      player2: {
        id: player2.id,
        name: player2.getFullName(),
        ranking: player2.ranking,
        winRate: player2.getWinRate(),
        surfaceWinRate: player2.getSurfaceWinRate(surface),
        hardCourtWinRate: player2.getHardCourtWinRate(),
        currentForm: player2.getCurrentForm(),
        stats: player2.stats,
        surfaceStats: player2.getSurfaceStats(surface),
        headToHead: player2.getHeadToHead(player1.id),
        isInjured: player2.isInjured()
      },
      surface: surface,
      predictions: this.predictMatchOutcome(player1, player2, surface),
      recommendations: this.generateRecommendations(player1, player2, surface)
    };
    
    return analysis;
  }
  
  /**
   * Predice el resultado de un partido
   */
  predictMatchOutcome(player1, player2, surface = SURFACES.HARD) {
    const p1Stats = player1.getSurfaceStats(surface);
    const p2Stats = player2.getSurfaceStats(surface);
    
    // Factores de peso para la predicción
    const weights = {
      surfaceWinRate: 0.35,
      overallWinRate: 0.25,
      ranking: 0.15,
      currentForm: 0.15,
      headToHead: 0.10
    };
    
    // Calcular puntuación para cada jugador
    const p1Score = this.calculatePlayerScore(player1, player2, surface, weights);
    const p2Score = this.calculatePlayerScore(player2, player1, surface, weights);
    
    const totalScore = p1Score + p2Score;
    const p1Probability = (p1Score / totalScore) * 100;
    const p2Probability = (p2Score / totalScore) * 100;
    
    // Predicción del número de sets
    const setsPrediction = this.predictTotalSets(player1, player2, surface);
    
    // Predicción de tie-break
    const tiebreakPrediction = this.predictTiebreak(player1, player2, surface);
    
    // Predicción de over/under juegos
    const gamesPrediction = this.predictTotalGames(player1, player2, surface);
    
    return {
      matchWinner: {
        player1Probability: p1Probability.toFixed(2) + '%',
        player2Probability: p2Probability.toFixed(2) + '%',
        favorite: p1Probability > p2Probability ? player1.getFullName() : player2.getFullName(),
        underdog: p1Probability > p2Probability ? player2.getFullName() : player1.getFullName(),
        confidence: Math.abs(p1Probability - p2Probability) < 10 ? 'low' : 
                    Math.abs(p1Probability - p2Probability) < 25 ? 'medium' : 'high'
      },
      totalSets: setsPrediction,
      tiebreak: tiebreakPrediction,
      totalGames: gamesPrediction,
      firstSetWinner: {
        player1Probability: (p1Score / totalScore * 100 * 1.1).toFixed(2) + '%', // Ajuste para primer set
        player2Probability: (p2Score / totalScore * 100 * 1.1).toFixed(2) + '%'
      }
    };
  }
  
  /**
   * Calcula la puntuación de un jugador para la predicción
   */
  calculatePlayerScore(player, opponent, surface, weights) {
    const pStats = player.getSurfaceStats(surface);
    const oStats = opponent.getSurfaceStats(surface);
    const h2h = player.getHeadToHead(opponent.id);
    
    let score = 0;
    
    // Win rate en la superficie
    score += (pStats.winRate || 0) * weights.surfaceWinRate;
    
    // Win rate general
    score += player.getWinRate() * weights.overallWinRate;
    
    // Ranking (menor ranking = mejor)
    const rankingScore = player.ranking && opponent.ranking ? 
      (100 - Math.min(player.ranking / 10, 100)) : 50;
    score += rankingScore * weights.ranking;
    
    // Forma actual
    const form = player.getCurrentForm();
    score += (form.winRate || 0) * weights.currentForm;
    
    // Head to head
    score += (h2h.winRate || 0) * weights.headToHead;
    
    return score;
  }
  
  /**
   * Predice el número de sets
   */
  predictTotalSets(player1, player2, surface) {
    const p1Stats = player1.getSurfaceStats(surface);
    const p2Stats = player2.getSurfaceStats(surface);
    
    // Si ambos jugadores tienen alto win rate en la superficie, es más probable que sea a 2 sets
    const avgWinRate = (p1Stats.winRate + p2Stats.winRate) / 2;
    
    // Si el win rate promedio es alto, más probabilidad de 2 sets
    if (avgWinRate > 70) {
      return {
        twoSetsProbability: '70%',
        threeSetsProbability: '30%',
        prediction: '2 sets'
      };
    } else if (avgWinRate > 60) {
      return {
        twoSetsProbability: '60%',
        threeSetsProbability: '40%',
        prediction: '2 sets'
      };
    } else {
      return {
        twoSetsProbability: '40%',
        threeSetsProbability: '60%',
        prediction: '3 sets'
      };
    }
  }
  
  /**
   * Predice si habrá tie-break
   */
  predictTiebreak(player1, player2, surface) {
    const p1Stats = player1.stats;
    const p2Stats = player2.stats;
    
    // Jugadores con buen servicio y retorno tienen más probabilidad de tie-break
    const p1ServeStrength = p1Stats[STAT_CATEGORIES.SERVICE_POINTS_WON] || 0;
    const p2ServeStrength = p2Stats[STAT_CATEGORIES.SERVICE_POINTS_WON] || 0;
    const p1ReturnStrength = p1Stats[STAT_CATEGORIES.RETURN_POINTS_WON] || 0;
    const p2ReturnStrength = p2Stats[STAT_CATEGORIES.RETURN_POINTS_WON] || 0;
    
    const avgServeStrength = (p1ServeStrength + p2ServeStrength) / 2;
    const avgReturnStrength = (p1ReturnStrength + p2ReturnStrength) / 2;
    
    // Si ambos tienen buen servicio y retorno, alta probabilidad de tie-break
    if (avgServeStrength > 70 && avgReturnStrength > 40) {
      return {
        probability: '75%',
        prediction: 'Sí habrá tie-break'
      };
    } else if (avgServeStrength > 65 || avgReturnStrength > 35) {
      return {
        probability: '60%',
        prediction: 'Probablemente habrá tie-break'
      };
    } else {
      return {
        probability: '40%',
        prediction: 'Poco probable tie-break'
      };
    }
  }
  
  /**
   * Predice el número total de juegos
   */
  predictTotalGames(player1, player2, surface) {
    const p1Stats = player1.getSurfaceStats(surface);
    const p2Stats = player2.getSurfaceStats(surface);
    
    // Promedio de juegos por partido en piso duro
    const avgGames = 22.5; // Promedio histórico en piso duro
    
    // Ajustar basado en el estilo de juego
    const p1Style = player1.playStyle;
    const p2Style = player2.playStyle;
    
    let adjustment = 0;
    
    // Si ambos son jugadores defensivos, más juegos
    if (p1Style.includes('return specialist') && p2Style.includes('return specialist')) {
      adjustment = 3;
    } else if (p1Style.includes('serve-and-volley') && p2Style.includes('serve-and-volley')) {
      adjustment = -2;
    }
    
    const predictedGames = avgGames + adjustment;
    
    return {
      predictedGames: predictedGames.toFixed(1),
      overProbability: '55%',
      underProbability: '45%',
      line: predictedGames.toFixed(1)
    };
  }
  
  /**
   * Genera recomendaciones de apuestas
   */
  generateRecommendations(player1, player2, surface = SURFACES.HARD) {
    const predictions = this.predictMatchOutcome(player1, player2, surface);
    const recommendations = [];
    
    // Recomendación para ganador del partido
    const favoriteProb = parseFloat(predictions.matchWinner.favorite === player1.getFullName() ? 
      predictions.matchWinner.player1Probability : predictions.matchWinner.player2Probability);
    
    if (favoriteProb > 65) {
      const favorite = predictions.matchWinner.favorite;
      recommendations.push({
        betType: BET_TYPES.MATCH_WINNER,
        selection: favorite === player1.getFullName() ? 'player1' : 'player2',
        confidence: 'high',
        reason: `Alta probabilidad (${favoriteProb}%) basado en estadísticas de superficie y forma actual`,
        recommendedStake: 'medium'
      });
    }
    
    // Recomendación para total de sets
    if (predictions.totalSets.prediction === '2 sets') {
      recommendations.push({
        betType: BET_TYPES.TOTAL_SETS,
        selection: { line: 2.5, direction: 'under' },
        confidence: 'medium',
        reason: `Probabilidad del ${predictions.totalSets.twoSetsProbability}% de partido a 2 sets`,
        recommendedStake: 'low'
      });
    } else {
      recommendations.push({
        betType: BET_TYPES.TOTAL_SETS,
        selection: { line: 2.5, direction: 'over' },
        confidence: 'medium',
        reason: `Probabilidad del ${predictions.totalSets.threeSetsProbability}% de partido a 3 sets`,
        recommendedStake: 'low'
      });
    }
    
    // Recomendación para primer set
    const firstSetFavoriteProb = parseFloat(predictions.firstSetWinner.player1Probability);
    const firstSetUnderdogProb = parseFloat(predictions.firstSetWinner.player2Probability);
    
    if (Math.abs(firstSetFavoriteProb - firstSetUnderdogProb) > 15) {
      const firstSetFavorite = firstSetFavoriteProb > firstSetUnderdogProb ? 'player1' : 'player2';
      recommendations.push({
        betType: BET_TYPES.FIRST_SET_WINNER,
        selection: firstSetFavorite,
        confidence: 'medium',
        reason: `Diferencia significativa en probabilidad del primer set`,
        recommendedStake: 'low'
      });
    }
    
    // Recomendación para tie-break
    if (predictions.tiebreak.probability > 60) {
      recommendations.push({
        betType: BET_TYPES.TIEBREAK_WINNER,
        selection: 'any', // Cualquier ganador de tie-break
        confidence: 'medium',
        reason: `Alta probabilidad (${predictions.tiebreak.probability}) de tie-break en el partido`,
        recommendedStake: 'low'
      });
    }
    
    // Recomendación para over/under juegos
    const predictedGames = parseFloat(predictions.totalGames.predictedGames);
    if (predictedGames > 22) {
      recommendations.push({
        betType: BET_TYPES.TOTAL_GAMES,
        selection: { line: 22.5, direction: 'over' },
        confidence: 'medium',
        reason: `Se predicen ${predictedGames.toFixed(1)} juegos totales`,
        recommendedStake: 'low'
      });
    } else if (predictedGames < 22) {
      recommendations.push({
        betType: BET_TYPES.TOTAL_GAMES,
        selection: { line: 22.5, direction: 'under' },
        confidence: 'medium',
        reason: `Se predicen ${predictedGames.toFixed(1)} juegos totales`,
        recommendedStake: 'low'
      });
    }
    
    // Ordenar por confianza
    recommendations.sort((a, b) => {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });
    
    return recommendations;
  }
  
  /**
   * Analiza el valor de una apuesta
   */
  analyzeBetValue(match, betType, selection, odds) {
    const analysis = this.analyzeMatchup(match.player1Id, match.player2Id, match.surface);
    const predictions = analysis.predictions;
    
    let predictedProbability = 0;
    
    // Determinar la probabilidad predicha basada en el tipo de apuesta
    switch (betType) {
      case BET_TYPES.MATCH_WINNER:
        if (selection === 'player1') {
          predictedProbability = parseFloat(predictions.matchWinner.player1Probability);
        } else if (selection === 'player2') {
          predictedProbability = parseFloat(predictions.matchWinner.player2Probability);
        }
        break;
        
      case BET_TYPES.FIRST_SET_WINNER:
        if (selection === 'player1') {
          predictedProbability = parseFloat(predictions.firstSetWinner.player1Probability);
        } else if (selection === 'player2') {
          predictedProbability = parseFloat(predictions.firstSetWinner.player2Probability);
        }
        break;
        
      case BET_TYPES.TOTAL_SETS:
        if (selection.direction === 'over' && selection.line === 2.5) {
          predictedProbability = parseFloat(predictions.totalSets.threeSetsProbability);
        } else if (selection.direction === 'under' && selection.line === 2.5) {
          predictedProbability = parseFloat(predictions.totalSets.twoSetsProbability);
        }
        break;
        
      case BET_TYPES.TOTAL_GAMES:
        const predictedGames = parseFloat(predictions.totalGames.predictedGames);
        if (selection.direction === 'over') {
          predictedProbability = predictedGames > selection.line ? 60 : 40;
        } else if (selection.direction === 'under') {
          predictedProbability = predictedGames < selection.line ? 60 : 40;
        }
        break;
    }
    
    // Calcular el valor de la apuesta
    const decimalOdds = this.convertToDecimal(odds);
    const impliedProbability = (1 / decimalOdds) * 100;
    const value = predictedProbability - impliedProbability;
    
    let valueRating;
    if (value > 10) {
      valueRating = 'high_value';
    } else if (value > 5) {
      valueRating = 'good_value';
    } else if (value > 0) {
      valueRating = 'slight_value';
    } else if (value > -5) {
      valueRating = 'fair';
    } else if (value > -10) {
      valueRating = 'poor_value';
    } else {
      valueRating = 'bad_value';
    }
    
    return {
      predictedProbability: predictedProbability.toFixed(2) + '%',
      impliedProbability: impliedProbability.toFixed(2) + '%',
      value: value.toFixed(2) + '%',
      valueRating,
      recommendation: value > 0 ? 'Recomendada' : 'No recomendada',
      confidence: Math.abs(value) > 10 ? 'high' : Math.abs(value) > 5 ? 'medium' : 'low'
    };
  }
  
  /**
   * Convierte odds a formato decimal
   */
  convertToDecimal(odds) {
    if (typeof odds === 'number') {
      return odds; // Asumir que ya es decimal
    }
    
    if (typeof odds === 'string') {
      if (odds.includes('/')) {
        // Formato fraccionario
        const [numerator, denominator] = odds.split('/').map(Number);
        return numerator / denominator + 1;
      } else if (odds.startsWith('+') || odds.startsWith('-')) {
        // Formato americano
        const num = parseInt(odds);
        if (num > 0) {
          return num / 100 + 1;
        } else {
          return 100 / Math.abs(num) + 1;
        }
      } else {
        // Asumir decimal
        return parseFloat(odds);
      }
    }
    
    return parseFloat(odds);
  }
  
  /**
   * Obtiene estadísticas generales de piso duro
   */
  getHardCourtStatistics() {
    return {
      ...this.statistics.hardCourt,
      averageMatchDuration: '1h 45min', // Promedio histórico
      mostCommonScore: '6-4, 6-3', // Resultado más común en piso duro
      serveDominance: '75%', // Porcentaje de puntos ganados con el servicio
      returnImportance: '45%' // Porcentaje de puntos ganados en el retorno
    };
  }
  
  /**
   * Obtiene los mejores jugadores en piso duro por categoría
   */
  getTopHardCourtPlayers(category = 'winRate', limit = 10) {
    const hardCourtPlayers = Array.from(this.players.values()).filter(player => {
      const hardStats = player.getSurfaceStats(SURFACES.HARD);
      return hardStats.matchesPlayed >= 5; // Mínimo 5 partidos en piso duro
    });
    
    // Ordenar por la categoría especificada
    hardCourtPlayers.sort((a, b) => {
      const aValue = a.getSurfaceStats(SURFACES.HARD)[category] || 0;
      const bValue = b.getSurfaceStats(SURFACES.HARD)[category] || 0;
      return bValue - aValue;
    });
    
    return hardCourtPlayers.slice(0, limit);
  }
  
  /**
   * Busca jugadores por nombre
   */
  searchPlayers(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.players.values()).filter(player => 
      player.getFullName().toLowerCase().includes(lowerQuery) ||
      player.firstName.toLowerCase().includes(lowerQuery) ||
      player.lastName.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Busca partidos por torneo
   */
  searchMatchesByTournament(tournamentName) {
    return Array.from(this.matches.values()).filter(match => 
      match.tournament.toLowerCase().includes(tournamentName.toLowerCase())
    );
  }
  
  /**
   * Obtiene partidos futuros
   */
  getUpcomingMatches() {
    return Array.from(this.matches.values()).filter(match => match.isUpcoming());
  }
  
  /**
   * Obtiene partidos completados
   */
  getCompletedMatches() {
    return Array.from(this.matches.values()).filter(match => match.isCompleted());
  }
  
  /**
   * Obtiene partidos en progreso
   */
  getInProgressMatches() {
    return Array.from(this.matches.values()).filter(match => match.isInProgress());
  }
  
  /**
   * Carga datos de ejemplo para demostración
   */
  loadSampleData() {
    // Jugadores top en piso duro
    const topPlayers = [
      { name: 'Novak Djokovic', country: 'Serbia', ranking: 1, height: 188, hand: 'right', backhand: 'two-handed' },
      { name: 'Carlos Alcaraz', country: 'Spain', ranking: 2, height: 183, hand: 'right', backhand: 'two-handed' },
      { name: 'Daniil Medvedev', country: 'Russia', ranking: 3, height: 196, hand: 'right', backhand: 'two-handed' },
      { name: 'Jannik Sinner', country: 'Italy', ranking: 4, height: 185, hand: 'right', backhand: 'two-handed' },
      { name: 'Andrey Rublev', country: 'Russia', ranking: 5, height: 188, hand: 'right', backhand: 'two-handed' },
      { name: 'Stefanos Tsitsipas', country: 'Greece', ranking: 6, height: 193, hand: 'right', backhand: 'one-handed' },
      { name: 'Alexander Zverev', country: 'Germany', ranking: 7, height: 198, hand: 'right', backhand: 'two-handed' },
      { name: 'Casper Ruud', country: 'Norway', ranking: 8, height: 183, hand: 'right', backhand: 'two-handed' },
      { name: 'Taylor Fritz', country: 'USA', ranking: 9, height: 196, hand: 'right', backhand: 'two-handed' },
      { name: 'Frances Tiafoe', country: 'USA', ranking: 10, height: 180, hand: 'right', backhand: 'two-handed' }
    ];
    
    // Añadir jugadores
    topPlayers.forEach(playerData => {
      const player = this.addPlayer(playerData);
      
      // Actualizar estadísticas de ejemplo
      const hardStats = {
        matchesPlayed: 30 + Math.floor(Math.random() * 20),
        matchesWon: 20 + Math.floor(Math.random() * 15),
        winRate: 65 + Math.floor(Math.random() * 20),
        [STAT_CATEGORIES.FIRST_SERVE_PERCENTAGE]: 60 + Math.floor(Math.random() * 20),
        [STAT_CATEGORIES.SERVICE_POINTS_WON]: 65 + Math.floor(Math.random() * 15),
        [STAT_CATEGORIES.RETURN_POINTS_WON]: 35 + Math.floor(Math.random() * 10),
        [STAT_CATEGORIES.BREAK_POINTS_CONVERTED]: 40 + Math.floor(Math.random() * 15),
        titles: 2 + Math.floor(Math.random() * 3)
      };
      
      player.updateSurfaceStats(SURFACES.HARD, hardStats);
      
      // Actualizar estadísticas generales
      player.updateStats({
        [STAT_CATEGORIES.WIN_PERCENTAGE]: hardStats.winRate - 5 + Math.floor(Math.random() * 10),
        matchesPlayed: hardStats.matchesPlayed + 10 + Math.floor(Math.random() * 10),
        matchesWon: hardStats.matchesWon + 5 + Math.floor(Math.random() * 10)
      });
    });
    
    // Añadir algunos partidos de ejemplo
    const sampleMatches = [
      {
        tournament: TOURNAMENTS.AUSTRALIAN_OPEN,
        round: 'F',
        surface: SURFACES.HARD,
        date: new Date(Date.now() - 86400000 * 30).toISOString(), // Hace 30 días
        status: 'completed',
        player1Id: this.getAllPlayers()[0].id,
        player2Id: this.getAllPlayers()[1].id,
        result: { winner: 'player1', player1Score: '7-6, 6-4, 6-4', player2Score: '6-7, 4-6, 4-6' },
        score: { sets: [{ gamesP1: 7, gamesP2: 6 }, { gamesP1: 6, gamesP2: 4 }, { gamesP1: 6, gamesP2: 4 }] }
      },
      {
        tournament: TOURNAMENTS.INDIAN_WELLS,
        round: 'SF',
        surface: SURFACES.HARD,
        date: new Date(Date.now() - 86400000 * 15).toISOString(), // Hace 15 días
        status: 'completed',
        player1Id: this.getAllPlayers()[2].id,
        player2Id: this.getAllPlayers()[3].id,
        result: { winner: 'player2', player1Score: '6-7, 4-6', player2Score: '7-6, 6-4' },
        score: { sets: [{ gamesP1: 6, gamesP2: 7 }, { gamesP1: 4, gamesP2: 6 }] }
      },
      {
        tournament: TOURNAMENTS.MIAMI,
        round: 'QF',
        surface: SURFACES.HARD,
        date: new Date(Date.now() + 86400000 * 2).toISOString(), // En 2 días
        status: 'upcoming',
        player1Id: this.getAllPlayers()[4].id,
        player2Id: this.getAllPlayers()[5].id
      },
      {
        tournament: TOURNAMENTS.US_OPEN,
        round: 'R3',
        surface: SURFACES.HARD,
        date: new Date(Date.now() + 86400000 * 10).toISOString(), // En 10 días
        status: 'upcoming',
        player1Id: this.getAllPlayers()[6].id,
        player2Id: this.getAllPlayers()[7].id
      }
    ];
    
    sampleMatches.forEach(matchData => {
      const match = this.addMatch(matchData);
      
      // Asociar jugadores si están disponibles
      if (matchData.player1Id) {
        const player1 = this.getPlayer(matchData.player1Id);
        const player2 = this.getPlayer(matchData.player2Id);
        if (player1 && player2) {
          match.setPlayers(player1, player2);
        }
      }
    });
    
    return {
      players: this.getAllPlayers().length,
      matches: this.getAllMatches().length,
      hardCourtMatches: this.getHardCourtMatches().length
    };
  }
  
  /**
   * Exporta todos los datos para guardado
   */
  exportData() {
    return {
      players: Array.from(this.players.values()).map(p => p.toJSON()),
      matches: Array.from(this.matches.values()).map(m => m.toJSON()),
      statistics: this.statistics
    };
  }
  
  /**
   * Importa datos desde un objeto
   */
  importData(data) {
    if (data.players) {
      data.players.forEach(playerData => {
        const player = new Player(playerData);
        this.players.set(player.id, player);
      });
    }
    
    if (data.matches) {
      data.matches.forEach(matchData => {
        const match = new Match(matchData);
        this.matches.set(match.id, match);
        
        // Reasociar jugadores si existen
        if (matchData.player1Id && this.players.has(matchData.player1Id)) {
          match.player1 = this.players.get(matchData.player1Id);
        }
        if (matchData.player2Id && this.players.has(matchData.player2Id)) {
          match.player2 = this.players.get(matchData.player2Id);
        }
      });
    }
    
    if (data.statistics) {
      this.statistics = data.statistics;
    }
  }
}

module.exports = TennisAnalyzer;
