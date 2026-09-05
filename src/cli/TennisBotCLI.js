const readline = require('readline');
const { SURFACES, BET_TYPES, ODDS_FORMATS } = require('../config/constants');

/**
 * Interfaz de línea de comandos para el bot de apuestas de tenis
 * Optimizada para uso en móvil
 */
class TennisBotCLI {
  constructor(analyzer, betManager, dataUpdater) {
    this.analyzer = analyzer;
    this.betManager = betManager;
    this.dataUpdater = dataUpdater;
    this.rl = null;
    this.currentUser = null;
    this.currentMatch = null;
  }
  
  start() {
    console.log('\n=== TENNIS BOT - Especialista en Piso Duro ===\n');
    console.log('Bienvenido al sistema de apuestas de tenis especializado en piso duro');
    console.log('Analizamos todos los tipos de apuestas: Match Winner, Handicap, Over/Under, etc.\n');
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });
    
    this.showMainMenu();
  }
  
  showMainMenu() {
    console.log('\n=== MENU PRINCIPAL ===\n');
    console.log('1. Jugadores');
    console.log('2. Partidos');
    console.log('3. Analisis de enfrentamientos');
    console.log('4. Gestion de apuestas');
    console.log('5. Estadisticas');
    console.log('6. Actualizar datos');
    console.log('7. Configuracion');
    console.log('8. Salir');
    console.log('\nEscribe el numero o el comando');
    
    this.prompt('Selecciona una opcion: ', (input) => {
      this.handleMainMenuInput(input);
    });
  }
  
  handleMainMenuInput(input) {
    const normalizedInput = input.trim().toLowerCase();
    
    switch (normalizedInput) {
      case '1': case 'jugadores': case 'players':
        this.showPlayersMenu();
        break;
      case '2': case 'partidos': case 'matches':
        this.showMatchesMenu();
        break;
      case '3': case 'analizar': case 'analisis':
        this.showAnalysisMenu();
        break;
      case '4': case 'apuestas': case 'bets':
        this.showBetsMenu();
        break;
      case '5': case 'estadisticas': case 'stats':
        this.showStatistics();
        break;
      case '6': case 'actualizar': case 'update':
        this.updateData();
        break;
      case '7': case 'configurar': case 'config':
        this.showConfigMenu();
        break;
      case '8': case 'salir': case 'exit': case 'quit':
        this.exit();
        break;
      case 'ayuda': case 'help':
        this.showHelp();
        break;
      case 'menu':
        this.showMainMenu();
        break;
      default:
        console.log('Opcion no valida.');
        this.showMainMenu();
    }
  }
  
  showPlayersMenu() {
    console.log('\n=== JUGADORES ===\n');
    console.log('1. Listar todos los jugadores');
    console.log('2. Buscar jugador');
    console.log('3. Top jugadores en piso duro');
    console.log('4. Detalles de un jugador');
    console.log('5. Volver al menu principal');
    
    this.prompt('Selecciona una opcion: ', (input) => {
      const normalizedInput = input.trim().toLowerCase();
      
      switch (normalizedInput) {
        case '1': case 'listar': case 'list':
          this.listAllPlayers();
          break;
        case '2': case 'buscar': case 'search':
          this.searchPlayers();
          break;
        case '3': case 'top':
          this.showTopHardCourtPlayers();
          break;
        case '4': case 'detalles':
          this.showPlayerDetails();
          break;
        case '5': case 'volver': case 'back':
          this.showMainMenu();
          break;
        default:
          console.log('Opcion no valida.');
          this.showPlayersMenu();
      }
    });
  }
  
  listAllPlayers() {
    const players = this.analyzer.getAllPlayers();
    
    if (players.length === 0) {
      console.log('No hay jugadores cargados.');
      this.showPlayersMenu();
      return;
    }
    
    console.log('\n=== LISTA DE JUGADORES ===\n');
    
    players.forEach((player, index) => {
      const ranking = player.ranking || 'N/A';
      const winRate = player.getHardCourtWinRate().toFixed(1);
      const country = player.country || '?';
      console.log(`${index + 1}. ${player.getShortName().padEnd(20)} [${ranking}] ${winRate}% HC ${country}`);
    });
    
    console.log('\nTotal: ' + players.length + ' jugadores');
    
    this.prompt('Presiona Enter para volver...', () => {
      this.showPlayersMenu();
    });
  }
  
  searchPlayers() {
    this.prompt('Introduce el nombre del jugador: ', (query) => {
      if (!query.trim()) {
        console.log('Por favor, introduce un nombre.');
        this.searchPlayers();
        return;
      }
      
      const results = this.analyzer.searchPlayers(query);
      
      if (results.length === 0) {
        console.log('No se encontraron jugadores.');
        this.showPlayersMenu();
        return;
      }
      
      console.log('\n=== RESULTADOS DE BUSQUEDA ===\n');
      
      results.forEach((player, index) => {
        console.log(`${index + 1}. ${player.getFullName()} (${player.country}) - Ranking: ${player.ranking || 'N/A'}`);
      });
      
      this.prompt('Selecciona un jugador (numero) o "volver": ', (input) => {
        const selection = input.trim();
        
        if (selection.toLowerCase() === 'volver' || selection.toLowerCase() === 'back') {
          this.showPlayersMenu();
          return;
        }
        
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < results.length) {
          this.currentPlayer = results[index];
          this.showPlayerDetails(this.currentPlayer);
        } else {
          console.log('Seleccion no valida.');
          this.searchPlayers();
        }
      });
    });
  }
  
  showTopHardCourtPlayers() {
    const players = this.analyzer.getTopHardCourtPlayers('winRate', 10);
    
    if (players.length === 0) {
      console.log('No hay jugadores con estadisticas de piso duro.');
      this.showPlayersMenu();
      return;
    }
    
    console.log('\n=== TOP JUGADORES EN PISO DURO ===\n');
    
    players.forEach((player, index) => {
      const hardStats = player.getSurfaceStats(SURFACES.HARD);
      const winRate = hardStats.winRate.toFixed(1);
      const matches = hardStats.matchesPlayed;
      
      console.log(`${index + 1}. ${player.getFullName().padEnd(25)} ${winRate}% (${matches} partidos)`);
    });
    
    this.prompt('Presiona Enter para volver...', () => {
      this.showPlayersMenu();
    });
  }
  
  showPlayerDetails(player = null) {
    if (!player) {
      this.prompt('Introduce el ID o nombre del jugador: ', (input) => {
        const foundPlayer = this.analyzer.getAllPlayers().find(p => 
          p.id === input || p.getFullName().toLowerCase().includes(input.toLowerCase())
        );
        
        if (foundPlayer) {
          this.showPlayerDetails(foundPlayer);
        } else {
          console.log('Jugador no encontrado.');
          this.showPlayersMenu();
        }
      });
      return;
    }
    
    console.log('\n=== DETALLES DEL JUGADOR ===\n');
    
    console.log('Nombre: ' + player.getFullName());
    console.log('Pais: ' + (player.country || 'N/A'));
    console.log('Ranking: ' + (player.ranking || 'N/A') + ' (Maximo: ' + (player.highestRanking || 'N/A') + ')');
    console.log('Puntos: ' + player.rankingPoints);
    console.log('Edad: ' + (player.age || 'N/A') + ' anos');
    console.log('Altura: ' + (player.height ? player.height + ' cm' : 'N/A'));
    console.log('Mano: ' + player.hand);
    console.log('Reves: ' + player.backhand);
    console.log('Estilo: ' + player.playStyle.join(', '));
    console.log('Lesionado: ' + (player.isInjured() ? 'Si' : 'No'));
    
    console.log('\nESTADISTICAS GENERALES:');
    console.log('Win Rate: ' + player.getWinRate().toFixed(1) + '%');
    console.log('Partidos jugados: ' + (player.stats.matchesPlayed || 0));
    console.log('Partidos ganados: ' + (player.stats.matchesWon || 0));
    console.log('Titulos: ' + (player.stats.titles || 0));
    
    console.log('\nESTADISTICAS EN PISO DURO:');
    const hardStats = player.getSurfaceStats(SURFACES.HARD);
    console.log('Win Rate: ' + hardStats.winRate.toFixed(1) + '%');
    console.log('Partidos: ' + (hardStats.matchesPlayed || 0));
    console.log('Titulos: ' + (hardStats.titles || 0));
    console.log('1er Servicio: ' + (hardStats.first_serve_percentage || 0) + '%');
    console.log('Puntos con servicio: ' + (hardStats.service_points_won || 0) + '%');
    
    console.log('\nFORMA ACTUAL (ultimos 5 partidos):');
    const form = player.getCurrentForm();
    console.log('Partidos: ' + form.matches);
    console.log('Victorias: ' + form.wins);
    console.log('Derrotas: ' + form.losses);
    console.log('Win Rate: ' + form.winRate.toFixed(1) + '%');
    
    this.prompt('Presiona Enter para volver...', () => {
      this.currentPlayer = null;
      this.showPlayersMenu();
    });
  }
  
  showMatchesMenu() {
    console.log('\n=== PARTIDOS ===\n');
    console.log('1. Listar todos los partidos');
    console.log('2. Partidos de piso duro');
    console.log('3. Partidos futuros');
    console.log('4. Partidos completados');
    console.log('5. Buscar partido por torneo');
    console.log('6. Detalles de un partido');
    console.log('7. Volver al menu principal');
    
    this.prompt('Selecciona una opcion: ', (input) => {
      const normalizedInput = input.trim().toLowerCase();
      
      switch (normalizedInput) {
        case '1': case 'listar':
          this.listAllMatches();
          break;
        case '2': case 'piso duro':
          this.listHardCourtMatches();
          break;
        case '3': case 'futuros':
          this.listUpcomingMatches();
          break;
        case '4': case 'completados':
          this.listCompletedMatches();
          break;
        case '5': case 'buscar':
          this.searchMatchesByTournament();
          break;
        case '6': case 'detalles':
          this.showMatchDetails();
          break;
        case '7': case 'volver':
          this.showMainMenu();
          break;
        default:
          console.log('Opcion no valida.');
          this.showMatchesMenu();
      }
    });
  }
}
