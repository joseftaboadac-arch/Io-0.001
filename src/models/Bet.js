const { BET_TYPES, ODDS_FORMATS } = require('../config/constants');

/**
 * Clase que representa una apuesta
 * Contiene toda la información necesaria para gestionar apuestas
 */
class Bet {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.matchId = data.matchId || null;
    this.betType = data.betType || BET_TYPES.MATCH_WINNER;
    this.betSelection = data.betSelection || null; // La selección específica (ej: player1, over 2.5, etc.)
    this.odds = data.odds || 0;
    this.oddsFormat = data.oddsFormat || ODDS_FORMATS.DECIMAL;
    this.stake = data.stake || 0; // Cantidad apostada
    this.potentialPayout = data.potentialPayout || this.calculatePotentialPayout();
    this.status = data.status || 'pending'; // pending, won, lost, void, returned
    this.result = data.result || null; // Resultado de la apuesta
    
    // Información del usuario
    this.userId = data.userId || null;
    this.username = data.username || 'anonymous';
    
    // Información temporal
    this.placedAt = data.placedAt || new Date().toISOString();
    this.settledAt = data.settledAt || null;
    
    // Información adicional
    this.notes = data.notes || '';
    this.bookmaker = data.bookmaker || null;
    this.betSlipId = data.betSlipId || null;
    
    // Fecha de última actualización
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
  }
  
  /**
   * Genera un ID único para la apuesta
   */
  generateId() {
    return 'bet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Calcula el payout potencial
   */
  calculatePotentialPayout() {
    if (this.oddsFormat === ODDS_FORMATS.DECIMAL) {
      return this.stake * this.odds;
    } else if (this.oddsFormat === ODDS_FORMATS.FRACTIONAL) {
      const [numerator, denominator] = this.odds.split('/').map(Number);
      return this.stake * (numerator / denominator + 1);
    } else if (this.oddsFormat === ODDS_FORMATS.AMERICAN) {
      if (this.odds > 0) {
        return this.stake * (this.odds / 100 + 1);
      } else {
        return this.stake * (100 / Math.abs(this.odds) + 1);
      }
    }
    return this.stake * this.odds;
  }
  
  /**
   * Convierte odds a formato decimal
   */
  convertToDecimalOdds(odds, format) {
    if (format === ODDS_FORMATS.DECIMAL) {
      return odds;
    } else if (format === ODDS_FORMATS.FRACTIONAL) {
      const [numerator, denominator] = odds.split('/').map(Number);
      return numerator / denominator + 1;
    } else if (format === ODDS_FORMATS.AMERICAN) {
      if (odds > 0) {
        return odds / 100 + 1;
      } else {
        return 100 / Math.abs(odds) + 1;
      }
    }
    return odds;
  }
  
  /**
   * Convierte odds a formato fraccionario
   */
  convertToFractionalOdds(odds, format) {
    if (format === ODDS_FORMATS.FRACTIONAL) {
      return odds;
    } else if (format === ODDS_FORMATS.DECIMAL) {
      const decimal = odds - 1;
      const gcd = (a, b) => b ? this.gcd(b, a % b) : a;
      const numerator = Math.round(decimal * 1000);
      const denominator = 1000;
      const commonDivisor = gcd(numerator, denominator);
      return `${numerator / commonDivisor}/${denominator / commonDivisor}`;
    } else if (format === ODDS_FORMATS.AMERICAN) {
      if (odds > 0) {
        const decimal = odds / 100 + 1;
        const fraction = decimal - 1;
        return `${odds}/100`;
      } else {
        const decimal = 100 / Math.abs(odds) + 1;
        const fraction = decimal - 1;
        return `100/${Math.abs(odds)}`;
      }
    }
    return odds;
  }
  
  /**
   * Convierte odds a formato americano
   */
  convertToAmericanOdds(odds, format) {
    if (format === ODDS_FORMATS.AMERICAN) {
      return odds;
    } else if (format === ODDS_FORMATS.DECIMAL) {
      if (odds >= 2) {
        return Math.round((odds - 1) * 100);
      } else {
        return Math.round(-100 / (odds - 1));
      }
    } else if (format === ODDS_FORMATS.FRACTIONAL) {
      const [numerator, denominator] = odds.split('/').map(Number);
      const decimal = numerator / denominator + 1;
      if (decimal >= 2) {
        return Math.round((decimal - 1) * 100);
      } else {
        return Math.round(-100 / (decimal - 1));
      }
    }
    return odds;
  }
  
  /**
   * Calcula el máximo común divisor (para conversión fraccionaria)
   */
  gcd(a, b) {
    return b ? this.gcd(b, a % b) : a;
  }
  
  /**
   * Establece el resultado de la apuesta
   */
  setResult(result) {
    this.result = result;
    this.status = result === 'won' ? 'won' : 
                  result === 'lost' ? 'lost' : 
                  result === 'void' ? 'void' : 'returned';
    this.settledAt = new Date().toISOString();
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Marca la apuesta como ganada
   */
  markAsWon() {
    this.setResult('won');
  }
  
  /**
   * Marca la apuesta como perdida
   */
  markAsLost() {
    this.setResult('lost');
  }
  
  /**
   * Marca la apuesta como nula
   */
  markAsVoid() {
    this.setResult('void');
  }
  
  /**
   * Verifica si la apuesta ha sido resuelta
   */
  isSettled() {
    return ['won', 'lost', 'void', 'returned'].includes(this.status);
  }
  
  /**
   * Verifica si la apuesta ha ganado
   */
  isWon() {
    return this.status === 'won';
  }
  
  /**
   * Verifica si la apuesta ha perdido
   */
  isLost() {
    return this.status === 'lost';
  }
  
  /**
   * Verifica si la apuesta está pendiente
   */
  isPending() {
    return this.status === 'pending';
  }
  
  /**
   * Obtiene el nombre del tipo de apuesta
   */
  getBetTypeName() {
    const betTypeNames = {
      [BET_TYPES.MATCH_WINNER]: 'Ganador del partido',
      [BET_TYPES.HANDICAP]: 'Handicap',
      [BET_TYPES.OVER_UNDER]: 'Over/Under',
      [BET_TYPES.CORRECT_SCORE]: 'Resultado exacto',
      [BET_TYPES.FIRST_SET_WINNER]: 'Ganador del primer set',
      [BET_TYPES.FIRST_SET_SCORE]: 'Resultado del primer set',
      [BET_TYPES.TIEBREAK_WINNER]: 'Ganador del tie-break',
      [BET_TYPES.TOTAL_SETS]: 'Total de sets',
      [BET_TYPES.SET_HANDICAP]: 'Handicap de sets',
      [BET_TYPES.SET_BETTING]: 'Apuesta por sets',
      [BET_TYPES.GAME_HANDICAP]: 'Handicap de juegos',
      [BET_TYPES.TOTAL_GAMES]: 'Total de juegos',
      [BET_TYPES.ACE_COUNT]: 'Número de aces',
      [BET_TYPES.DOUBLE_FAULT_COUNT]: 'Número de dobles faltas',
      [BET_TYPES.BREAK_POINT_CONVERSION]: 'Conversión de break points',
      [BET_TYPES.LIVE_MATCH_WINNER]: 'Ganador en vivo',
      [BET_TYPES.LIVE_NEXT_GAME]: 'Próximo juego en vivo',
      [BET_TYPES.LIVE_NEXT_SET]: 'Próximo set en vivo'
    };
    return betTypeNames[this.betType] || this.betType;
  }
  
  /**
   * Obtiene el nombre de la selección de la apuesta
   */
  getBetSelectionName() {
    if (!this.betSelection) return 'N/A';
    
    if (typeof this.betSelection === 'string') {
      if (this.betSelection === 'player1') return 'Jugador 1';
      if (this.betSelection === 'player2') return 'Jugador 2';
      if (this.betSelection === 'draw') return 'Empate';
      return this.betSelection;
    }
    
    if (typeof this.betSelection === 'object') {
      if (this.betSelection.handicap !== undefined) {
        return `Handicap ${this.betSelection.handicap}`;
      }
      if (this.betSelection.line !== undefined) {
        return `Línea ${this.betSelection.line}`;
      }
      if (this.betSelection.score !== undefined) {
        return `Resultado: ${this.betSelection.score}`;
      }
    }
    
    return JSON.stringify(this.betSelection);
  }
  
  /**
   * Obtiene la ganancia neta
   */
  getNetProfit() {
    if (this.status === 'won') {
      return this.potentialPayout - this.stake;
    } else if (this.status === 'returned') {
      return 0;
    }
    return -this.stake;
  }
  
  /**
   * Obtiene el retorno de inversión (ROI)
   */
  getROI() {
    if (this.stake === 0) return 0;
    return (this.getNetProfit() / this.stake) * 100;
  }
  
  /**
   * Actualiza el stake
   */
  updateStake(newStake) {
    this.stake = newStake;
    this.potentialPayout = this.calculatePotentialPayout();
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Actualiza las odds
   */
  updateOdds(newOdds, newFormat) {
    this.odds = newOdds;
    if (newFormat) {
      this.oddsFormat = newFormat;
    }
    this.potentialPayout = this.calculatePotentialPayout();
    this.lastUpdated = new Date().toISOString();
  }
  
  /**
   * Convierte la apuesta a un objeto simple (para JSON)
   */
  toJSON() {
    return {
      id: this.id,
      matchId: this.matchId,
      betType: this.betType,
      betSelection: this.betSelection,
      odds: this.odds,
      oddsFormat: this.oddsFormat,
      stake: this.stake,
      potentialPayout: this.potentialPayout,
      status: this.status,
      result: this.result,
      userId: this.userId,
      username: this.username,
      placedAt: this.placedAt,
      settledAt: this.settledAt,
      notes: this.notes,
      bookmaker: this.bookmaker,
      betSlipId: this.betSlipId,
      lastUpdated: this.lastUpdated
    };
  }
  
  /**
   * Convierte la apuesta a una cadena legible
   */
  toString() {
    const betTypeName = this.getBetTypeName();
    const selectionName = this.getBetSelectionName();
    const oddsStr = this.getOddsString();
    const stakeStr = this.formatCurrency(this.stake);
    const payoutStr = this.formatCurrency(this.potentialPayout);
    const statusStr = this.status.toUpperCase();
    
    return `${betTypeName} - ${selectionName} @ ${oddsStr} - ${stakeStr} (Potencial: ${payoutStr}) [${statusStr}]`;
  }
  
  /**
   * Obtiene las odds en formato legible
   */
  getOddsString() {
    if (this.oddsFormat === ODDS_FORMATS.DECIMAL) {
      return this.odds.toFixed(2);
    } else if (this.oddsFormat === ODDS_FORMATS.FRACTIONAL) {
      return this.odds;
    } else if (this.oddsFormat === ODDS_FORMATS.AMERICAN) {
      return this.odds;
    }
    return this.odds;
  }
  
  /**
   * Formatea una cantidad como moneda
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  /**
   * Obtiene un resumen de la apuesta
   */
  getSummary() {
    return {
      id: this.id,
      betType: this.betType,
      betTypeName: this.getBetTypeName(),
      betSelection: this.betSelection,
      betSelectionName: this.getBetSelectionName(),
      odds: this.odds,
      oddsFormat: this.oddsFormat,
      oddsString: this.getOddsString(),
      stake: this.stake,
      stakeFormatted: this.formatCurrency(this.stake),
      potentialPayout: this.potentialPayout,
      potentialPayoutFormatted: this.formatCurrency(this.potentialPayout),
      netProfit: this.getNetProfit(),
      netProfitFormatted: this.formatCurrency(this.getNetProfit()),
      roi: this.getROI().toFixed(2) + '%',
      status: this.status,
      statusText: this.status.toUpperCase(),
      placedAt: this.placedAt,
      settledAt: this.settledAt,
      isSettled: this.isSettled(),
      isWon: this.isWon(),
      isLost: this.isLost()
    };
  }
}

module.exports = Bet;
