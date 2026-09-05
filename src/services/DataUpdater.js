const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { SURFACES, TOURNAMENTS, HARD_COURT_TOURNAMENTS } = require('../config/constants');

/**
 * Servicio de actualización de datos
 * Permite actualizar jugadores, partidos y estadísticas desde diferentes fuentes
 */
class DataUpdater {
  constructor(analyzer, betManager) {
    this.analyzer = analyzer;
    this.betManager = betManager;
    this.dataSources = {
      local: {
        enabled: true,
        path: path.join(__dirname, '../../data')
      },
      api: {
        enabled: false,
        endpoints: {
          atp: 'https://api.atptour.com/v1',
          itf: 'https://api.itftennis.com/v1',
          odds: 'https://api.oddsapi.com/v1'
        },
        apiKeys: {
          atp: null,
          itf: null,
          odds: null
        }
      }
    };
    this.updateInterval = null;
    this.lastUpdate = null;
  }
  
  /**
   * Configura las API keys
   */
  configureApiKeys(keys) {
    this.dataSources.api.apiKeys = { ...this.dataSources.api.apiKeys, ...keys };
    this.dataSources.api.enabled = Object.values(this.dataSources.api.apiKeys).some(key => key !== null);
  }
  
  /**
   * Configura el intervalo de actualización automática
   */
  setAutoUpdate(intervalMinutes = 60) {
    // Detener el intervalo actual si existe
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Iniciar nuevo intervalo
    this.updateInterval = setInterval(() => {
      this.updateAll();
    }, intervalMinutes * 60000);
    
    console.log(`Actualización automática configurada cada ${intervalMinutes} minutos`);
  }
  
  /**
   * Detiene la actualización automática
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('Actualización automática detenida');
    }
  }
  
  /**
   * Actualiza todos los datos
   */
  async updateAll() {
    console.log('Iniciando actualización de todos los datos...');
    
    try {
      // Actualizar desde fuentes locales
      await this.updateFromLocalFiles();
      
      // Actualizar desde APIs si están habilitadas
      if (this.dataSources.api.enabled) {
        await this.updateFromApis();
      }
      
      this.lastUpdate = new Date().toISOString();
      console.log('Actualización completada con éxito');
      return { success: true, timestamp: this.lastUpdate };
    } catch (error) {
      console.error('Error durante la actualización:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Actualiza desde archivos locales
   */
  async updateFromLocalFiles() {
    if (!this.dataSources.local.enabled) return;
    
    const dataDir = this.dataSources.local.path;
    
    try {
      // Verificar si el directorio existe
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        return;
      }
      
      // Leer archivos de jugadores
      const playersFile = path.join(dataDir, 'players.json');
      if (fs.existsSync(playersFile)) {
        const playersData = JSON.parse(fs.readFileSync(playersFile, 'utf8'));
        this.importPlayers(playersData);
      }
      
      // Leer archivos de partidos
      const matchesFile = path.join(dataDir, 'matches.json');
      if (fs.existsSync(matchesFile)) {
        const matchesData = JSON.parse(fs.readFileSync(matchesFile, 'utf8'));
        this.importMatches(matchesData);
      }
      
      // Leer archivos de apuestas
      const betsFile = path.join(dataDir, 'bets.json');
      if (fs.existsSync(betsFile)) {
        const betsData = JSON.parse(fs.readFileSync(betsFile, 'utf8'));
        this.betManager.importData(betsData);
      }
      
      console.log('Datos cargados desde archivos locales');
    } catch (error) {
      console.error('Error al cargar datos desde archivos locales:', error.message);
    }
  }
  
  /**
   * Actualiza desde APIs externas
   */
  async updateFromApis() {
    try {
      // Actualizar desde ATP Tour API
      if (this.dataSources.api.apiKeys.atp) {
        await this.updateFromAtpApi();
      }
      
      // Actualizar desde ITF API
      if (this.dataSources.api.apiKeys.itf) {
        await this.updateFromItfApi();
      }
      
      // Actualizar odds
      if (this.dataSources.api.apiKeys.odds) {
        await this.updateOddsFromApi();
      }
      
      console.log('Datos actualizados desde APIs externas');
    } catch (error) {
      console.error('Error al actualizar desde APIs:', error.message);
    }
  }
  
  /**
   * Actualiza desde ATP Tour API
   */
  async updateFromAtpApi() {
    const apiKey = this.dataSources.api.apiKeys.atp;
    const baseUrl = this.dataSources.api.endpoints.atp;
    
    try {
      // Obtener ranking ATP
      const rankingResponse = await axios.get(`${baseUrl}/rankings`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (rankingResponse.data && rankingResponse.data.players) {
        this.importPlayers(rankingResponse.data.players);
      }
      
      // Obtener partidos recientes
      const matchesResponse = await axios.get(`${baseUrl}/matches`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        params: { surface: SURFACES.HARD, limit: 100 }
      });
      
      if (matchesResponse.data && matchesResponse.data.matches) {
        this.importMatches(matchesResponse.data.matches);
      }
    } catch (error) {
      console.error('Error al actualizar desde ATP API:', error.message);
    }
  }
  
  /**
   * Actualiza desde ITF API
   */
  async updateFromItfApi() {
    const apiKey = this.dataSources.api.apiKeys.itf;
    const baseUrl = this.dataSources.api.endpoints.itf;
    
    try {
      // Obtener torneos recientes
      const tournamentsResponse = await axios.get(`${baseUrl}/tournaments`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        params: { surface: SURFACES.HARD, year: new Date().getFullYear() }
      });
      
      if (tournamentsResponse.data && tournamentsResponse.data.tournaments) {
        // Procesar torneos y partidos
        for (const tournament of tournamentsResponse.data.tournaments) {
          if (HARD_COURT_TOURNAMENTS.includes(tournament.name)) {
            const matchesResponse = await axios.get(`${baseUrl}/tournaments/${tournament.id}/matches`, {
              headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            
            if (matchesResponse.data && matchesResponse.data.matches) {
              this.importMatches(matchesResponse.data.matches);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al actualizar desde ITF API:', error.message);
    }
  }
  
  /**
   * Actualiza odds desde API
   */
  async updateOddsFromApi() {
    const apiKey = this.dataSources.api.apiKeys.odds;
    const baseUrl = this.dataSources.api.endpoints.odds;
    
    try {
      // Obtener odds para partidos de tenis
      const oddsResponse = await axios.get(`${baseUrl}/tennis/odds`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        params: { sport: 'tennis', market: 'match_winner' }
      });
      
      if (oddsResponse.data && oddsResponse.data.odds) {
        this.updateMatchOdds(oddsResponse.data.odds);
      }
    } catch (error) {
      console.error('Error al actualizar odds:', error.message);
    }
  }
  
  /**
   * Importa jugadores desde datos
   */
  importPlayers(playersData) {
    if (!Array.isArray(playersData)) return;
    
    let importedCount = 0;
    
    playersData.forEach(playerData => {
      // Verificar si el jugador ya existe
      const existingPlayer = this.analyzer.getAllPlayers().find(p => 
        p.id === playerData.id || 
        p.name.toLowerCase() === playerData.name.toLowerCase()
      );
      
      if (!existingPlayer) {
        this.analyzer.addPlayer(playerData);
        importedCount++;
      } else {
        // Actualizar jugador existente
        existingPlayer.updateStats(playerData.stats || {});
        if (playerData.surfaceStats) {
          Object.keys(playerData.surfaceStats).forEach(surface => {
            existingPlayer.updateSurfaceStats(surface, playerData.surfaceStats[surface]);
          });
        }
      }
    });
    
    console.log(`Importados ${importedCount} nuevos jugadores`);
  }
  
  /**
   * Importa partidos desde datos
   */
  importMatches(matchesData) {
    if (!Array.isArray(matchesData)) return;
    
    let importedCount = 0;
    let updatedCount = 0;
    
    matchesData.forEach(matchData => {
      // Verificar si el partido ya existe
      const existingMatch = this.analyzer.getAllMatches().find(m => m.id === matchData.id);
      
      if (!existingMatch) {
        // Añadir nuevo partido
        const match = this.analyzer.addMatch(matchData);
        importedCount++;
        
        // Asociar jugadores si existen
        if (matchData.player1Id) {
          const player1 = this.analyzer.getPlayer(matchData.player1Id);
          const player2 = this.analyzer.getPlayer(matchData.player2Id);
          if (player1 && player2) {
            match.setPlayers(player1, player2);
          }
        }
      } else {
        // Actualizar partido existente
        if (matchData.status) {
          existingMatch.status = matchData.status;
        }
        if (matchData.result) {
          existingMatch.setResult(matchData.result);
        }
        if (matchData.score) {
          existingMatch.setScore(matchData.score);
        }
        if (matchData.stats) {
          existingMatch.updateStats('player1', matchData.stats.player1 || {});
          existingMatch.updateStats('player2', matchData.stats.player2 || {});
        }
        if (matchData.odds) {
          existingMatch.updateOdds('match_winner', matchData.odds);
        }
        updatedCount++;
      }
    });
    
    console.log(`Importados ${importedCount} nuevos partidos, actualizados ${updatedCount}`);
  }
  
  /**
   * Actualiza las odds de los partidos
   */
  updateMatchOdds(oddsData) {
    if (!Array.isArray(oddsData)) return;
    
    let updatedCount = 0;
    
    oddsData.forEach(odds => {
      const match = this.analyzer.getAllMatches().find(m => m.id === odds.matchId);
      
      if (match) {
        // Actualizar odds del partido
        match.updateOdds(odds.betType, odds);
        updatedCount++;
      }
    });
    
    console.log(`Actualizadas odds de ${updatedCount} partidos`);
  }
  
  /**
   * Guarda todos los datos en archivos locales
   */
  saveToLocalFiles() {
    if (!this.dataSources.local.enabled) return;
    
    const dataDir = this.dataSources.local.path;
    
    try {
      // Crear directorio si no existe
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Guardar jugadores
      const playersData = this.analyzer.exportData().players;
      fs.writeFileSync(path.join(dataDir, 'players.json'), JSON.stringify(playersData, null, 2));
      
      // Guardar partidos
      const matchesData = this.analyzer.exportData().matches;
      fs.writeFileSync(path.join(dataDir, 'matches.json'), JSON.stringify(matchesData, null, 2));
      
      // Guardar apuestas
      const betsData = this.betManager.exportData();
      fs.writeFileSync(path.join(dataDir, 'bets.json'), JSON.stringify(betsData, null, 2));
      
      console.log('Datos guardados en archivos locales');
    } catch (error) {
      console.error('Error al guardar datos en archivos locales:', error.message);
    }
  }
  
  /**
   * Sincroniza datos con un archivo específico
   */
  syncWithFile(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.players) {
        this.importPlayers(data.players);
      }
      
      if (data.matches) {
        this.importMatches(data.matches);
      }
      
      if (data.bets) {
        this.betManager.importData({ bets: data.bets });
      }
      
      console.log(`Datos sincronizados desde ${filePath}`);
    } catch (error) {
      console.error(`Error al sincronizar desde ${filePath}:`, error.message);
    }
  }
  
  /**
   * Exporta todos los datos a un archivo
   */
  exportToFile(filePath) {
    try {
      const data = {
        players: this.analyzer.exportData().players,
        matches: this.analyzer.exportData().matches,
        bets: this.betManager.exportData().bets,
        betSlips: this.betManager.exportData().betSlips,
        statistics: this.betManager.getStatistics(),
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Datos exportados a ${filePath}`);
    } catch (error) {
      console.error(`Error al exportar a ${filePath}:`, error.message);
    }
  }
  
  /**
   * Actualiza manualmente un jugador
   */
  updatePlayer(playerId, updates) {
    const player = this.analyzer.getPlayer(playerId);
    if (!player) return false;
    
    if (updates.stats) {
      player.updateStats(updates.stats);
    }
    
    if (updates.surfaceStats) {
      Object.keys(updates.surfaceStats).forEach(surface => {
        player.updateSurfaceStats(surface, updates.surfaceStats[surface]);
      });
    }
    
    if (updates.matchHistory) {
      updates.matchHistory.forEach(matchData => {
        player.addMatch(matchData);
      });
    }
    
    if (updates.injuries) {
      updates.injuries.forEach(injury => {
        player.addInjury(injury);
      });
    }
    
    console.log(`Jugador ${player.getFullName()} actualizado`);
    return true;
  }
  
  /**
   * Actualiza manualmente un partido
   */
  updateMatch(matchId, updates) {
    const match = this.analyzer.getMatch(matchId);
    if (!match) return false;
    
    if (updates.status) {
      match.status = updates.status;
    }
    
    if (updates.result) {
      match.setResult(updates.result);
    }
    
    if (updates.score) {
      match.setScore(updates.score);
    }
    
    if (updates.stats) {
      if (updates.stats.player1) {
        match.updateStats('player1', updates.stats.player1);
      }
      if (updates.stats.player2) {
        match.updateStats('player2', updates.stats.player2);
      }
    }
    
    if (updates.odds) {
      Object.keys(updates.odds).forEach(betType => {
        match.updateOdds(betType, updates.odds[betType]);
      });
    }
    
    console.log(`Partido ${match.id} actualizado`);
    return true;
  }
  
  /**
   * Actualiza el resultado de un partido y resuelve las apuestas relacionadas
   */
  updateMatchResultAndSettleBets(matchId, result) {
    const match = this.analyzer.getMatch(matchId);
    if (!match) return false;
    
    // Actualizar resultado del partido
    match.setResult(result);
    match.status = 'completed';
    
    // Obtener apuestas relacionadas
    const bets = this.betManager.getBetsByMatch(matchId);
    
    // Resolver cada apuesta
    bets.forEach(bet => {
      let betResult = 'lost'; // Por defecto, asumir perdida
      
      // Determinar el resultado basado en el tipo de apuesta
      switch (bet.betType) {
        case 'match_winner':
          if (result.winner === bet.betSelection) {
            betResult = 'won';
          }
          break;
          
        case 'first_set_winner':
          // Necesitaríamos el resultado del primer set
          if (match.score && match.score.sets && match.score.sets[0]) {
            const firstSet = match.score.sets[0];
            const winner = firstSet.gamesP1 > firstSet.gamesP2 ? 'player1' : 'player2';
            if (winner === bet.betSelection) {
              betResult = 'won';
            }
          }
          break;
          
        case 'total_sets':
          const totalSets = match.getTotalSets();
          if (bet.betSelection.direction === 'over' && totalSets > bet.betSelection.line) {
            betResult = 'won';
          } else if (bet.betSelection.direction === 'under' && totalSets < bet.betSelection.line) {
            betResult = 'won';
          }
          break;
          
        case 'total_games':
          const totalGames = match.getTotalGames();
          if (bet.betSelection.direction === 'over' && totalGames > bet.betSelection.line) {
            betResult = 'won';
          } else if (bet.betSelection.direction === 'under' && totalGames < bet.betSelection.line) {
            betResult = 'won';
          }
          break;
      }
      
      // Resolver la apuesta
      this.betManager.settleBet(bet.id, betResult);
    });
    
    console.log(`Partido ${matchId} actualizado y ${bets.length} apuestas resueltas`);
    return true;
  }
  
  /**
   * Obtiene el estado de actualización
   */
  getUpdateStatus() {
    return {
      lastUpdate: this.lastUpdate,
      autoUpdateEnabled: !!this.updateInterval,
      dataSources: {
        local: this.dataSources.local.enabled,
        api: this.dataSources.api.enabled
      },
      statistics: {
        players: this.analyzer.getAllPlayers().length,
        matches: this.analyzer.getAllMatches().length,
        bets: this.betManager.getAllBets().length
      }
    };
  }
  
  /**
   * Crea datos de ejemplo para demostración
   */
  createSampleData() {
    // Cargar datos de ejemplo en el analizador
    const analyzerSample = this.analyzer.loadSampleData();
    
    // Cargar apuestas de ejemplo en el gestor
    const betManagerSample = this.betManager.createSampleBets();
    
    // Guardar en archivos locales
    this.saveToLocalFiles();
    
    return {
      analyzer: analyzerSample,
      betManager: betManagerSample
    };
  }
}

module.exports = DataUpdater;
