const test = require('node:test');
const assert = require('node:assert');
const TennisAnalyzer = require('../src/services/TennisAnalyzer');
const { SURFACES, BET_TYPES } = require('../src/config/constants');

function createAnalyzerWithPlayers() {
  const analyzer = new TennisAnalyzer();
  
  const strong = analyzer.addPlayer({
    id: 'p_strong',
    name: 'Jugador Fuerte',
    country: 'España',
    ranking: 1
  });
  strong.updateSurfaceStats(SURFACES.HARD, {
    matchesPlayed: 50,
    matchesWon: 40,
    winRate: 80
  });
  strong.updateStats({ winPercentage: 75, matchesPlayed: 80, matchesWon: 60 });
  
  const weak = analyzer.addPlayer({
    id: 'p_weak',
    name: 'Jugador Debil',
    country: 'Francia',
    ranking: 50
  });
  weak.updateSurfaceStats(SURFACES.HARD, {
    matchesPlayed: 50,
    matchesWon: 20,
    winRate: 40
  });
  weak.updateStats({ winPercentage: 45, matchesPlayed: 80, matchesWon: 36 });
  
  return { analyzer, strong, weak };
}

function assertValidProbabilityDistribution(p1, p2) {
  assert.strictEqual(typeof p1, 'number', 'la probabilidad debe ser un numero');
  assert.ok(p1 > 0 && p1 < 100, 'la probabilidad debe estar entre 0 y 100');
  assert.ok(Math.abs(p1 + p2 - 100) < 0.01, `las probabilidades deben sumar 100 (suma: ${p1 + p2})`);
}

test('predictMatchOutcome devuelve probabilidades numericas que suman 100', () => {
  const { analyzer, strong, weak } = createAnalyzerWithPlayers();
  const prediction = analyzer.predictMatchOutcome(strong, weak);
  
  assertValidProbabilityDistribution(
    prediction.matchWinner.player1Probability,
    prediction.matchWinner.player2Probability
  );
  assertValidProbabilityDistribution(
    prediction.firstSetWinner.player1Probability,
    prediction.firstSetWinner.player2Probability
  );
});

test('el jugador claramente superior tiene mayor probabilidad de ganar', () => {
  const { analyzer, strong, weak } = createAnalyzerWithPlayers();
  const prediction = analyzer.predictMatchOutcome(strong, weak);
  
  assert.ok(prediction.matchWinner.player1Probability > prediction.matchWinner.player2Probability);
  assert.strictEqual(prediction.matchWinner.favorite, 'Jugador Fuerte');
  assert.strictEqual(prediction.matchWinner.underdog, 'Jugador Debil');
});

test('jugadores identicos producen un 50/50 exacto', () => {
  const analyzer = new TennisAnalyzer();
  
  const player1 = analyzer.addPlayer({ id: 'a', name: 'Jugador A', ranking: 10 });
  const player2 = analyzer.addPlayer({ id: 'b', name: 'Jugador B', ranking: 10 });
  
  [player1, player2].forEach(player => {
    player.updateSurfaceStats(SURFACES.HARD, { matchesPlayed: 20, matchesWon: 12, winRate: 60 });
    player.updateStats({ winPercentage: 60, matchesPlayed: 20, matchesWon: 12 });
  });
  
  const prediction = analyzer.predictMatchOutcome(player1, player2);
  
  assert.strictEqual(prediction.matchWinner.player1Probability, 50);
  assert.strictEqual(prediction.matchWinner.player2Probability, 50);
});

test('las probabilidades de sets suman 100 y la prediccion es coherente', () => {
  const { analyzer, strong, weak } = createAnalyzerWithPlayers();
  const sets = analyzer.predictTotalSets(strong, weak);
  
  assert.strictEqual(typeof sets.twoSetsProbability, 'number');
  assert.ok(Math.abs(sets.twoSetsProbability + sets.threeSetsProbability - 100) < 0.01);
  assert.ok(['2 sets', '3 sets'].includes(sets.prediction));
  
  assert.strictEqual(sets.prediction, sets.twoSetsProbability >= 50 ? '2 sets' : '3 sets');
});

test('predictTotalGames devuelve probabilidades numericas coherentes con la linea', () => {
  const { analyzer, strong, weak } = createAnalyzerWithPlayers();
  const games = analyzer.predictTotalGames(strong, weak);
  
  assert.strictEqual(typeof games.predictedGames, 'number');
  assert.strictEqual(typeof games.overProbability, 'number');
  assert.ok(Math.abs(games.overProbability + games.underProbability - 100) < 0.01);
  
  // La linea debe estar cerca de los juegos predichos: ~50/50
  assert.ok(Math.abs(games.overProbability - 50) < 15, 'en la linea propia la probabilidad debe rondar el 50%');
});

test('calculateGamesOverProbability crece al bajar la linea', () => {
  const { analyzer } = createAnalyzerWithPlayers();
  
  const over22 = analyzer.calculateGamesOverProbability(22.5, 21.5);
  const over23 = analyzer.calculateGamesOverProbability(22.5, 23.5);
  
  assert.ok(over22 > 0.5, 'superar una linea inferior debe ser mas probable que 50%');
  assert.ok(over23 < 0.5, 'superar una linea superior debe ser menos probable que 50%');
  assert.ok(over22 > over23);
});

test('predictTiebreak devuelve una probabilidad numerica acotada', () => {
  const { analyzer, strong, weak } = createAnalyzerWithPlayers();
  const tiebreak = analyzer.predictTiebreak(strong, weak);
  
  assert.strictEqual(typeof tiebreak.probability, 'number');
  assert.ok(tiebreak.probability >= 5 && tiebreak.probability <= 85);
});

test('analyzeMatchup genera recomendaciones con probabilidades del nuevo motor', () => {
  const { analyzer, strong, weak } = createAnalyzerWithPlayers();
  const analysis = analyzer.analyzeMatchup('p_strong', 'p_weak');
  
  assert.ok(analysis.predictions.matchWinner.player1Probability > 65);
  assert.ok(analysis.recommendations.length > 0);
  assert.ok(analysis.recommendations.some(r => r.betType === BET_TYPES.MATCH_WINNER));
});

test('analyzeBetValue detecta valor positivo y negativo', () => {
  const { analyzer, strong, weak } = createAnalyzerWithPlayers();
  
  const match = analyzer.addMatch({
    id: 'm1',
    tournament: 'Test Open',
    surface: SURFACES.HARD,
    status: 'upcoming',
    player1Id: 'p_strong',
    player2Id: 'p_weak'
  });
  match.setPlayers(strong, weak);
  
  const favorable = analyzer.analyzeBetValue(match, BET_TYPES.MATCH_WINNER, 'player1', 3.0);
  assert.strictEqual(typeof favorable.predictedProbability, 'number');
  assert.ok(favorable.value > 0, 'odds muy altas para el favorito deben dar valor positivo');
  assert.strictEqual(favorable.recommendation, 'Recomendada');
  
  const unfavorable = analyzer.analyzeBetValue(match, BET_TYPES.MATCH_WINNER, 'player1', 1.01);
  assert.ok(unfavorable.value < 0, 'odds muy bajas deben dar valor negativo');
  assert.strictEqual(unfavorable.recommendation, 'No recomendada');
});

test('analyzeBetValue para total games usa la distribucion y suma coherente', () => {
  const { analyzer, strong, weak } = createAnalyzerWithPlayers();
  
  const match = analyzer.addMatch({
    id: 'm2',
    tournament: 'Test Open',
    surface: SURFACES.HARD,
    status: 'upcoming',
    player1Id: 'p_strong',
    player2Id: 'p_weak'
  });
  match.setPlayers(strong, weak);
  
  const overLowLine = analyzer.analyzeBetValue(match, BET_TYPES.TOTAL_GAMES, { line: 18.5, direction: 'over' }, 1.9);
  const underHighLine = analyzer.analyzeBetValue(match, BET_TYPES.TOTAL_GAMES, { line: 26.5, direction: 'under' }, 1.9);
  
  assert.ok(overLowLine.predictedProbability > 70, 'over en una linea muy baja debe tener alta probabilidad');
  assert.ok(underHighLine.predictedProbability > 70, 'under en una linea muy alta debe tener alta probabilidad');
});

test('convertToDecimal maneja los formatos de cuota principales', () => {
  const { analyzer } = createAnalyzerWithPlayers();
  
  assert.strictEqual(analyzer.convertToDecimal(2.5), 2.5);
  assert.strictEqual(analyzer.convertToDecimal('3/2'), 2.5);
  assert.strictEqual(analyzer.convertToDecimal('+150'), 2.5);
  assert.strictEqual(analyzer.convertToDecimal('-200'), 1.5);
});
