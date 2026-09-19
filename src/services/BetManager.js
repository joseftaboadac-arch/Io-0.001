const Bet = require('../models/Bet');
const { BET_TYPES, ODDS_FORMATS } = require('../config/constants');

/**
 * Gestor de apuestas
 * Permite crear, gestionar y analizar apuestas de tenis
 */
class BetManager {
  constructor(bankrollConfig = {}) {
    this.bets = new Map();
    this.betSlips = new Map();
    this.bankroll = {
      initialBankroll: bankrollConfig.initialBankroll || 1000,
      maxStakePercent: bankrollConfig.maxStakePercent || 10,
      kellyFraction: bankrollConfig.kellyFraction || 0.25
    };
  }
  
  /**
   * Configura la gestión de bankroll
   */
  configureBankroll(config = {}) {
    if (config.initialBankroll !== undefined) {
      this.bankroll.initialBankroll = config.initialBankroll;
    }
    if (config.maxStakePercent !== undefined) {
      this.bankroll.maxStakePercent = config.maxStakePercent;
    }
    if (config.kellyFraction !== undefined) {
      this.bankroll.kellyFraction = config.kellyFraction;
    }
    return this.bankroll;
  }
  
  /**
   * Crea una nueva apuesta
   */
  createBet(betData) {
    const stake = betData.stake || 0;
    const validation = this.validateStake(stake);
    
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    
    const bet = new Bet(betData);
    this.bets.set(bet.id, bet);
    
    // Añadir a bet slip si se especifica
    if (betData.betSlipId) {
      this.addBetToSlip(betData.betSlipId, bet);
    }
    
    return bet;
  }
  
  /**
   * Valida que un stake sea coherente con la gestión de bankroll
   */
  validateStake(stake) {
    if (isNaN(stake) || stake <= 0) {
      return { valid: false, message: 'El stake debe ser un número positivo' };
    }
    
    const stats = this.getStatistics();
    const available = stats.bankroll.available;
    
    if (stake > available) {
      return { 
        valid: false, 
        message: `Stake (${stake.toFixed(2)}) excede el bankroll disponible (${available.toFixed(2)})` 
      };
    }
    
    const maxStake = stats.bankroll.current * (this.bankroll.maxStakePercent / 100);
    if (stake > maxStake) {
      return {
        valid: false,
        message: `Stake (${stake.toFixed(2)}) excede el límite del ${this.bankroll.maxStakePercent}% del bankroll (${maxStake.toFixed(2)})`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Calcula el stake recomendado con el criterio de Kelly fraccional
   * @param {number} winProbability Probabilidad de ganar (entre 0 y 1)
   * @param {number} decimalOdds Cuota decimal
   */
  calculateKellyStake(winProbability, decimalOdds) {
    const netOdds = decimalOdds - 1;
    if (netOdds <= 0) {
      return 0;
    }
    
    const fullKellyFraction = (winProbability * decimalOdds - 1) / netOdds;
    const fractionalKelly = fullKellyFraction * this.bankroll.kellyFraction;
    
    if (fractionalKelly <= 0) {
      return 0;
    }
    
    const stats = this.getStatistics();
    const kellyStake = fractionalKelly * stats.bankroll.current;
    const maxStake = stats.bankroll.current * (this.bankroll.maxStakePercent / 100);
    
    return Math.round(Math.min(kellyStake, maxStake, stats.bankroll.available) * 100) / 100;
  }
  
  /**
   * Obtiene una apuesta por ID
   */
  getBet(betId) {
    return this.bets.get(betId);
  }
  
  /**
   * Obtiene todas las apuestas
   */
  getAllBets() {
    return Array.from(this.bets.values());
  }
  
  /**
   * Filtra apuestas por estado
   */
  getBetsByStatus(status) {
    return Array.from(this.bets.values()).filter(bet => bet.status === status);
  }
  
  /**
   * Filtra apuestas por tipo
   */
  getBetsByType(betType) {
    return Array.from(this.bets.values()).filter(bet => bet.betType === betType);
  }
  
  /**
   * Filtra apuestas por usuario
   */
  getBetsByUser(userId) {
    return Array.from(this.bets.values()).filter(bet => bet.userId === userId);
  }
  
  /**
   * Filtra apuestas por partido
   */
  getBetsByMatch(matchId) {
    return Array.from(this.bets.values()).filter(bet => bet.matchId === matchId);
  }
  
  /**
   * Actualiza una apuesta
   */
  updateBet(betId, updates) {
    const bet = this.getBet(betId);
    if (!bet) return null;
    
    // Actualizar la apuesta
    Object.assign(bet, updates);
    
    // Recalcular potential payout si cambiaron las odds o el stake
    if (updates.odds !== undefined || updates.stake !== undefined || updates.oddsFormat !== undefined) {
      bet.potentialPayout = bet.calculatePotentialPayout();
    }
    
    bet.lastUpdated = new Date().toISOString();
    return bet;
  }
  
  /**
   * Elimina una apuesta
   */
  deleteBet(betId) {
    const bet = this.getBet(betId);
    if (!bet) return false;
    
    // Eliminar de bet slip si existe
    if (bet.betSlipId && this.betSlips.has(bet.betSlipId)) {
      const slip = this.betSlips.get(bet.betSlipId);
      slip.bets = slip.bets.filter(b => b.id !== betId);
    }
    
    this.bets.delete(betId);
    return true;
  }
  
  /**
   * Resuelve una apuesta (marca como ganada o perdida)
   */
  settleBet(betId, result) {
    const bet = this.getBet(betId);
    if (!bet) return null;
    
    bet.setResult(result);
    
    return bet;
  }
  
  /**
   * Marca una apuesta como ganada
   */
  markBetAsWon(betId) {
    return this.settleBet(betId, 'won');
  }
  
  /**
   * Marca una apuesta como perdida
   */
  markBetAsLost(betId) {
    return this.settleBet(betId, 'lost');
  }
  
  /**
   * Marca una apuesta como nula
   */
  markBetAsVoid(betId) {
    return this.settleBet(betId, 'void');
  }
  
  /**
   * Marca una apuesta como devuelta
   */
  markBetAsReturned(betId) {
    return this.settleBet(betId, 'returned');
  }
  
  /**
   * Crea un bet slip (grupo de apuestas)
   */
  createBetSlip(slipData) {
    const slipId = 'slip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const betSlip = {
      id: slipId,
      name: slipData.name || `Bet Slip ${this.betSlips.size + 1}`,
      bets: slipData.bets || [],
      totalStake: slipData.totalStake || 0,
      totalPotentialPayout: slipData.totalPotentialPayout || 0,
      status: slipData.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: slipData.userId || null,
      username: slipData.username || 'anonymous'
    };
    
    this.betSlips.set(slipId, betSlip);
    return betSlip;
  }
  
  /**
   * Obtiene un bet slip por ID
   */
  getBetSlip(slipId) {
    return this.betSlips.get(slipId);
  }
  
  /**
   * Obtiene todos los bet slips
   */
  getAllBetSlips() {
    return Array.from(this.betSlips.values());
  }
  
  /**
   * Añade una apuesta a un bet slip
   */
  addBetToSlip(slipId, bet) {
    const slip = this.getBetSlip(slipId);
    if (!slip) return null;
    
    // Verificar si la apuesta ya está en el slip
    const existingBet = slip.bets.find(b => b.id === bet.id);
    if (existingBet) return slip;
    
    slip.bets.push(bet);
    slip.totalStake += bet.stake;
    slip.totalPotentialPayout += bet.potentialPayout;
    slip.updatedAt = new Date().toISOString();
    
    // Actualizar el bet slip ID en la apuesta
    bet.betSlipId = slipId;
    
    return slip;
  }
  
  /**
   * Elimina una apuesta de un bet slip
   */
  removeBetFromSlip(slipId, betId) {
    const slip = this.getBetSlip(slipId);
    if (!slip) return null;
    
    const betIndex = slip.bets.findIndex(b => b.id === betId);
    if (betIndex === -1) return slip;
    
    const [removedBet] = slip.bets.splice(betIndex, 1);
    slip.totalStake -= removedBet.stake;
    slip.totalPotentialPayout -= removedBet.potentialPayout;
    slip.updatedAt = new Date().toISOString();
    
    // Eliminar el bet slip ID de la apuesta
    if (this.bets.has(betId)) {
      const bet = this.bets.get(betId);
      bet.betSlipId = null;
    }
    
    return slip;
  }
  
  /**
   * Calcula el payout total de un bet slip
   */
  calculateSlipPayout(slipId) {
    const slip = this.getBetSlip(slipId);
    if (!slip) return 0;
    
    return slip.bets.reduce((total, bet) => total + bet.potentialPayout, 0);
  }
  
  /**
   * Verifica si todas las apuestas en un bet slip han ganado
   */
  areAllBetsWon(slipId) {
    const slip = this.getBetSlip(slipId);
    if (!slip) return false;
    return slip.bets.every(bet => bet.isWon());
  }
  
  /**
   * Verifica si alguna apuesta en un bet slip ha perdido
   */
  isAnyBetLost(slipId) {
    const slip = this.getBetSlip(slipId);
    if (!slip) return false;
    return slip.bets.some(bet => bet.isLost());
  }
  
  /**
   * Obtiene estadísticas del gestor de apuestas
   */
  getStatistics() {
    const allBets = this.getAllBets();
    const totalBets = allBets.length;
    const pendingBets = this.getBetsByStatus('pending').length;
    const wonBetList = this.getBetsByStatus('won');
    const lostBetList = this.getBetsByStatus('lost');
    const voidBets = this.getBetsByStatus('void').length;
    const returnedBets = this.getBetsByStatus('returned').length;
    
    const totalStaked = allBets.reduce((total, bet) => total + bet.stake, 0);
    const totalWon = wonBetList.reduce((total, bet) => total + bet.getNetProfit(), 0);
    const totalLost = lostBetList.reduce((total, bet) => total + bet.stake, 0);
    const totalReturned = this.getBetsByStatus('returned').reduce((total, bet) => total + bet.stake, 0);
    const totalVoid = this.getBetsByStatus('void').reduce((total, bet) => total + bet.stake, 0);
    const pendingExposure = this.getBetsByStatus('pending').reduce((total, bet) => total + bet.stake, 0);
    
    const winRate = wonBetList.length + lostBetList.length > 0 ? 
      (wonBetList.length / (wonBetList.length + lostBetList.length)) * 100 : 0;
    const netProfit = totalWon - totalLost;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
    const currentBankroll = this.bankroll.initialBankroll + netProfit;
    
    return {
      totalBets,
      pendingBets,
      wonBets: wonBetList.length,
      lostBets: lostBetList.length,
      voidBets,
      returnedBets,
      totalStaked,
      totalWon,
      totalLost,
      totalReturned,
      totalVoid,
      netProfit,
      winRate: winRate.toFixed(2) + '%',
      roi: roi.toFixed(2) + '%',
      betSlips: this.betSlips.size,
      bankroll: {
        initial: this.bankroll.initialBankroll,
        current: currentBankroll,
        pendingExposure,
        available: currentBankroll - pendingExposure,
        maxStakePercent: this.bankroll.maxStakePercent,
        kellyFraction: this.bankroll.kellyFraction
      }
    };
  }
  
  /**
   * Obtiene el historial de apuestas
   */
  getBetHistory(limit = 50, offset = 0) {
    return this.getAllBets()
      .sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt))
      .slice(offset, offset + limit);
  }
  
  /**
   * Obtiene las mejores apuestas (mayor ROI)
   */
  getBestBets(limit = 10) {
    return this.getBetsByStatus('won')
      .sort((a, b) => b.getROI() - a.getROI())
      .slice(0, limit);
  }
  
  /**
   * Obtiene las peores apuestas (mayor pérdida)
   */
  getWorstBets(limit = 10) {
    return this.getBetsByStatus('lost')
      .sort((a, b) => a.getROI() - b.getROI())
      .slice(0, limit);
  }
  
  /**
   * Obtiene apuestas por fecha
   */
  getBetsByDate(date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    return this.getAllBets().filter(bet => 
      new Date(bet.placedAt).toISOString().split('T')[0] === dateStr
    );
  }
  
  /**
   * Obtiene apuestas por rango de fechas
   */
  getBetsByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.getAllBets().filter(bet => {
      const betDate = new Date(bet.placedAt);
      return betDate >= start && betDate <= end;
    });
  }
  
  /**
   * Busca apuestas
   */
  searchBets(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllBets().filter(bet => 
      bet.username.toLowerCase().includes(lowerQuery) ||
      (bet.bookmaker && bet.bookmaker.toLowerCase().includes(lowerQuery)) ||
      bet.id.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Filtra apuestas por múltiples criterios
   */
  filterBets(criteria) {
    let bets = this.getAllBets();
    
    if (criteria.status) {
      bets = bets.filter(bet => bet.status === criteria.status);
    }
    
    if (criteria.betType) {
      bets = bets.filter(bet => bet.betType === criteria.betType);
    }
    
    if (criteria.userId) {
      bets = bets.filter(bet => bet.userId === criteria.userId);
    }
    
    if (criteria.matchId) {
      bets = bets.filter(bet => bet.matchId === criteria.matchId);
    }
    
    if (criteria.minStake) {
      bets = bets.filter(bet => bet.stake >= criteria.minStake);
    }
    
    if (criteria.maxStake) {
      bets = bets.filter(bet => bet.stake <= criteria.maxStake);
    }
    
    if (criteria.minOdds) {
      bets = bets.filter(bet => bet.odds >= criteria.minOdds);
    }
    
    if (criteria.maxOdds) {
      bets = bets.filter(bet => bet.odds <= criteria.maxOdds);
    }
    
    if (criteria.startDate) {
      const start = new Date(criteria.startDate);
      bets = bets.filter(bet => new Date(bet.placedAt) >= start);
    }
    
    if (criteria.endDate) {
      const end = new Date(criteria.endDate);
      bets = bets.filter(bet => new Date(bet.placedAt) <= end);
    }
    
    return bets;
  }
  
  /**
   * Exporta todas las apuestas para guardado
   */
  exportData() {
    return {
      bets: Array.from(this.bets.values()).map(b => b.toJSON()),
      betSlips: Array.from(this.betSlips.values()),
      statistics: this.getStatistics()
    };
  }
  
  /**
   * Importa datos desde un objeto
   */
  importData(data) {
    if (data.bets) {
      data.bets.forEach(betData => {
        const bet = new Bet(betData);
        this.bets.set(bet.id, bet);
      });
    }
    
    if (data.betSlips) {
      data.betSlips.forEach(slipData => {
        this.betSlips.set(slipData.id, slipData);
      });
    }
  }
  
  /**
   * Crea apuestas de ejemplo para demostración
   */
  createSampleBets() {
    const sampleBets = [
      {
        matchId: 'match_1',
        betType: BET_TYPES.MATCH_WINNER,
        betSelection: 'player1',
        odds: 1.80,
        oddsFormat: ODDS_FORMATS.DECIMAL,
        stake: 100,
        status: 'won',
        userId: 'user_1',
        username: 'TennisFan',
        bookmaker: 'Bet365',
        placedAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        matchId: 'match_2',
        betType: BET_TYPES.MATCH_WINNER,
        betSelection: 'player2',
        odds: 2.10,
        oddsFormat: ODDS_FORMATS.DECIMAL,
        stake: 50,
        status: 'lost',
        userId: 'user_1',
        username: 'TennisFan',
        bookmaker: 'Bet365',
        placedAt: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        matchId: 'match_3',
        betType: BET_TYPES.TOTAL_SETS,
        betSelection: { line: 2.5, direction: 'over' },
        odds: 1.90,
        oddsFormat: ODDS_FORMATS.DECIMAL,
        stake: 75,
        status: 'pending',
        userId: 'user_1',
        username: 'TennisFan',
        bookmaker: 'William Hill',
        placedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        matchId: 'match_4',
        betType: BET_TYPES.FIRST_SET_WINNER,
        betSelection: 'player1',
        odds: 1.75,
        oddsFormat: ODDS_FORMATS.DECIMAL,
        stake: 60,
        status: 'pending',
        userId: 'user_2',
        username: 'AceMaster',
        bookmaker: 'Pinnacle',
        placedAt: new Date().toISOString()
      },
      {
        matchId: 'match_5',
        betType: BET_TYPES.TOTAL_GAMES,
        betSelection: { line: 22.5, direction: 'under' },
        odds: 2.00,
        oddsFormat: ODDS_FORMATS.DECIMAL,
        stake: 40,
        status: 'pending',
        userId: 'user_2',
        username: 'AceMaster',
        bookmaker: 'Pinnacle',
        placedAt: new Date().toISOString()
      }
    ];
    
    const createdBets = sampleBets.map(betData => this.createBet(betData));
    
    // Crear un bet slip de ejemplo
    const slip = this.createBetSlip({
      name: 'Australian Open Bets',
      userId: 'user_1',
      username: 'TennisFan'
    });
    
    // Añadir apuestas al slip
    createdBets.slice(0, 3).forEach(bet => {
      this.addBetToSlip(slip.id, bet);
    });
    
    return {
      bets: createdBets.length,
      betSlips: 1
    };
  }
}

module.exports = BetManager;
