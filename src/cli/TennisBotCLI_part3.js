const { BET_TYPES, ODDS_FORMATS } = require('../config/constants');

// Parte 3 de la CLI - Gestión de apuestas
class TennisBotCLI_Part3 {
  constructor(cli) {
    this.cli = cli;
  }
  
  createBetForMatch(match) {
    if (!match.player1 || !match.player2) {
      console.log('El partido no tiene jugadores asignados.');
      this.cli.showBetsMenu();
      return;
    }
    
    console.log('\n=== CREAR APUESTA PARA PARTIDO ===\n');
    const players = match.getPlayerNames();
    console.log('Partido: ' + match.tournament);
    console.log(players.player1 + ' vs ' + players.player2);
    console.log('Superficie: ' + match.surface + '\n');
    
    console.log('TIPOS DE APUESTA DISPONIBLES:');
    console.log('1. Ganador del partido');
    console.log('2. Ganador del primer set');
    console.log('3. Total de sets (Over/Under)');
    console.log('4. Total de juegos (Over/Under)');
    
    this.cli.prompt('Selecciona el tipo de apuesta (numero): ', (betTypeSelection) => {
      const betTypes = [
        BET_TYPES.MATCH_WINNER,
        BET_TYPES.FIRST_SET_WINNER,
        BET_TYPES.TOTAL_SETS,
        BET_TYPES.TOTAL_GAMES
      ];
      
      const betTypeIndex = parseInt(betTypeSelection) - 1;
      
      if (betTypeIndex < 0 || betTypeIndex >= betTypes.length) {
        console.log('Seleccion no valida.');
        this.createBetForMatch(match);
        return;
      }
      
      const betType = betTypes[betTypeIndex];
      this.createBetWithType(match, betType);
    });
  }
  
  createBetWithType(match, betType) {
    const players = match.getPlayerNames();
    
    console.log('\n=== ' + this.getBetTypeName(betType).toUpperCase() + ' ===\n');
    
    let selectionPrompt = '';
    let options = [];
    
    switch (betType) {
      case BET_TYPES.MATCH_WINNER:
      case BET_TYPES.FIRST_SET_WINNER:
        console.log('1. ' + players.player1);
        console.log('2. ' + players.player2);
        selectionPrompt = 'Selecciona el jugador (1 o 2): ';
        options = ['player1', 'player2'];
        break;
        
      case BET_TYPES.TOTAL_SETS:
        console.log('1. Over 2.5 sets');
        console.log('2. Under 2.5 sets');
        selectionPrompt = 'Selecciona Over o Under (1 o 2): ';
        options = [
          { line: 2.5, direction: 'over' },
          { line: 2.5, direction: 'under' }
        ];
        break;
        
      case BET_TYPES.TOTAL_GAMES:
        console.log('1. Over 22.5 juegos');
        console.log('2. Under 22.5 juegos');
        console.log('3. Over 20.5 juegos');
        console.log('4. Under 20.5 juegos');
        selectionPrompt = 'Selecciona una linea (1-4): ';
        options = [
          { line: 22.5, direction: 'over' },
          { line: 22.5, direction: 'under' },
          { line: 20.5, direction: 'over' },
          { line: 20.5, direction: 'under' }
        ];
        break;
    }
    
    this.cli.prompt(selectionPrompt, (selectionInput) => {
      const selectionIndex = parseInt(selectionInput) - 1;
      
      if (selectionIndex < 0 || selectionIndex >= options.length) {
        console.log('Seleccion no valida.');
        this.createBetWithType(match, betType);
        return;
      }
      
      const selection = options[selectionIndex];
      
      this.cli.prompt('Introduce las odds (formato decimal, ej: 1.80): ', (oddsInput) => {
        const odds = parseFloat(oddsInput);
        
        if (isNaN(odds)) {
          console.log('Odds no validas.');
          this.createBetWithType(match, betType);
          return;
        }
        
        this.cli.prompt('Introduce la cantidad a apostar: ', (stakeInput) => {
          const stake = parseFloat(stakeInput);
          
          if (isNaN(stake) || stake <= 0) {
            console.log('Cantidad no valida.');
            this.createBetWithType(match, betType);
            return;
          }
          
          if (!this.cli.currentUser) {
            this.cli.prompt('Introduce tu nombre de usuario: ', (username) => {
              this.cli.currentUser = { id: 'user_' + Date.now(), username };
              this.createBet(match, betType, selection, odds, stake, this.cli.currentUser);
            });
          } else {
            this.createBet(match, betType, selection, odds, stake, this.cli.currentUser);
          }
        });
      });
    });
  }
  
  createBet(match, betType, selection, odds, stake, user) {
    const betData = {
      matchId: match.id,
      betType,
      betSelection: selection,
      odds,
      oddsFormat: ODDS_FORMATS.DECIMAL,
      stake,
      userId: user.id,
      username: user.username,
      bookmaker: 'Manual'
    };
    
    const bet = this.cli.betManager.createBet(betData);
    
    console.log('\nApuesta creada con exito!');
    console.log('ID: ' + bet.id);
    console.log('Partido: ' + match.tournament);
    console.log('Tipo: ' + this.getBetTypeName(betType));
    console.log('Seleccion: ' + JSON.stringify(selection));
    console.log('Odds: ' + odds);
    console.log('Cantidad: ' + stake);
    console.log('Payout potencial: ' + bet.potentialPayout.toFixed(2));
    
    this.cli.prompt('Presiona Enter para continuar...', () => {
      this.cli.currentMatch = null;
      this.cli.showBetsMenu();
    });
  }
  
  getBetTypeName(betType) {
    const betTypeNames = {
      [BET_TYPES.MATCH_WINNER]: 'Ganador del partido',
      [BET_TYPES.HANDICAP]: 'Handicap',
      [BET_TYPES.OVER_UNDER]: 'Over/Under',
      [BET_TYPES.CORRECT_SCORE]: 'Resultado exacto',
      [BET_TYPES.FIRST_SET_WINNER]: 'Ganador del primer set',
      [BET_TYPES.TOTAL_SETS]: 'Total de sets',
      [BET_TYPES.TOTAL_GAMES]: 'Total de juegos'
    };
    
    return betTypeNames[betType] || betType;
  }
  
  showBetsMenu() {
    console.log('\n=== GESTION DE APUESTAS ===\n');
    console.log('1. Crear nueva apuesta');
    console.log('2. Listar mis apuestas');
    console.log('3. Ver apuestas pendientes');
    console.log('4. Ver apuestas ganadas');
    console.log('5. Ver apuestas perdidas');
    console.log('6. Ver estadisticas de apuestas');
    console.log('7. Volver al menu principal');
    
    this.cli.prompt('Selecciona una opcion: ', (input) => {
      const normalizedInput = input.trim().toLowerCase();
      
      switch (normalizedInput) {
        case '1': case 'crear':
          this.createNewBet();
          break;
        case '2': case 'listar':
          this.listMyBets();
          break;
        case '3': case 'pendientes':
          this.listPendingBets();
          break;
        case '4': case 'ganadas':
          this.listWonBets();
          break;
        case '5': case 'perdidas':
          this.listLostBets();
          break;
        case '6': case 'estadisticas':
          this.showBetStatistics();
          break;
        case '7': case 'volver':
          this.cli.showMainMenu();
          break;
        default:
          console.log('Opcion no valida.');
          this.showBetsMenu();
      }
    });
  }
  
  createNewBet() {
    const matches = this.cli.analyzer.getUpcomingMatches();
    
    if (matches.length === 0) {
      console.log('No hay partidos futuros para apostar.');
      this.showBetsMenu();
      return;
    }
    
    console.log('\n=== CREAR NUEVA APUESTA ===\n');
    
    matches.forEach((match, index) => {
      const players = match.getPlayerNames();
      console.log(`${index + 1}. ${match.tournament} - ${players.player1} vs ${players.player2}`);
    });
    
    this.cli.prompt('Selecciona un partido (numero): ', (matchSelection) => {
      const matchIndex = parseInt(matchSelection) - 1;
      
      if (matchIndex < 0 || matchIndex >= matches.length) {
        console.log('Seleccion no valida.');
        this.createNewBet();
        return;
      }
      
      this.cli.currentMatch = matches[matchIndex];
      this.createBetForMatch(this.cli.currentMatch);
    });
  }
  
  listMyBets() {
    if (!this.cli.currentUser) {
      this.cli.prompt('Introduce tu nombre de usuario: ', (username) => {
        this.cli.currentUser = { id: 'user_' + Date.now(), username };
        this.listMyBets();
      });
      return;
    }
    
    const bets = this.cli.betManager.getBetsByUser(this.cli.currentUser.id);
    
    if (bets.length === 0) {
      console.log('No tienes apuestas registradas.');
      this.showBetsMenu();
      return;
    }
    
    console.log('\n=== MIS APUESTAS ===\n');
    
    bets.forEach((bet, index) => {
      const status = bet.isWon() ? 'GANADA' : bet.isLost() ? 'PERDIDA' : 'PENDIENTE';
      
      console.log(`${index + 1}. ${status} - ${this.getBetTypeName(bet.betType)}`);
      console.log(`   ${JSON.stringify(bet.betSelection)} @ ${bet.odds}`);
      console.log(`   Cantidad: ${bet.stake} - Potencial: ${bet.potentialPayout.toFixed(2)}`);
      console.log(`   Fecha: ${new Date(bet.placedAt).toLocaleString()}`);
    });
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.showBetsMenu();
    });
  }
  
  listPendingBets() {
    const bets = this.cli.betManager.getBetsByStatus('pending');
    
    if (bets.length === 0) {
      console.log('No hay apuestas pendientes.');
      this.showBetsMenu();
      return;
    }
    
    console.log('\n=== APUESTAS PENDIENTES ===\n');
    
    bets.forEach((bet, index) => {
      const match = this.cli.analyzer.getMatch(bet.matchId);
      const matchName = match ? match.toString() : bet.matchId;
      
      console.log(`${index + 1}. ${this.getBetTypeName(bet.betType)} - ${matchName}`);
      console.log(`   ${JSON.stringify(bet.betSelection)} @ ${bet.odds}`);
      console.log(`   Cantidad: ${bet.stake} - Potencial: ${bet.potentialPayout.toFixed(2)}`);
    });
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.showBetsMenu();
    });
  }
  
  listWonBets() {
    const bets = this.cli.betManager.getBetsByStatus('won');
    
    if (bets.length === 0) {
      console.log('No hay apuestas ganadas.');
      this.showBetsMenu();
      return;
    }
    
    console.log('\n=== APUESTAS GANADAS ===\n');
    
    bets.forEach((bet, index) => {
      const profit = bet.getNetProfit();
      const roi = bet.getROI().toFixed(2);
      
      console.log(`${index + 1}. ${this.getBetTypeName(bet.betType)}`);
      console.log(`   ${JSON.stringify(bet.betSelection)} @ ${bet.odds}`);
      console.log(`   Cantidad: ${bet.stake} - Ganancia: +${profit.toFixed(2)} - ROI: ${roi}%`);
    });
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.showBetsMenu();
    });
  }
  
  listLostBets() {
    const bets = this.cli.betManager.getBetsByStatus('lost');
    
    if (bets.length === 0) {
      console.log('No hay apuestas perdidas.');
      this.showBetsMenu();
      return;
    }
    
    console.log('\n=== APUESTAS PERDIDAS ===\n');
    
    bets.forEach((bet, index) => {
      const loss = Math.abs(bet.getNetProfit());
      
      console.log(`${index + 1}. ${this.getBetTypeName(bet.betType)}`);
      console.log(`   ${JSON.stringify(bet.betSelection)} @ ${bet.odds}`);
      console.log(`   Cantidad: ${bet.stake} - Perdida: -${loss.toFixed(2)}`);
    });
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.showBetsMenu();
    });
  }
  
  showBetStatistics() {
    const stats = this.cli.betManager.getStatistics();
    
    console.log('\n=== ESTADISTICAS DE APUESTAS ===\n');
    
    console.log('RESUMEN:');
    console.log('Total de apuestas: ' + stats.totalBets);
    console.log('Pendientes: ' + stats.pendingBets);
    console.log('Ganadas: ' + stats.wonBets);
    console.log('Perdidas: ' + stats.lostBets);
    console.log('Nulas: ' + stats.voidBets);
    console.log('Devueltas: ' + stats.returnedBets);
    
    console.log('\nFINANCIERO:');
    console.log('Total apostado: ' + stats.totalStaked.toFixed(2));
    console.log('Total ganado: ' + stats.totalWon.toFixed(2));
    console.log('Total perdido: ' + stats.totalLost.toFixed(2));
    console.log('Beneficio neto: ' + (stats.netProfit >= 0 ? '+' : '') + stats.netProfit.toFixed(2));
    
    console.log('\nRENDIMIENTO:');
    console.log('Win Rate: ' + stats.winRate);
    console.log('ROI: ' + stats.roi);
    console.log('Bet Slips: ' + stats.betSlips);
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.showBetsMenu();
    });
  }
}

module.exports = TennisBotCLI_Part3;
