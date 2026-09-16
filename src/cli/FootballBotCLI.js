const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { TEAM_STATS, BET_TYPES, LEAGUES } = require('../config/footballConstants');

/**
 * Cerebro Robot de Futbol - CLI
 * Interfaz interactiva para el cerebro de apuestas de futbol.
 */
class FootballBotCLI {
  constructor(analyzer, betManager) {
    this.analyzer = analyzer;
    this.betManager = betManager;
    this.rl = null;
    this.currentTeam = null;
    this.currentMatch = null;
    this.username = 'anonymous';
  }

  start() {
    console.log('\n=== CEREBRO ROBOT DE FUTBOL ===\n');
    console.log('Sistema de analisis y prediccion de apuestas deportivas de futbol');
    console.log('El cerebro analiza: 1X2, Doble Chance, Over/Under goles, Ambos marcan, Handicap, etc.\n');

    // Cargar datos de ejemplo al iniciar para tener contenido
    if (this.analyzer.getAllTeams().length === 0) {
      console.log('Cargando datos de ejemplo...');
      this.analyzer.loadSampleData();
      console.log('Datos de ejemplo cargados.\n');
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    this.showMainMenu();
  }

  prompt(question, callback) {
    this.rl.question(question, (answer) => {
      callback(answer);
    });
  }

  showMainMenu() {
    console.log('\n=== MENU PRINCIPAL ===\n');
    console.log('1. Equipos');
    console.log('2. Partidos');
    console.log('3. Cerebro - Analisis y predicciones');
    console.log('4. Gestion de apuestas');
    console.log('5. Estadisticas');
    console.log('6. Datos (cargar/guardar)');
    console.log('7. Salir');
    console.log('\nEscribe el numero o el comando');

    this.prompt('Selecciona una opcion: ', (input) => this.handleMainMenuInput(input));
  }

  handleMainMenuInput(input) {
    const norm = input.trim().toLowerCase();
    switch (norm) {
      case '1': case 'equipos': case 'teams':
        this.showTeamsMenu(); break;
      case '2': case 'partidos': case 'matches':
        this.showMatchesMenu(); break;
      case '3': case 'analizar': case 'analisis': case 'cerebro':
        this.showAnalysisMenu(); break;
      case '4': case 'apuestas': case 'bets':
        this.showBetsMenu(); break;
      case '5': case 'estadisticas': case 'stats':
        this.showStatistics(); break;
      case '6': case 'datos': case 'data':
        this.showDataMenu(); break;
      case '7': case 'salir': case 'exit': case 'quit':
        this.exit(); break;
      case 'ayuda': case 'help':
        this.showHelp(); break;
      case 'menu':
        this.showMainMenu(); break;
      default:
        console.log('Opcion no valida.');
        this.showMainMenu();
    }
  }

  // ==================== EQUIPOS ====================
  showTeamsMenu() {
    console.log('\n=== EQUIPOS ===\n');
    console.log('1. Listar todos los equipos');
    console.log('2. Buscar equipo');
    console.log('3. Detalles de un equipo');
    console.log('4. Volver al menu principal');

    this.prompt('Selecciona una opcion: ', (input) => {
      const n = input.trim().toLowerCase();
      switch (n) {
        case '1': case 'listar': this.listAllTeams(); break;
        case '2': case 'buscar': this.searchTeams(); break;
        case '3': case 'detalles': this.showTeamDetails(); break;
        case '4': case 'volver': this.showMainMenu(); break;
        default: console.log('Opcion no valida.'); this.showTeamsMenu();
      }
    });
  }

  listAllTeams() {
    const teams = this.analyzer.getAllTeams();
    if (teams.length === 0) {
      console.log('No hay equipos cargados.');
      return this.showTeamsMenu();
    }
    console.log('\n=== LISTA DE EQUIPOS ===\n');
    teams.forEach((t, i) => {
      const pos = t.leaguePosition || 'N/A';
      const ppg = (t.stats[TEAM_STATS.POINTS_PER_GAME] || 0).toFixed(2);
      const form = t.form.slice(0, 5).join('') || '-';
      console.log(`${i + 1}. ${t.shortName.padEnd(5)} ${t.name.padEnd(20)} [${pos}] PPG:${ppg} Forma:${form}`);
    });
    console.log('\nTotal: ' + teams.length + ' equipos');
    this.prompt('Presiona Enter para volver...', () => this.showTeamsMenu());
  }

  searchTeams() {
    this.prompt('Introduce el nombre del equipo: ', (query) => {
      if (!query.trim()) {
        console.log('Introduce un nombre.');
        return this.searchTeams();
      }
      const results = this.analyzer.searchTeams(query);
      if (results.length === 0) {
        console.log('No se encontraron equipos.');
        return this.showTeamsMenu();
      }
      console.log('\n=== RESULTADOS ===\n');
      results.forEach((t, i) => {
        console.log(`${i + 1}. ${t.name} (${t.country}) - ${t.league} [${t.leaguePosition || 'N/A'}]`);
      });
      this.prompt('Selecciona un equipo (numero) o "volver": ', (sel) => {
        if (sel.trim().toLowerCase() === 'volver') return this.showTeamsMenu();
        const idx = parseInt(sel, 10) - 1;
        if (idx >= 0 && idx < results.length) {
          this.currentTeam = results[idx];
          this.showTeamDetails(results[idx]);
        } else {
          console.log('Seleccion no valida.');
          this.showTeamsMenu();
        }
      });
    });
  }

  showTeamDetails(team) {
    if (!team) {
      this.prompt('Introduce el ID o nombre del equipo: ', (input) => {
        const found = this.analyzer.getAllTeams().find(t =>
          t.id === input || t.name.toLowerCase().includes(input.toLowerCase())
        );
        if (found) this.showTeamDetails(found);
        else { console.log('Equipo no encontrado.'); this.showTeamsMenu(); }
      });
      return;
    }
    console.log('\n=== DETALLES DEL EQUIPO ===\n');
    console.log('Nombre: ' + team.name);
    console.log('Pais: ' + (team.country || 'N/A'));
    console.log('Liga: ' + team.league);
    console.log('Posicion: ' + (team.leaguePosition || 'N/A') + ' | Puntos: ' + team.leaguePoints);
    console.log('Forma reciente: ' + (team.form.slice(0, 5).join('-') || 'N/A'));

    console.log('\nESTADISTICAS GENERALES:');
    console.log('PPG: ' + (team.stats[TEAM_STATS.POINTS_PER_GAME] || 0).toFixed(2));
    console.log('Goles a favor/partido: ' + (team.stats[TEAM_STATS.GOALS_SCORED_PER_GAME] || 0).toFixed(2));
    console.log('Goles en contra/partido: ' + (team.stats[TEAM_STATS.GOALS_CONCEDED_PER_GAME] || 0).toFixed(2));
    console.log('Over 2.5%: ' + (team.stats[TEAM_STATS.OVER_25_RATE] || 0).toFixed(1));
    console.log('Ambos marcan%: ' + (team.stats[TEAM_STATS.BTTS_RATE] || 0).toFixed(1));
    console.log('Porteria a cero%: ' + (team.stats[TEAM_STATS.CLEAN_SHEET_RATE] || 0).toFixed(1));
    console.log('Corners/partido: ' + (team.stats[TEAM_STATS.AVG_CORNERS] || 0).toFixed(1));

    console.log('\nCOMO LOCAL:');
    console.log('Win rate: ' + (team.homeStats.winRate || 0).toFixed(1) + '%');
    console.log('Goles/partido: ' + (team.homeStats[TEAM_STATS.GOALS_SCORED_PER_GAME] || 0).toFixed(2) +
      ' / Recibe: ' + (team.homeStats[TEAM_STATS.GOALS_CONCEDED_PER_GAME] || 0).toFixed(2));

    console.log('\nCOMO VISITANTE:');
    console.log('Win rate: ' + (team.awayStats.winRate || 0).toFixed(1) + '%');
    console.log('Goles/partido: ' + (team.awayStats[TEAM_STATS.GOALS_SCORED_PER_GAME] || 0).toFixed(2) +
      ' / Recibe: ' + (team.awayStats[TEAM_STATS.GOALS_CONCEDED_PER_GAME] || 0).toFixed(2));

    this.prompt('Presiona Enter para volver...', () => {
      this.currentTeam = null;
      this.showTeamsMenu();
    });
  }

  // ==================== PARTIDOS ====================
  showMatchesMenu() {
    console.log('\n=== PARTIDOS ===\n');
    console.log('1. Listar todos los partidos');
    console.log('2. Partidos proximos (para apostar)');
    console.log('3. Partidos finalizados');
    console.log('4. Buscar por liga');
    console.log('5. Detalles de un partido');
    console.log('6. Volver al menu principal');

    this.prompt('Selecciona una opcion: ', (input) => {
      const n = input.trim().toLowerCase();
      switch (n) {
        case '1': case 'listar': this.listAllMatches(); break;
        case '2': case 'proximos': this.listUpcomingMatches(); break;
        case '3': case 'finalizados': this.listCompletedMatches(); break;
        case '4': case 'buscar': this.searchByLeague(); break;
        case '5': case 'detalles': this.showMatchDetails(); break;
        case '6': case 'volver': this.showMainMenu(); break;
        default: console.log('Opcion no valida.'); this.showMatchesMenu();
      }
    });
  }

  listAllMatches() {
    const matches = this.analyzer.getAllMatches();
    this.printMatches(matches, 'TODOS LOS PARTIDOS');
    this.prompt('Presiona Enter para volver...', () => this.showMatchesMenu());
  }

  listUpcomingMatches() {
    const matches = this.analyzer.getUpcomingMatches();
    this.printMatches(matches, 'PARTIDOS PROXIMOS');
    this.prompt('Presiona Enter para volver...', () => this.showMatchesMenu());
  }

  listCompletedMatches() {
    const matches = this.analyzer.getCompletedMatches();
    this.printMatches(matches, 'PARTIDOS FINALIZADOS');
    this.prompt('Presiona Enter para volver...', () => this.showMatchesMenu());
  }

  searchByLeague() {
    this.prompt('Introduce la liga (ej: La Liga, Premier): ', (query) => {
      const matches = this.analyzer.searchMatchesByLeague(query);
      this.printMatches(matches, 'RESULTADOS POR LIGA');
      this.prompt('Presiona Enter para volver...', () => this.showMatchesMenu());
    });
  }

  printMatches(matches, title) {
    if (matches.length === 0) {
      console.log('No hay partidos.');
      return;
    }
    console.log('\n=== ' + title + ' ===\n');
    matches.forEach((m, i) => {
      const status = m.isCompleted() ? '[FIN]' : m.isInProgress() ? '[LIVE]' : '[PROX]';
      const names = m.getTeamNames();
      const score = m.isCompleted() ? ' ' + m.getScoreString() : '';
      const date = new Date(m.date).toLocaleDateString('es-ES');
      console.log(`${i + 1}. ${status} ${date} ${m.league}`);
      console.log(`     ${names.home} vs ${names.away}${score}`);
    });
    console.log('\nTotal: ' + matches.length + ' partidos');
  }

  showMatchDetails() {
    const matches = this.analyzer.getAllMatches();
    if (matches.length === 0) {
      console.log('No hay partidos.');
      return this.showMatchesMenu();
    }
    this.printMatches(matches, 'SELECCIONA PARTIDO');
    this.prompt('Selecciona un partido (numero) o "volver": ', (sel) => {
      if (sel.trim().toLowerCase() === 'volver') return this.showMatchesMenu();
      const idx = parseInt(sel, 10) - 1;
      if (idx < 0 || idx >= matches.length) {
        console.log('Seleccion no valida.');
        return this.showMatchesMenu();
      }
      const match = matches[idx];
      this.currentMatch = match;
      this.printMatchDetails(match);
      this.prompt('Presiona Enter para volver...', () => {
        this.currentMatch = null;
        this.showMatchesMenu();
      });
    });
  }

  printMatchDetails(match) {
    const names = match.getTeamNames();
    console.log('\n=== DETALLES DEL PARTIDO ===\n');
    console.log('Liga: ' + match.league);
    console.log('Jornada: ' + match.round);
    console.log('Fecha: ' + new Date(match.date).toLocaleString('es-ES'));
    console.log('Estado: ' + match.status);
    console.log('Local: ' + names.home);
    console.log('Visitante: ' + names.away);
    if (match.isCompleted()) {
      console.log('Resultado: ' + match.getScoreString());
    }
    if (match.odds && match.odds[BET_TYPES.MATCH_WINNER].home) {
      const o = match.odds[BET_TYPES.MATCH_WINNER];
      console.log('\nCUOTAS 1X2:');
      console.log(`  Local: ${o.home} | Empate: ${o.draw} | Visitante: ${o.away}`);
      if (match.odds[BET_TYPES.OVER_UNDER_GOALS].length > 0) {
        const ou = match.odds[BET_TYPES.OVER_UNDER_GOALS][0];
        console.log(`  Over/Under ${ou.line}: Over ${ou.over} / Under ${ou.under}`);
      }
      if (match.odds[BET_TYPES.BOTH_TEAMS_SCORE].yes) {
        const btts = match.odds[BET_TYPES.BOTH_TEAMS_SCORE];
        console.log(`  Ambos marcan: Si ${btts.yes} / No ${btts.no}`);
      }
    }
  }

  // ==================== CEREBRO - ANALISIS ====================
  showAnalysisMenu() {
    console.log('\n=== CEREBRO ROBOT - ANALISIS ===\n');
    console.log('1. Analizar partido existente');
    console.log('2. Comparar dos equipos');
    console.log('3. Ver recomendaciones del cerebro');
    console.log('4. Analizar valor de una apuesta');
    console.log('5. Volver al menu principal');

    this.prompt('Selecciona una opcion: ', (input) => {
      const n = input.trim().toLowerCase();
      switch (n) {
        case '1': case 'analizar': this.analyzeExistingMatch(); break;
        case '2': case 'comparar': this.compareTwoTeams(); break;
        case '3': case 'recomendaciones': this.showRecommendations(); break;
        case '4': case 'valor': this.analyzeBetValueMenu(); break;
        case '5': case 'volver': this.showMainMenu(); break;
        default: console.log('Opcion no valida.'); this.showAnalysisMenu();
      }
    });
  }

  analyzeExistingMatch() {
    const matches = this.analyzer.getUpcomingMatches();
    const all = matches.length > 0 ? matches : this.analyzer.getAllMatches();
    if (all.length === 0) {
      console.log('No hay partidos para analizar. Carga datos primero.');
      return this.showAnalysisMenu();
    }
    console.log('\n=== SELECCIONA PARTIDO A ANALIZAR ===\n');
    all.forEach((m, i) => {
      const names = m.getTeamNames();
      console.log(`${i + 1}. ${m.league} - ${names.home} vs ${names.away}`);
    });
    this.prompt('Selecciona (numero) o "volver": ', (sel) => {
      if (sel.trim().toLowerCase() === 'volver') return this.showAnalysisMenu();
      const idx = parseInt(sel, 10) - 1;
      if (idx < 0 || idx >= all.length) {
        console.log('Seleccion no valida.');
        return this.showAnalysisMenu();
      }
      const match = all[idx];
      this.printFullAnalysis(match.homeTeamId, match.awayTeamId, match);
      this.prompt('Presiona Enter para volver...', () => this.showAnalysisMenu());
    });
  }

  compareTwoTeams() {
    const teams = this.analyzer.getAllTeams();
    if (teams.length < 2) {
      console.log('Necesitas al menos 2 equipos cargados.');
      return this.showAnalysisMenu();
    }
    console.log('\n=== SELECCIONA EQUIPO LOCAL ===\n');
    teams.forEach((t, i) => console.log(`${i + 1}. ${t.name} (${t.league})`));
    this.prompt('Local (numero): ', (sel1) => {
      const i1 = parseInt(sel1, 10) - 1;
      if (i1 < 0 || i1 >= teams.length) { console.log('No valido.'); return this.showAnalysisMenu(); }
      const home = teams[i1];
      console.log('\n=== SELECCIONA EQUIPO VISITANTE ===\n');
      teams.forEach((t, i) => {
        if (t.id !== home.id) console.log(`${i + 1}. ${t.name} (${t.league})`);
      });
      this.prompt('Visitante (numero): ', (sel2) => {
        const i2 = parseInt(sel2, 10) - 1;
        if (i2 < 0 || i2 >= teams.length || teams[i2].id === home.id) {
          console.log('No valido.'); return this.showAnalysisMenu();
        }
        const away = teams[i2];
        this.printFullAnalysis(home.id, away.id, null);
        this.prompt('Presiona Enter para volver...', () => this.showAnalysisMenu());
      });
    });
  }

  printFullAnalysis(homeId, awayId, match) {
    try {
      const a = this.analyzer.analyzeMatch(homeId, awayId);
      const p = a.predictions;

      console.log('\n=== ANALISIS DEL CEREBRO ===\n');
      console.log(`${a.home.name} (Local) vs ${a.away.name} (Visitante)`);
      if (match && match.league) console.log('Liga: ' + match.league);

      console.log('\nPROBABILIDADES 1X2:');
      console.log(`  Gana ${a.home.name}: ${p.matchWinner.homeProbability}`);
      console.log(`  Empate: ${p.matchWinner.drawProbability}`);
      console.log(`  Gana ${a.away.name}: ${p.matchWinner.awayProbability}`);
      console.log(`  Favorito: ${p.matchWinner.favorite} (confianza: ${p.matchWinner.confidence})`);

      console.log('\nDOBLE CHANCE:');
      console.log(`  ${a.home.name} o Empate: ${p.doubleChance.homeDraw}`);
      console.log(`  ${a.home.name} o ${a.away.name}: ${p.doubleChance.homeAway}`);
      console.log(`  Empate o ${a.away.name}: ${p.doubleChance.drawAway}`);

      console.log('\nGOLES:');
      console.log(`  Goles esperados: ${p.goals.expectedGoals.total} (Local ${p.goals.expectedGoals.home} / Visitante ${p.goals.expectedGoals.away})`);
      console.log(`  Over/Under 2.5: ${p.goals.overUnder25.prediction} (Over ${p.goals.overUnder25.overProbability})`);
      console.log(`  Resultado mas probable: ${p.goals.likelyScore}`);

      console.log('\nAMBOS MARCAN (BTTS):');
      console.log(`  ${p.btts.prediction} (Si: ${p.btts.yesProbability})`);

      console.log('\nCORNERS:');
      console.log(`  ${p.corners.prediction} (esperados ${p.corners.expectedCorners})`);

      console.log('\nRECOMENDACIONES DEL CEREBRO:');
      if (a.recommendations.length === 0) {
        console.log('  No hay recomendaciones de alta confianza para este partido.');
      } else {
        a.recommendations.forEach((r, i) => {
          console.log(`  ${i + 1}. [${r.confidence.toUpperCase()}] ${this.betTypeName(r.betType)} - ${r.reason}`);
          console.log(`     Stake recomendado: ${r.recommendedStake}`);
        });
      }

      // Valor vs cuotas del partido si existen
      if (match && match.odds && match.odds[BET_TYPES.MATCH_WINNER].home) {
        console.log('\nANALISIS DE VALOR (vs cuotas del partido):');
        const o = match.odds[BET_TYPES.MATCH_WINNER];
        ['home', 'draw', 'away'].forEach(sel => {
          const v = this.analyzer.analyzeBetValue(match, BET_TYPES.MATCH_WINNER, sel, o[sel]);
          const label = sel === 'home' ? a.home.name : sel === 'away' ? a.away.name : 'Empate';
          console.log(`  ${label} @${o[sel]}: ${v.valueRating} (${v.value})`);
        });
      }
    } catch (e) {
      console.log('Error en analisis: ' + e.message);
    }
  }

  showRecommendations() {
    const matches = this.analyzer.getUpcomingMatches();
    if (matches.length === 0) {
      console.log('No hay partidos proximos para recomendar.');
      return this.showAnalysisMenu();
    }
    console.log('\n=== RECOMENDACIONES DEL CEREBRO (partidos proximos) ===\n');
    let total = 0;
    matches.forEach((m) => {
      try {
        const a = this.analyzer.analyzeMatch(m.homeTeamId, m.awayTeamId);
        if (a.recommendations.length > 0) {
          console.log(`${m.league} - ${m.getTeamNames().home} vs ${m.getTeamNames().away}:`);
          a.recommendations.forEach((r, i) => {
            total++;
            console.log(`  ${i + 1}. [${r.confidence.toUpperCase()}] ${this.betTypeName(r.betType)} - ${r.reason}`);
          });
          console.log('');
        }
      } catch (e) { /* skip */ }
    });
    if (total === 0) console.log('No hay recomendaciones de alta confianza ahora mismo.');
    this.prompt('Presiona Enter para volver...', () => this.showAnalysisMenu());
  }

  analyzeBetValueMenu() {
    const matches = this.analyzer.getAllMatches().filter(m => m.homeTeam && m.awayTeam);
    if (matches.length === 0) {
      console.log('No hay partidos con equipos asignados.');
      return this.showAnalysisMenu();
    }
    console.log('\n=== ANALISIS DE VALOR DE APUESTA ===\n');
    matches.forEach((m, i) => {
      const n = m.getTeamNames();
      console.log(`${i + 1}. ${n.home} vs ${n.away}`);
    });
    this.prompt('Selecciona partido (numero): ', (sel) => {
      const idx = parseInt(sel, 10) - 1;
      if (idx < 0 || idx >= matches.length) { console.log('No valido.'); return this.showAnalysisMenu(); }
      const match = matches[idx];
      console.log('\nTIPO DE APUESTA:');
      console.log('1. Ganador (1X2)');
      console.log('2. Over/Under 2.5 goles');
      console.log('3. Ambos marcan');
      this.prompt('Tipo (numero): ', (t) => {
        const names = match.getTeamNames();
        let betType, options;
        switch (t.trim()) {
          case '1':
            betType = BET_TYPES.MATCH_WINNER;
            options = [{ key: 'home', label: names.home }, { key: 'draw', label: 'Empate' }, { key: 'away', label: names.away }];
            break;
          case '2':
            betType = BET_TYPES.OVER_UNDER_GOALS;
            options = [{ key: 'over', label: 'Over 2.5' }, { key: 'under', label: 'Under 2.5' }];
            break;
          case '3':
            betType = BET_TYPES.BOTH_TEAMS_SCORE;
            options = [{ key: 'yes', label: 'Si marcan' }, { key: 'no', label: 'No marcan' }];
            break;
          default:
            console.log('No valido.'); return this.showAnalysisMenu();
        }
        options.forEach((o, i) => console.log(`${i + 1}. ${o.label}`));
        this.prompt('Seleccion (numero): ', (s) => {
          const oi = parseInt(s, 10) - 1;
          if (oi < 0 || oi >= options.length) { console.log('No valido.'); return this.showAnalysisMenu(); }
          this.prompt('Introduce la cuota (decimal, ej 1.95): ', (oddsStr) => {
            const odds = parseFloat(oddsStr);
            if (isNaN(odds) || odds <= 1) { console.log('Cuota no valida.'); return this.showAnalysisMenu(); }
            const sel = options[oi].key === 'over' ? { direction: 'over' }
              : options[oi].key === 'under' ? { direction: 'under' }
              : options[oi].key;
            const v = this.analyzer.analyzeBetValue(match, betType, sel, odds);
            console.log('\n=== RESULTADO DEL ANALISIS DE VALOR ===\n');
            console.log(`Probabilidad del cerebro: ${v.predictedProbability}`);
            console.log(`Probabilidad implicada por la cuota: ${v.impliedProbability}`);
            console.log(`Valor: ${v.value}`);
            console.log(`Valoracion: ${v.valueRating}`);
            console.log(`Recomendacion: ${v.recommendation}`);
            this.prompt('Presiona Enter para volver...', () => this.showAnalysisMenu());
          });
        });
      });
    });
  }

  betTypeName(type) {
    const names = {
      [BET_TYPES.MATCH_WINNER]: 'Ganador (1X2)',
      [BET_TYPES.DOUBLE_CHANCE]: 'Doble Chance',
      [BET_TYPES.OVER_UNDER_GOALS]: 'Over/Under goles',
      [BET_TYPES.BOTH_TEAMS_SCORE]: 'Ambos marcan',
      [BET_TYPES.ASIAN_HANDICAP]: 'Handicap asiatico',
      [BET_TYPES.CORRECT_SCORE]: 'Resultado exacto',
      [BET_TYPES.DRAW_NO_BET]: 'Empate no valido',
      [BET_TYPES.TOTAL_GOALS]: 'Total goles',
      [BET_TYPES.OVER_UNDER_CORNERS]: 'Over/Under corners'
    };
    return names[type] || type;
  }

  // ==================== APUESTAS ====================
  showBetsMenu() {
    console.log('\n=== GESTION DE APUESTAS ===\n');
    console.log('1. Crear nueva apuesta');
    console.log('2. Listar mis apuestas');
    console.log('3. Apuestas pendientes');
    console.log('4. Apuestas ganadas');
    console.log('5. Apuestas perdidas');
    console.log('6. Estadisticas de apuestas');
    console.log('7. Volver al menu principal');

    this.prompt('Selecciona una opcion: ', (input) => {
      const n = input.trim().toLowerCase();
      switch (n) {
        case '1': case 'crear': this.createBet(); break;
        case '2': case 'listar': this.listBets(); break;
        case '3': case 'pendientes': this.listBetsByStatus('pending'); break;
        case '4': case 'ganadas': this.listBetsByStatus('won'); break;
        case '5': case 'perdidas': this.listBetsByStatus('lost'); break;
        case '6': case 'estadisticas': this.showBetStatistics(); break;
        case '7': case 'volver': this.showMainMenu(); break;
        default: console.log('Opcion no valida.'); this.showBetsMenu();
      }
    });
  }

  createBet() {
    const matches = this.analyzer.getAllMatches().filter(m => m.homeTeam && m.awayTeam);
    if (matches.length === 0) {
      console.log('No hay partidos disponibles.');
      return this.showBetsMenu();
    }
    console.log('\n=== CREAR APUESTA ===\n');
    matches.forEach((m, i) => {
      const n = m.getTeamNames();
      console.log(`${i + 1}. ${n.home} vs ${n.away} (${m.league})`);
    });
    this.prompt('Selecciona partido (numero): ', (sel) => {
      const idx = parseInt(sel, 10) - 1;
      if (idx < 0 || idx >= matches.length) { console.log('No valido.'); return this.showBetsMenu(); }
      const match = matches[idx];
      console.log('\nTIPO DE APUESTA:');
      console.log('1. Ganador (1X2)');
      console.log('2. Over/Under 2.5 goles');
      console.log('3. Ambos marcan');
      console.log('4. Doble chance');
      this.prompt('Tipo (numero): ', (t) => {
        const names = match.getTeamNames();
        let betType, options;
        switch (t.trim()) {
          case '1':
            betType = BET_TYPES.MATCH_WINNER;
            options = [{ key: 'home', label: names.home }, { key: 'draw', label: 'Empate' }, { key: 'away', label: names.away }];
            break;
          case '2':
            betType = BET_TYPES.OVER_UNDER_GOALS;
            options = [{ key: 'over', label: 'Over 2.5' }, { key: 'under', label: 'Under 2.5' }];
            break;
          case '3':
            betType = BET_TYPES.BOTH_TEAMS_SCORE;
            options = [{ key: 'yes', label: 'Si marcan' }, { key: 'no', label: 'No marcan' }];
            break;
          case '4':
            betType = BET_TYPES.DOUBLE_CHANCE;
            options = [{ key: 'home_draw', label: `${names.home} o Empate` }, { key: 'home_away', label: `${names.home} o ${names.away}` }, { key: 'draw_away', label: `Empate o ${names.away}` }];
            break;
          default:
            console.log('No valido.'); return this.showBetsMenu();
        }
        options.forEach((o, i) => console.log(`${i + 1}. ${o.label}`));
        this.prompt('Seleccion (numero): ', (s) => {
          const oi = parseInt(s, 10) - 1;
          if (oi < 0 || oi >= options.length) { console.log('No valido.'); return this.showBetsMenu(); }
          const selObj = options[oi].key === 'over' ? { direction: 'over' }
            : options[oi].key === 'under' ? { direction: 'under' }
            : options[oi].key;
          this.prompt('Cuota (decimal): ', (oddsStr) => {
            const odds = parseFloat(oddsStr);
            if (isNaN(odds) || odds <= 1) { console.log('Cuota no valida.'); return this.showBetsMenu(); }
            this.prompt('Cantidad apostada (stake): ', (stakeStr) => {
              const stake = parseFloat(stakeStr);
              if (isNaN(stake) || stake <= 0) { console.log('Stake no valido.'); return this.showBetsMenu(); }
              const bet = this.betManager.createBet({
                matchId: match.id,
                betType, betSelection: selObj, odds,
                stake, userId: this.username, username: this.username,
                bookmaker: 'manual'
              });
              console.log('\nApuesta creada: ' + bet.toString());
              this.prompt('Presiona Enter para volver...', () => this.showBetsMenu());
            });
          });
        });
      });
    });
  }

  listBets() { this.listBetsByStatus(null); }

  listBetsByStatus(status) {
    const bets = status ? this.betManager.getBetsByStatus(status) : this.betManager.getAllBets();
    if (bets.length === 0) {
      console.log(status ? `No hay apuestas ${status}.` : 'No hay apuestas.');
      return this.showBetsMenu();
    }
    console.log('\n=== APUESTAS' + (status ? ' (' + status.toUpperCase() + ')' : '') + ' ===\n');
    bets.forEach((b, i) => {
      const match = this.analyzer.getMatch(b.matchId);
      const mn = match ? match.getTeamNames().home + ' vs ' + match.getTeamNames().away : b.matchId;
      console.log(`${i + 1}. [${b.status.toUpperCase()}] ${this.betTypeName(b.betType)} @${b.odds} - ${b.stake} | ${mn}`);
    });
    this.prompt('Presiona Enter para volver...', () => this.showBetsMenu());
  }

  showBetStatistics() {
    const s = this.betManager.getStatistics();
    const winRate = isNaN(parseFloat(s.winRate)) ? '0.00%' : s.winRate;
    console.log('\n=== ESTADISTICAS DE APUESTAS ===\n');
    console.log('Total apuestas: ' + s.totalBets);
    console.log('Pendientes: ' + s.pendingBets);
    console.log('Ganadas: ' + s.wonBets);
    console.log('Perdidas: ' + s.lostBets);
    console.log('Win rate: ' + winRate);
    console.log('Beneficio neto: ' + (s.netProfit >= 0 ? '+' : '') + s.netProfit.toFixed(2));
    console.log('ROI: ' + s.roi);
    this.prompt('Presiona Enter para volver...', () => this.showBetsMenu());
  }

  // ==================== ESTADISTICAS GLOBALES ====================
  showStatistics() {
    const s = this.analyzer.getStatistics();
    console.log('\n=== ESTADISTICAS GLOBALES ===\n');
    console.log('Partidos analizados: ' + s.totalMatches);
    if (s.totalMatches > 0) {
      console.log('Victorias local: ' + s.homeWinRate.toFixed(1) + '%');
      console.log('Empates: ' + s.drawRate.toFixed(1) + '%');
      console.log('Victorias visitante: ' + s.awayWinRate.toFixed(1) + '%');
      console.log('Goles promedio: ' + s.avgGoals.toFixed(2));
      console.log('Ambos marcan (BTTS): ' + s.bttsRate.toFixed(1) + '%');
      console.log('Over 2.5 goles: ' + s.over25Rate.toFixed(1) + '%');
    }
    const betStats = this.betManager.getStatistics();
    console.log('\nAPUESTAS:');
    console.log('Total: ' + betStats.totalBets + ' | Win rate: ' + betStats.winRate + ' | ROI: ' + betStats.roi);
    this.prompt('Presiona Enter para volver...', () => this.showMainMenu());
  }

  // ==================== DATOS ====================
  showDataMenu() {
    console.log('\n=== DATOS ===\n');
    console.log('1. Cargar datos de ejemplo');
    console.log('2. Guardar datos en archivos');
    console.log('3. Volver al menu principal');
    this.prompt('Selecciona una opcion: ', (input) => {
      const n = input.trim().toLowerCase();
      switch (n) {
        case '1': case 'ejemplo':
          this.analyzer.loadSampleData();
          console.log('Datos de ejemplo cargados.');
          this.prompt('Presiona Enter para volver...', () => this.showDataMenu());
          break;
        case '2': case 'guardar':
          this.saveData();
          this.prompt('Presiona Enter para volver...', () => this.showDataMenu());
          break;
        case '3': case 'volver': this.showMainMenu(); break;
        default: console.log('Opcion no valida.'); this.showDataMenu();
      }
    });
  }

  saveData() {
    const dataDir = path.join(__dirname, '../../data');
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const fdata = this.analyzer.exportData();
      fs.writeFileSync(path.join(dataDir, 'football_teams.json'), JSON.stringify(fdata.teams, null, 2));
      fs.writeFileSync(path.join(dataDir, 'football_matches.json'), JSON.stringify(fdata.matches, null, 2));
      const bdata = this.betManager.exportData();
      fs.writeFileSync(path.join(dataDir, 'football_bets.json'), JSON.stringify(bdata.bets, null, 2));
      console.log('Datos guardados en /data');
    } catch (e) {
      console.log('Error al guardar: ' + e.message);
    }
  }

  showHelp() {
    console.log('\n=== AYUDA ===\n');
    console.log('COMANDOS: menu, salir, ayuda, equipos, partidos, analizar, apuestas, estadisticas, datos');
    console.log('Usa numeros o comandos. "volver" retrocede.');
    this.prompt('Presiona Enter para volver...', () => this.showMainMenu());
  }

  exit() {
    this.prompt('Seguro que quieres salir? (s/n): ', (input) => {
      if (['s', 'si', 'yes'].includes(input.toLowerCase())) {
        console.log('\nHasta luego! Buenas apuestas. \u26bd');
        this.rl.close();
        process.exit(0);
      } else {
        this.showMainMenu();
      }
    });
  }
}

module.exports = FootballBotCLI;
