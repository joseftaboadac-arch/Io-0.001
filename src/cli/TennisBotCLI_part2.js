const { SURFACES, BET_TYPES, ODDS_FORMATS } = require('../config/constants');

// Continuación de la clase TennisBotCLI
class TennisBotCLI_Part2 {
  constructor(cli) {
    this.cli = cli;
  }
  
  listAllMatches() {
    const matches = this.cli.analyzer.getAllMatches();
    
    if (matches.length === 0) {
      console.log('No hay partidos cargados.');
      this.cli.showMatchesMenu();
      return;
    }
    
    console.log('\n=== LISTA DE PARTIDOS ===\n');
    
    matches.slice(0, 20).forEach((match, index) => {
      const status = match.isCompleted() ? '✓' : match.isInProgress() ? '►' : '○';
      const surface = match.surface === SURFACES.HARD ? 'HARD' : match.surface;
      const players = match.getPlayerNames();
      
      console.log(`${index + 1}. ${status} ${match.tournament.padEnd(20)} ${surface} ${players.player1} vs ${players.player2}`);
    });
    
    if (matches.length > 20) {
      console.log('... y ' + (matches.length - 20) + ' partidos mas');
    }
    
    console.log('\nTotal: ' + matches.length + ' partidos');
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.cli.showMatchesMenu();
    });
  }
  
  listHardCourtMatches() {
    const matches = this.cli.analyzer.getHardCourtMatches();
    
    if (matches.length === 0) {
      console.log('No hay partidos de piso duro.');
      this.cli.showMatchesMenu();
      return;
    }
    
    console.log('\n=== PARTIDOS DE PISO DURO ===\n');
    
    matches.forEach((match, index) => {
      const status = match.isCompleted() ? '✓' : match.isInProgress() ? '►' : '○';
      const players = match.getPlayerNames();
      const round = match.getRoundName();
      
      console.log(`${index + 1}. ${status} ${match.tournament.padEnd(20)} ${round.padEnd(15)} ${players.player1} vs ${players.player2}`);
    });
    
    console.log('\nTotal: ' + matches.length + ' partidos de piso duro');
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.cli.showMatchesMenu();
    });
  }
  
  listUpcomingMatches() {
    const matches = this.cli.analyzer.getUpcomingMatches();
    
    if (matches.length === 0) {
      console.log('No hay partidos futuros.');
      this.cli.showMatchesMenu();
      return;
    }
    
    console.log('\n=== PARTIDOS FUTUROS ===\n');
    
    matches.forEach((match, index) => {
      const date = new Date(match.date).toLocaleDateString();
      const players = match.getPlayerNames();
      const tournament = match.tournament;
      
      console.log(`${index + 1}. ${date} - ${tournament.padEnd(20)} ${players.player1} vs ${players.player2}`);
    });
    
    this.cli.prompt('Selecciona un partido (numero) o "volver": ', (input) => {
      const selection = input.trim();
      
      if (selection.toLowerCase() === 'volver' || selection.toLowerCase() === 'back') {
        this.cli.showMatchesMenu();
        return;
      }
      
      const index = parseInt(selection) - 1;
      if (index >= 0 && index < matches.length) {
        this.cli.currentMatch = matches[index];
        this.cli.showMatchDetails(this.cli.currentMatch);
      } else {
        console.log('Seleccion no valida.');
        this.listUpcomingMatches();
      }
    });
  }
  
  listCompletedMatches() {
    const matches = this.cli.analyzer.getCompletedMatches();
    
    if (matches.length === 0) {
      console.log('No hay partidos completados.');
      this.cli.showMatchesMenu();
      return;
    }
    
    console.log('\n=== PARTIDOS COMPLETADOS ===\n');
    
    matches.slice(0, 10).forEach((match, index) => {
      const players = match.getPlayerNames();
      const winner = match.getWinner() ? match.getWinner().getShortName() : 'N/A';
      const score = match.getScoreString();
      
      console.log(`${index + 1}. ${match.tournament.padEnd(20)} ${players.player1} vs ${players.player2} - Ganador: ${winner} ${score}`);
    });
    
    if (matches.length > 10) {
      console.log('... y ' + (matches.length - 10) + ' partidos mas');
    }
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.cli.showMatchesMenu();
    });
  }
  
  searchMatchesByTournament() {
    this.cli.prompt('Introduce el nombre del torneo: ', (query) => {
      if (!query.trim()) {
        console.log('Por favor, introduce un nombre de torneo.');
        this.searchMatchesByTournament();
        return;
      }
      
      const results = this.cli.analyzer.searchMatchesByTournament(query);
      
      if (results.length === 0) {
        console.log('No se encontraron partidos para ese torneo.');
        this.cli.showMatchesMenu();
        return;
      }
      
      console.log('\n=== RESULTADOS DE BUSQUEDA ===\n');
      
      results.forEach((match, index) => {
        const players = match.getPlayerNames();
        const status = match.isCompleted() ? 'Completado' : match.isUpcoming() ? 'Futuro' : 'En progreso';
        
        console.log(`${index + 1}. ${match.tournament} - ${match.getRoundName()} - ${status}`);
        console.log(`   ${players.player1} vs ${players.player2}`);
      });
      
      this.cli.prompt('Selecciona un partido (numero) o "volver": ', (input) => {
        const selection = input.trim();
        
        if (selection.toLowerCase() === 'volver' || selection.toLowerCase() === 'back') {
          this.cli.showMatchesMenu();
          return;
        }
        
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < results.length) {
          this.cli.currentMatch = results[index];
          this.cli.showMatchDetails(this.cli.currentMatch);
        } else {
          console.log('Seleccion no valida.');
          this.searchMatchesByTournament();
        }
      });
    });
  }
  
  showMatchDetails(match = null) {
    if (!match) {
      this.cli.prompt('Introduce el ID del partido: ', (input) => {
        const foundMatch = this.cli.analyzer.getMatch(input);
        
        if (foundMatch) {
          this.showMatchDetails(foundMatch);
        } else {
          console.log('Partido no encontrado.');
          this.cli.showMatchesMenu();
        }
      });
      return;
    }
    
    console.log('\n=== DETALLES DEL PARTIDO ===\n');
    
    const players = match.getPlayerNames();
    const status = match.isCompleted() ? 'COMPLETADO' : match.isInProgress() ? 'EN PROGRESO' : 'FUTURO';
    
    console.log('Torneos: ' + match.tournament);
    console.log('Categoria: ' + match.getTournamentCategoryName());
    console.log('Ronda: ' + match.getRoundName());
    console.log('Superficie: ' + match.surface);
    console.log('Fecha: ' + new Date(match.date).toLocaleString());
    console.log('Estado: ' + status);
    
    console.log('\nJUGADORES:');
    console.log('1. ' + players.player1);
    console.log('2. ' + players.player2);
    
    if (match.isCompleted()) {
      const winner = match.getWinner();
      const score = match.getScoreString();
      console.log('\nRESULTADO:');
      console.log('Ganador: ' + (winner ? winner.getFullName() : 'N/A'));
      console.log('Score: ' + score);
      console.log('Sets: ' + match.getTotalSets());
      console.log('Juegos: ' + match.getTotalGames());
    }
    
    if (match.odds && match.odds.match_winner) {
      console.log('\nODDS DISPONIBLES:');
      const odds = match.odds.match_winner;
      if (odds.player1) {
        console.log('Jugador 1: ' + odds.player1);
      }
      if (odds.player2) {
        console.log('Jugador 2: ' + odds.player2);
      }
    }
    
    console.log('\nACCIONES:');
    console.log('1. Analizar este partido');
    console.log('2. Ver apuestas de este partido');
    console.log('3. Crear apuesta para este partido');
    console.log('4. Volver');
    
    this.cli.prompt('Selecciona una accion: ', (input) => {
      const selection = input.trim();
      
      switch (selection) {
        case '1':
          this.analyzeMatch(match);
          break;
        case '2':
          this.listBetsForMatch(match);
          break;
        case '3':
          this.cli.createBetForMatch(match);
          break;
        case '4':
        case 'volver':
        case 'back':
          this.cli.currentMatch = null;
          this.cli.showMatchesMenu();
          break;
        default:
          console.log('Opcion no valida.');
          this.showMatchDetails(match);
      }
    });
  }
  
  analyzeMatch(match) {
    if (!match.player1 || !match.player2) {
      console.log('El partido no tiene jugadores asignados.');
      this.cli.showAnalysisMenu();
      return;
    }
    
    console.log('\n=== ANALISIS DEL PARTIDO ===\n');
    console.log('Partido: ' + match.tournament + ' - ' + match.getRoundName());
    console.log('Superficie: ' + match.surface + '\n');
    
    const analysis = this.cli.analyzer.analyzeMatchup(
      match.player1.id, 
      match.player2.id, 
      match.surface
    );
    
    console.log('JUGADORES:');
    console.log('1. ' + analysis.player1.name);
    console.log('   Ranking: ' + (analysis.player1.ranking || 'N/A'));
    console.log('   Win Rate (HC): ' + analysis.player1.hardCourtWinRate.toFixed(1) + '%');
    console.log('   Forma actual: ' + analysis.player1.currentForm.winRate.toFixed(1) + '%');
    console.log('   Lesionado: ' + (analysis.player1.isInjured ? 'Si' : 'No'));
    
    console.log('\n2. ' + analysis.player2.name);
    console.log('   Ranking: ' + (analysis.player2.ranking || 'N/A'));
    console.log('   Win Rate (HC): ' + analysis.player2.hardCourtWinRate.toFixed(1) + '%');
    console.log('   Forma actual: ' + analysis.player2.currentForm.winRate.toFixed(1) + '%');
    console.log('   Lesionado: ' + (analysis.player2.isInjured ? 'Si' : 'No'));
    
    const predictions = analysis.predictions;
    
    console.log('\nPREDICCIONES:');
    console.log('Ganador del partido:');
    console.log('   ' + analysis.player1.name + ': ' + predictions.matchWinner.player1Probability);
    console.log('   ' + analysis.player2.name + ': ' + predictions.matchWinner.player2Probability);
    console.log('   Favorito: ' + predictions.matchWinner.favorite);
    console.log('   Confianza: ' + predictions.matchWinner.confidence);
    
    console.log('\nTotal de sets:');
    console.log('   2 sets: ' + predictions.totalSets.twoSetsProbability);
    console.log('   3 sets: ' + predictions.totalSets.threeSetsProbability);
    console.log('   Prediccion: ' + predictions.totalSets.prediction);
    
    console.log('\nPrimer set:');
    console.log('   ' + analysis.player1.name + ': ' + predictions.firstSetWinner.player1Probability);
    console.log('   ' + analysis.player2.name + ': ' + predictions.firstSetWinner.player2Probability);
    
    console.log('\nTie-break:');
    console.log('   ' + predictions.tiebreak.prediction);
    
    console.log('\nTotal de juegos:');
    console.log('   Prediccion: ' + predictions.totalGames.predictedGames + ' juegos');
    
    console.log('\nRECOMENDACIONES:');
    const recommendations = analysis.recommendations;
    
    if (recommendations.length > 0) {
      recommendations.forEach((rec, index) => {
        const betTypeName = this.getBetTypeName(rec.betType);
        console.log(`${index + 1}. ${betTypeName}`);
        console.log(`   Seleccion: ${JSON.stringify(rec.selection)}`);
        console.log(`   Confianza: ${rec.confidence}`);
        console.log(`   Razon: ${rec.reason}`);
        console.log(`   Apuesta recomendada: ${rec.recommendedStake}`);
      });
    } else {
      console.log('No hay recomendaciones disponibles.');
    }
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.cli.currentMatch = null;
      this.cli.showAnalysisMenu();
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
  
  listBetsForMatch(match) {
    const bets = this.cli.betManager.getBetsByMatch(match.id);
    
    if (bets.length === 0) {
      console.log('No hay apuestas para este partido.');
      this.cli.showMatchDetails(match);
      return;
    }
    
    console.log('\n=== APUESTAS PARA ESTE PARTIDO ===\n');
    
    bets.forEach((bet, index) => {
      const status = bet.isWon() ? 'GANADA' : bet.isLost() ? 'PERDIDA' : 'PENDIENTE';
      
      console.log(`${index + 1}. ${status} - ${this.getBetTypeName(bet.betType)}`);
      console.log(`   ${JSON.stringify(bet.betSelection)} @ ${bet.odds}`);
      console.log(`   Cantidad: ${bet.stake} - Potencial: ${bet.potentialPayout.toFixed(2)}`);
      console.log(`   Usuario: ${bet.username}`);
    });
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.cli.showMatchDetails(match);
    });
  }
  
  showAnalysisMenu() {
    console.log('\n=== ANALISIS DE ENFRENTAMIENTOS ===\n');
    console.log('1. Analizar partido existente');
    console.log('2. Comparar dos jugadores');
    console.log('3. Ver recomendaciones');
    console.log('4. Analizar valor de apuesta');
    console.log('5. Volver al menu principal');
    
    this.cli.prompt('Selecciona una opcion: ', (input) => {
      const normalizedInput = input.trim().toLowerCase();
      
      switch (normalizedInput) {
        case '1': case 'partido':
          this.selectMatchForAnalysis();
          break;
        case '2': case 'comparar':
          this.comparePlayers();
          break;
        case '3': case 'recomendaciones':
          this.showRecommendations();
          break;
        case '4': case 'valor':
          this.analyzeBetValue();
          break;
        case '5': case 'volver':
          this.cli.showMainMenu();
          break;
        default:
          console.log('Opcion no valida.');
          this.showAnalysisMenu();
      }
    });
  }
  
  selectMatchForAnalysis() {
    const upcomingMatches = this.cli.analyzer.getUpcomingMatches();
    
    if (upcomingMatches.length === 0) {
      console.log('No hay partidos futuros para analizar.');
      this.showAnalysisMenu();
      return;
    }
    
    console.log('\n=== SELECCIONA UN PARTIDO PARA ANALIZAR ===\n');
    
    upcomingMatches.forEach((match, index) => {
      const players = match.getPlayerNames();
      console.log(`${index + 1}. ${match.tournament} - ${players.player1} vs ${players.player2}`);
    });
    
    this.cli.prompt('Selecciona un partido (numero) o "volver": ', (input) => {
      const selection = input.trim();
      
      if (selection.toLowerCase() === 'volver' || selection.toLowerCase() === 'back') {
        this.showAnalysisMenu();
        return;
      }
      
      const index = parseInt(selection) - 1;
      if (index >= 0 && index < upcomingMatches.length) {
        this.analyzeMatch(upcomingMatches[index]);
      } else {
        console.log('Seleccion no valida.');
        this.selectMatchForAnalysis();
      }
    });
  }
  
  comparePlayers() {
    this.cli.prompt('Introduce el nombre del primer jugador: ', (player1Name) => {
      const player1 = this.cli.analyzer.getAllPlayers().find(p => 
        p.getFullName().toLowerCase().includes(player1Name.toLowerCase())
      );
      
      if (!player1) {
        console.log('Jugador no encontrado.');
        this.comparePlayers();
        return;
      }
      
      this.cli.prompt('Introduce el nombre del segundo jugador: ', (player2Name) => {
        const player2 = this.cli.analyzer.getAllPlayers().find(p => 
          p.getFullName().toLowerCase().includes(player2Name.toLowerCase())
        );
        
        if (!player2) {
          console.log('Jugador no encontrado.');
          this.comparePlayers();
          return;
        }
        
        const match = {
          player1, player2, surface: SURFACES.HARD, tournament: 'Comparacion directa'
        };
        this.analyzeMatch(match);
      });
    });
  }
  
  showRecommendations() {
    const upcomingMatches = this.cli.analyzer.getUpcomingMatches();
    
    if (upcomingMatches.length === 0) {
      console.log('No hay partidos futuros para generar recomendaciones.');
      this.showAnalysisMenu();
      return;
    }
    
    console.log('\n=== RECOMENDACIONES DE APUESTAS ===\n');
    
    upcomingMatches.forEach((match, matchIndex) => {
      const players = match.getPlayerNames();
      console.log('Partido ' + (matchIndex + 1) + ': ' + match.tournament);
      console.log(players.player1 + ' vs ' + players.player2);
      
      if (match.player1 && match.player2) {
        const recommendations = this.cli.analyzer.generateRecommendations(
          match.player1, match.player2, match.surface
        );
        
        if (recommendations.length > 0) {
          recommendations.forEach((rec, recIndex) => {
            const betTypeName = this.getBetTypeName(rec.betType);
            console.log(`  ${recIndex + 1}. ${betTypeName} - ${JSON.stringify(rec.selection)} (${rec.confidence})`);
          });
        } else {
          console.log('   No hay recomendaciones para este partido.');
        }
      }
    });
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.showAnalysisMenu();
    });
  }
  
  analyzeBetValue() {
    const matches = this.cli.analyzer.getUpcomingMatches();
    
    if (matches.length === 0) {
      console.log('No hay partidos futuros para analizar.');
      this.showAnalysisMenu();
      return;
    }
    
    console.log('\n=== ANALISIS DE VALOR DE APUESTA ===\n');
    
    matches.forEach((match, index) => {
      const players = match.getPlayerNames();
      console.log(`${index + 1}. ${match.tournament} - ${players.player1} vs ${players.player2}`);
    });
    
    this.cli.prompt('Selecciona un partido (numero): ', (matchSelection) => {
      const matchIndex = parseInt(matchSelection) - 1;
      
      if (matchIndex < 0 || matchIndex >= matches.length) {
        console.log('Seleccion no valida.');
        this.analyzeBetValue();
        return;
      }
      
      const selectedMatch = matches[matchIndex];
      
      if (!selectedMatch.player1 || !selectedMatch.player2) {
        console.log('El partido seleccionado no tiene jugadores asignados.');
        this.analyzeBetValue();
        return;
      }
      
      console.log('\nTIPOS DE APUESTA:');
      console.log('1. Ganador del partido');
      console.log('2. Ganador del primer set');
      console.log('3. Total de sets');
      console.log('4. Total de juegos');
      
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
          this.analyzeBetValue();
          return;
        }
        
        const betType = betTypes[betTypeIndex];
        
        this.cli.prompt('Introduce la seleccion (ej: "player1", "over", etc.): ', (selection) => {
          this.cli.prompt('Introduce las odds (formato decimal, ej: 1.80): ', (odds) => {
            const decimalOdds = parseFloat(odds);
            
            if (isNaN(decimalOdds)) {
              console.log('Odds no validas.');
              this.analyzeBetValue();
              return;
            }
            
            const analysis = this.cli.analyzer.analyzeBetValue(
              selectedMatch, betType, selection, decimalOdds
            );
            
            console.log('\nRESULTADO DEL ANALISIS:');
            console.log('Probabilidad predicha: ' + analysis.predictedProbability);
            console.log('Probabilidad implicita: ' + analysis.impliedProbability);
            console.log('Valor: ' + analysis.value);
            console.log('Calificacion: ' + analysis.valueRating);
            console.log('Recomendacion: ' + analysis.recommendation);
            console.log('Confianza: ' + analysis.confidence);
            
            this.cli.prompt('Presiona Enter para volver...', () => {
              this.showAnalysisMenu();
            });
          });
        });
      });
    });
  }
}

module.exports = TennisBotCLI_Part2;
