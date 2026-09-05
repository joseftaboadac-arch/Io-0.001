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
    console.log('4. Volver al menu principal');
    
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
        case '4': case 'volver': case 'back':
          this.cli.showMainMenu();
          break;
        default:
          console.log('Opcion no valida.');
          this.updateData();
      }
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
