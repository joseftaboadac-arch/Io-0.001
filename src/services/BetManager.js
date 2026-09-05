const Bet = require('../models/Bet');
const { BET_TYPES, ODDS_FORMATS } = require('../config/constants');

/**
 * Gestor de apuestas
 * Permite crear, gestionar y analizar apuestas de tenis
 */
class BetManager {
  constructor() {
    this.bets = new Map();
    this.betSlips = new Map();
    this.totalStaked = 0;
    this.totalWon = 0;
    this.totalLost = 0;
    this.totalReturned = 0;
    this.totalVoid = 0;
  }
  
  /**
   * Crea una nueva apuesta
   */
  createBet(betData) {
    const bet = new Bet(betData);
    this.bets.set(bet.id, bet);
    this.totalStaked += bet.stake;
    
    // Añadir a bet slip si se especifica
    if (betData.betSlipId) {
      this.addBetToSlip(betData.betSlipId, bet);
    }
    
    return bet;
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
    
    const oldStake = bet.stake;
    const oldStatus = bet.status;
    
    // Actualizar la apuesta
    Object.assign(bet, updates);
    
    // Recalcular potential payout si cambiaron las odds o el stake
    if (updates.odds !== undefined || updates.stake !== undefined || updates.oddsFormat !== undefined) {
      bet.potentialPayout = bet.calculatePotentialPayout();
    }
    
    // Actualizar totales si cambió el stake
    if (updates.stake !== undefined) {
      this.totalStaked += (bet.stake - oldStake);
    }
    
    // Actualizar totales si cambió el estado
    if (updates.status !== undefined && updates.status !== oldStatus) {
      this.updateTotalsFromStatusChange(oldStatus, updates.status, bet);
    }
    
    bet.lastUpdated = new Date().toISOString();
    return bet;
  }
  
  /**
   * Actualiza los totales cuando cambia el estado de una apuesta
   */
  updateTotalsFromStatusChange(oldStatus, newStatus, bet) {
    // Restar del total anterior
    switch (oldStatus) {
      case 'won':
        this.totalWon -= bet.getNetProfit();
        break;
      case 'lost':
        this.totalLost -= Math.abs(bet.getNetProfit());
        break;
      case 'returned':
        this.totalReturned -= bet.stake;
        break;
      case 'void':
        this.totalVoid -= bet.stake;
        break;
    }
    
    // Añadir al nuevo total
    switch (newStatus) {
      case 'won':
        this.totalWon += bet.getNetProfit();
        break;
      case 'lost':
        this.totalLost += Math.abs(bet.getNetProfit());
        break;
      case 'returned':
        this.totalReturned += bet.stake;
        break;
      case 'void':
        this.totalVoid += bet.stake;
        break;
    }
  }
  
  /**
   * Elimina una apuesta
   */
  deleteBet(betId) {
    const bet = this.getBet(betId);
    if (!bet) return false;
    
    // Actualizar totales
    this.totalStaked -= bet.stake;
    
    if (bet.isWon()) {
      this.totalWon -= bet.getNetProfit();
    } else if (bet.isLost()) {
      this.totalLost -= Math.abs(bet.getNetProfit());
    } else if (bet.status === 'returned') {
      this.totalReturned -= bet.stake;
    } else if (bet.status === 'void') {
      this.totalVoid -= bet.stake;
    }
    
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
    
    const oldStatus = bet.status;
    bet.setResult(result);
    
    // Actualizar totales
    this.updateTotalsFromStatusChange(oldStatus, bet.status, bet);
    
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
    const wonBets = this.getBetsByStatus('won').length;
    const lostBets = this.getBetsByStatus('lost').length;
    const voidBets = this.getBetsByStatus('void').length;
    const returnedBets = this.getBetsByStatus('returned').length;
    
    const winRate = totalBets > 0 ? (wonBets / (wonBets + lostBets)) * 100 : 0;
    const netProfit = this.totalWon - this.totalLost;
    const roi = this.totalStaked > 0 ? (netProfit / this.totalStaked) * 100 : 0;
    
    return {
      totalBets,
      pendingBets,
      wonBets,
      lostBets,
      voidBets,
      returnedBets,
      totalStaked: this.totalStaked,
      totalWon: this.totalWon,
      totalLost: this.totalLost,
      totalReturned: this.totalReturned,
      totalVoid: this.totalVoid,
      netProfit,
      winRate: winRate.toFixed(2) + '%',
      roi: roi.toFixed(2) + '%',
      betSlips: this.betSlips.size
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
        this.totalStaked += bet.stake;
        
        if (bet.isWon()) {
          this.totalWon += bet.getNetProfit();
        } else if (bet.isLost()) {
          this.totalLost += Math.abs(bet.getNetProfit());
        } else if (bet.status === 'returned') {
          this.totalReturned += bet.stake;
        } else if (bet.status === 'void') {
          this.totalVoid += bet.stake;
        }
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
    
    sampleBets.forEach(betData => {
      this.createBet(betData);
    });
    
    // Crear un bet slip de ejemplo
    const slip = this.createBetSlip({
      name: 'Australian Open Bets',
      userId: 'user_1',
      username: 'TennisFan'
    });
    
    // Añadir apuestas al slip
    this.addBetToSlip(slip.id, this.getBet(sampleBets[0].id));
    this.addBetToSlip(slip.id, this.getBet(sampleBets[1].id));
    this.addBetToSlip(slip.id, this.getBet(sampleBets[2].id));
    
    return {
      bets: sampleBets.length,
      betSlips: 1
    };
  }
}

module.exports = BetManager;
