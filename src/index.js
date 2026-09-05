// Punto de entrada principal del Tennis Bot
const TennisAnalyzer = require('./services/TennisAnalyzer');
const BetManager = require('./services/BetManager');
const DataUpdater = require('./services/DataUpdater');
const TennisBotCLI = require('./cli/TennisBotCLI');
const TennisBotCLI_Part2 = require('./cli/TennisBotCLI_part2');
const TennisBotCLI_Part3 = require('./cli/TennisBotCLI_part3');
const TennisBotCLI_Part4 = require('./cli/TennisBotCLI_part4');

// Crear instancias de los servicios
const analyzer = new TennisAnalyzer();
const betManager = new BetManager();
const dataUpdater = new DataUpdater(analyzer, betManager);

// Crear la CLI principal
const cli = new TennisBotCLI(analyzer, betManager, dataUpdater);

// Extender la CLI con las partes adicionales
const cliPart2 = new TennisBotCLI_Part2(cli);
const cliPart3 = new TennisBotCLI_Part3(cli);
const cliPart4 = new TennisBotCLI_Part4(cli);

// Añadir métodos de las partes a la CLI principal
cli.listAllMatches = cliPart2.listAllMatches.bind(cliPart2);
cli.listHardCourtMatches = cliPart2.listHardCourtMatches.bind(cliPart2);
cli.listUpcomingMatches = cliPart2.listUpcomingMatches.bind(cliPart2);
cli.listCompletedMatches = cliPart2.listCompletedMatches.bind(cliPart2);
cli.searchMatchesByTournament = cliPart2.searchMatchesByTournament.bind(cliPart2);
cli.showMatchDetails = cliPart2.showMatchDetails.bind(cliPart2);
cli.analyzeMatch = cliPart2.analyzeMatch.bind(cliPart2);
cli.listBetsForMatch = cliPart2.listBetsForMatch.bind(cliPart2);
cli.showAnalysisMenu = cliPart2.showAnalysisMenu.bind(cliPart2);
cli.selectMatchForAnalysis = cliPart2.selectMatchForAnalysis.bind(cliPart2);
cli.comparePlayers = cliPart2.comparePlayers.bind(cliPart2);
cli.showRecommendations = cliPart2.showRecommendations.bind(cliPart2);
cli.analyzeBetValue = cliPart2.analyzeBetValue.bind(cliPart2);

cli.createBetForMatch = cliPart3.createBetForMatch.bind(cliPart3);
cli.createBetWithType = cliPart3.createBetWithType.bind(cliPart3);
cli.createBet = cliPart3.createBet.bind(cliPart3);
cli.getBetTypeName = cliPart3.getBetTypeName.bind(cliPart3);
cli.showBetsMenu = cliPart3.showBetsMenu.bind(cliPart3);
cli.createNewBet = cliPart3.createNewBet.bind(cliPart3);
cli.listMyBets = cliPart3.listMyBets.bind(cliPart3);
cli.listPendingBets = cliPart3.listPendingBets.bind(cliPart3);
cli.listWonBets = cliPart3.listWonBets.bind(cliPart3);
cli.listLostBets = cliPart3.listLostBets.bind(cliPart3);
cli.showBetStatistics = cliPart3.showBetStatistics.bind(cliPart3);

cli.showStatistics = cliPart4.showStatistics.bind(cliPart4);
cli.updateData = cliPart4.updateData.bind(cliPart4);
cli.updateFromLocalFiles = cliPart4.updateFromLocalFiles.bind(cliPart4);
cli.loadSampleData = cliPart4.loadSampleData.bind(cliPart4);
cli.saveData = cliPart4.saveData.bind(cliPart4);
cli.showConfigMenu = cliPart4.showConfigMenu.bind(cliPart4);
cli.configureUser = cliPart4.configureUser.bind(cliPart4);
cli.configureAutoUpdate = cliPart4.configureAutoUpdate.bind(cliPart4);
cli.showHelp = cliPart4.showHelp.bind(cliPart4);
cli.exit = cliPart4.exit.bind(cliPart4);

// Iniciar el bot
console.log('Iniciando Tennis Bot - Especialista en Piso Duro...\n');

// Cargar datos de ejemplo al inicio (opcional)
// dataUpdater.createSampleData();

// Iniciar la interfaz CLI
cli.start();
