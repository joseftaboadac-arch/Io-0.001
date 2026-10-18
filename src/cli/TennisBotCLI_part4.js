// Parte 4 de la CLI - Estadisticas, actualizacion y configuracion
class TennisBotCLI_Part4 {
  constructor(cli) {
    this.cli = cli;
  }
  
  showStatistics() {
    const hardCourtStats = this.cli.analyzer.getHardCourtStatistics();
    const topPlayers = this.cli.analyzer.getTopHardCourtPlayers('winRate', 5);
    const betStats = this.cli.betManager.getStatistics();
    
    console.log('\n=== ESTADISTICAS GENERALES ===\n');
    
    console.log('ESTADISTICAS DE PISO DURO:');
    console.log('Total de partidos: ' + hardCourtStats.totalMatches);
    console.log('Partidos a 2 sets: ' + hardCourtStats.twoSetMatches);
    console.log('Partidos a 3 sets: ' + hardCourtStats.threeSetMatches);
    console.log('Promedio de aces: ' + hardCourtStats.averageAces.toFixed(1));
    console.log('Promedio de dobles faltas: ' + hardCourtStats.averageDoubleFaults.toFixed(1));
    console.log('Duracion promedio: ' + hardCourtStats.averageMatchDuration);
    console.log('Resultado mas comun: ' + hardCourtStats.mostCommonScore);
    
    console.log('\nTOP 5 JUGADORES EN PISO DURO:');
    topPlayers.forEach((player, index) => {
      const hardStats = player.getSurfaceStats('hard');
      console.log(`${index + 1}. ${player.getShortName().padEnd(15)} ${hardStats.winRate.toFixed(1)}% (${hardStats.matchesPlayed} partidos)`);
    });
    
    console.log('\nESTADISTICAS DE APUESTAS:');
    console.log('Total de apuestas: ' + betStats.totalBets);
    console.log('Win Rate: ' + betStats.winRate);
    console.log('ROI: ' + betStats.roi);
    console.log('Beneficio neto: ' + (betStats.netProfit >= 0 ? '+' : '') + betStats.netProfit.toFixed(2));
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.cli.showMainMenu();
    });
  }
  
  updateData() {
    console.log('\n=== ACTUALIZAR DATOS ===\n');
    console.log('1. Actualizar desde archivos locales');
    console.log('2. Cargar datos de ejemplo');
    console.log('3. Guardar datos en archivos');
    console.log('4. Partidos de hoy (ESPN)');
    console.log('5. Volver al menu principal');
    
    this.cli.prompt('Selecciona una opcion: ', (input) => {
      const normalizedInput = input.trim().toLowerCase();
      
      switch (normalizedInput) {
        case '1': case 'archivos': case 'local':
          this.updateFromLocalFiles();
          break;
        case '2': case 'ejemplo': case 'sample':
          this.loadSampleData();
          break;
        case '3': case 'guardar': case 'save':
          this.saveData();
          break;
        case '4': case 'hoy': case 'espn': case 'partidos':
          this.showTodayMatches();
          break;
        case '5': case 'volver': case 'back':
          this.cli.showMainMenu();
          break;
        default:
          console.log('Opcion no valida.');
          this.updateData();
      }
    });
  }
  

  showTodayMatches() {
    this.cli.prompt('Filtrar por ciudad o torneo (ej. Tokio, vacio para todos): ', (filtro) => {
      const aliases = { 'tokio': 'tokyo', 'moscu': 'moscow', 'pekin': 'beijing', 'shangai': 'shanghai', 'nueva york': 'new york', 'los angeles': 'los angeles', 'paris': 'paris', 'roma': 'rome', 'madrid': 'madrid', 'viena': 'vienna', 'basilea': 'basel', 'tokyo': 'tokyo' };
      const fRaw = filtro.trim();
      const f = aliases[fRaw.toLowerCase()] || fRaw;
      console.log('\nDescargando partidos del dia desde ESPN...\n');
      const tours = ['atp', 'wta'];
      const promesas = tours.map(t =>
        fetch('https://site.api.espn.com/apis/site/v2/sports/tennis/' + t + '/scoreboard')
          .then(r => r.json())
          .then(j => {
            const partidos = [];
            (j.events || []).forEach(e => {
              const nombre = e.name || '';
              (e.groupings || []).forEach(g => {
                (g.competitions || []).forEach(c => {
                  const comps = c.competitors || [];
                  const p1 = comps[0] && comps[0].athlete ? comps[0].athlete.displayName : '?';
                  const p2 = comps[1] && comps[1].athlete ? comps[1].athlete.displayName : '?';
                  const estado = c.status && c.status.type ? c.status.type.detail : '';
                  const hora = c.date ? c.date.slice(11, 16) + ' UTC' : '';
                  const sede = (c.venue && c.venue.fullName) || '';
                  const ronda = (c.round && c.round.displayName) || '';
                  const marcador = comps.map(x => (x.linescores || []).map(l => String(l.value)).join('-')).join(' / ');
                  partidos.push({ torneo: nombre, sede, ronda, estado, hora, marcador, p1, p2 });
                });
              });
            });
            return partidos;
          })
      );
      Promise.all(promesas).then(resultados => {
        const todos = [].concat(...resultados);
        const lista = f ? todos.filter(x => (x.sede + ' ' + x.torneo).toLowerCase().includes(f.toLowerCase())) : todos;
        if (lista.length === 0) {
          console.log(f ? 'No hay partidos de hoy que coincidan con: ' + f : 'No hay partidos hoy.');
        } else {
          lista.forEach(x => {
            console.log('Torneo: ' + x.torneo);
            console.log('  ' + x.p1 + ' vs ' + x.p2);
            console.log('  Lugar: ' + x.sede + ' | Ronda: ' + x.ronda + ' | Hora: ' + x.hora + ' | ' + x.estado);
            if (x.marcador && x.marcador !== ' / ') console.log('  Sets: ' + x.marcador);
            console.log('');
          });
          console.log('Total: ' + lista.length + ' partidos');
        }
        this.cli.prompt('Presiona Enter para volver...', () => { this.updateData(); });
      }).catch(error => {
        console.log('Error al conectar con ESPN: ' + error.message);
        this.cli.prompt('Presiona Enter para volver...', () => { this.updateData(); });
      });
    });
  }

  updateFromLocalFiles() {
    console.log('Actualizando desde archivos locales...');
    
    this.cli.dataUpdater.updateFromLocalFiles().then(() => {
      console.log('Datos actualizados desde archivos locales');
      this.cli.prompt('Presiona Enter para volver...', () => {
        this.updateData();
      });
    }).catch(error => {
      console.log('Error: ' + error.message);
      this.cli.prompt('Presiona Enter para volver...', () => {
        this.updateData();
      });
    });
  }
  
  loadSampleData() {
    console.log('Cargando datos de ejemplo...');
    
    this.cli.dataUpdater.createSampleData();
    console.log('Datos de ejemplo cargados');
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.updateData();
    });
  }
  
  saveData() {
    console.log('Guardando datos...');
    
    this.cli.dataUpdater.saveToLocalFiles();
    console.log('Datos guardados en archivos locales');
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.updateData();
    });
  }
  
  showConfigMenu() {
    console.log('\n=== CONFIGURACION ===\n');
    console.log('1. Configurar usuario');
    console.log('2. Configurar actualizacion automatica');
    console.log('3. Volver al menu principal');
    
    this.cli.prompt('Selecciona una opcion: ', (input) => {
      const normalizedInput = input.trim().toLowerCase();
      
      switch (normalizedInput) {
        case '1': case 'usuario': case 'user':
          this.configureUser();
          break;
        case '2': case 'actualizacion': case 'auto':
          this.configureAutoUpdate();
          break;
        case '3': case 'volver': case 'back':
          this.cli.showMainMenu();
          break;
        default:
          console.log('Opcion no valida.');
          this.showConfigMenu();
      }
    });
  }
  
  configureUser() {
    this.cli.prompt('Introduce tu nombre de usuario: ', (username) => {
      if (!username.trim()) {
        console.log('El nombre de usuario no puede estar vacio.');
        this.configureUser();
        return;
      }
      
      this.cli.currentUser = { id: 'user_' + Date.now(), username };
      console.log('Usuario configurado: ' + username);
      
      this.cli.prompt('Presiona Enter para volver...', () => {
        this.showConfigMenu();
      });
    });
  }
  
  configureAutoUpdate() {
    console.log('\n=== ACTUALIZACION AUTOMATICA ===\n');
    console.log('1. Habilitar actualizacion automatica');
    console.log('2. Deshabilitar actualizacion automatica');
    console.log('3. Configurar intervalo (minutos)');
    console.log('4. Volver');
    
    this.cli.prompt('Selecciona una opcion: ', (input) => {
      const selection = input.trim();
      
      switch (selection) {
        case '1': case 'habilitar':
          this.cli.dataUpdater.setAutoUpdate(60);
          console.log('Actualizacion automatica habilitada (cada 60 minutos)');
          this.cli.prompt('Presiona Enter para volver...', () => {
            this.showConfigMenu();
          });
          break;
          
        case '2': case 'deshabilitar':
          this.cli.dataUpdater.stopAutoUpdate();
          console.log('Actualizacion automatica deshabilitada');
          this.cli.prompt('Presiona Enter para volver...', () => {
            this.showConfigMenu();
          });
          break;
          
        case '3': case 'intervalo':
          this.cli.prompt('Introduce el intervalo en minutos: ', (minutes) => {
            const interval = parseInt(minutes);
            
            if (isNaN(interval) || interval <= 0) {
              console.log('Intervalo no valido.');
              this.configureAutoUpdate();
              return;
            }
            
            this.cli.dataUpdater.setAutoUpdate(interval);
            console.log('Actualizacion automatica configurada cada ' + interval + ' minutos');
            
            this.cli.prompt('Presiona Enter para volver...', () => {
              this.showConfigMenu();
            });
          });
          break;
          
        case '4': case 'volver':
          this.showConfigMenu();
          break;
          
        default:
          console.log('Opcion no valida.');
          this.configureAutoUpdate();
      }
    });
  }
  
  showHelp() {
    console.log('\n=== AYUDA ===\n');
    console.log('COMANDOS PRINCIPALES:');
    console.log('  menu      - Mostrar menu principal');
    console.log('  salir     - Salir de la aplicacion');
    console.log('  ayuda     - Mostrar esta ayuda');
    console.log('  jugadores - Gestionar jugadores');
    console.log('  partidos - Gestionar partidos');
    console.log('  analizar  - Analizar enfrentamientos');
    console.log('  apuestas - Gestionar apuestas');
    console.log('  estadisticas - Ver estadisticas');
    console.log('  actualizar - Actualizar datos');
    console.log('  configurar - Configurar ajustes');
    
    console.log('\nATAJOS:');
    console.log('  - Puedes usar numeros o nombres de comandos');
    console.log('  - Usa "volver" o "back" para retroceder');
    console.log('  - Usa "salir" o "exit" para salir');
    
    this.cli.prompt('Presiona Enter para volver...', () => {
      this.cli.showMainMenu();
    });
  }
  
  exit() {
    console.log('\nEstas seguro de que quieres salir? (s/n): ');
    
    this.cli.prompt('', (input) => {
      if (input.toLowerCase() === 's' || input.toLowerCase() === 'si' || input.toLowerCase() === 'yes') {
        console.log('\nHasta luego!');
        this.cli.rl.close();
        process.exit(0);
      } else {
        this.cli.showMainMenu();
      }
    });
  }
}

module.exports = TennisBotCLI_Part4;
