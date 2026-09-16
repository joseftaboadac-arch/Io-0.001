// Punto de entrada del Cerebro Robot de Futbol
const FootballAnalyzer = require('./services/FootballAnalyzer');
const BetManager = require('./services/BetManager');
const FootballBotCLI = require('./cli/FootballBotCLI');

const analyzer = new FootballAnalyzer();
const betManager = new BetManager();
const cli = new FootballBotCLI(analyzer, betManager);

console.log('Iniciando Cerebro Robot de Futbol...\n');
cli.start();
