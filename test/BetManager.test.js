const test = require('node:test');
const assert = require('node:assert');
const BetManager = require('../src/services/BetManager');
const { BET_TYPES, ODDS_FORMATS } = require('../src/config/constants');

function createBetData(overrides = {}) {
  return {
    matchId: 'match_1',
    betType: BET_TYPES.MATCH_WINNER,
    betSelection: 'player1',
    odds: 2.0,
    oddsFormat: ODDS_FORMATS.DECIMAL,
    stake: 50,
    userId: 'user_1',
    username: 'TestUser',
    ...overrides
  };
}

test('createBet acepta stakes validos y registra la apuesta', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  const bet = manager.createBet(createBetData());
  
  assert.ok(bet.id);
  assert.strictEqual(manager.getAllBets().length, 1);
  assert.strictEqual(bet.potentialPayout, 100);
});

test('createBet rechaza stakes que exceden el limite por apuesta', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  
  assert.throws(
    () => manager.createBet(createBetData({ stake: 500 })),
    /excede/i
  );
  assert.strictEqual(manager.getAllBets().length, 0);
});

test('createBet rechaza stakes no positivos', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  
  assert.throws(
    () => manager.createBet(createBetData({ stake: 0 })),
    /positivo/i
  );
  assert.throws(
    () => manager.createBet(createBetData({ stake: -10 })),
    /positivo/i
  );
});

test('createBet rechaza stakes que exceden el bankroll disponible con apuestas pendientes', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  manager.createBet(createBetData({ stake: 100, matchId: 'match_a' }));
  
  // 100 apostados pendientes de 1000: disponible 900
  assert.throws(
    () => manager.createBet(createBetData({ stake: 950, matchId: 'match_b' })),
    /bankroll disponible/i
  );
});

test('getStatistics calcula totales derivados de las apuestas, no incrementales', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  
  const won = manager.createBet(createBetData({ stake: 100 }));
  const lost = manager.createBet(createBetData({ stake: 50, matchId: 'match_2', betSelection: 'player2' }));
  manager.createBet(createBetData({ stake: 75, matchId: 'match_3' }));
  
  manager.markBetAsWon(won.id);
  manager.markBetAsLost(lost.id);
  
  const stats = manager.getStatistics();
  
  assert.strictEqual(stats.totalBets, 3);
  assert.strictEqual(stats.wonBets, 1);
  assert.strictEqual(stats.lostBets, 1);
  assert.strictEqual(stats.pendingBets, 1);
  assert.strictEqual(stats.totalStaked, 225);
  // ganada a 2.0: beneficio neto +100
  assert.strictEqual(stats.totalWon, 100);
  // perdida: -50
  assert.strictEqual(stats.totalLost, 50);
  assert.strictEqual(stats.netProfit, 50);
  assert.strictEqual(stats.roi, '22.22%');
  assert.strictEqual(stats.winRate, '50.00%');
});

test('el bankroll refleja el resultado de las apuestas resueltas', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  
  const won = manager.createBet(createBetData({ stake: 100 }));
  const lost = manager.createBet(createBetData({ stake: 50, matchId: 'match_2', betSelection: 'player2' }));
  manager.createBet(createBetData({ stake: 75, matchId: 'match_3' }));
  
  manager.markBetAsWon(won.id);
  manager.markBetAsLost(lost.id);
  
  const stats = manager.getStatistics();
  
  assert.strictEqual(stats.bankroll.initial, 1000);
  assert.strictEqual(stats.bankroll.current, 1050);
  assert.strictEqual(stats.bankroll.pendingExposure, 75);
  assert.strictEqual(stats.bankroll.available, 975);
});

test('deleteBet actualiza las estadisticas derivadas sin estado inconsistente', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  
  const won = manager.createBet(createBetData({ stake: 100 }));
  manager.markBetAsWon(won.id);
  
  let stats = manager.getStatistics();
  assert.strictEqual(stats.netProfit, 100);
  
  manager.deleteBet(won.id);
  
  stats = manager.getStatistics();
  assert.strictEqual(stats.totalBets, 0);
  assert.strictEqual(stats.netProfit, 0);
  assert.strictEqual(stats.bankroll.current, 1000);
});

test('updateBet recalcula el payout y las estadisticas siguen coherentes', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  
  const bet = manager.createBet(createBetData({ stake: 100 }));
  manager.updateBet(bet.id, { odds: 3.0 });
  
  assert.strictEqual(bet.potentialPayout, 300);
  
  const stats = manager.getStatistics();
  assert.strictEqual(stats.totalStaked, 100);
});

test('settleBet resuelve la apuesta y las apuestas devueltas no afectan al beneficio', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  
  const returned = manager.createBet(createBetData({ stake: 100 }));
  manager.markBetAsReturned(returned.id);
  
  const stats = manager.getStatistics();
  
  assert.strictEqual(stats.returnedBets, 1);
  assert.strictEqual(stats.totalReturned, 100);
  assert.strictEqual(stats.netProfit, 0);
  assert.strictEqual(stats.bankroll.current, 1000);
});

test('calculateKellyStake dimensiona el stake con el criterio de Kelly fraccional', () => {
  const manager = new BetManager({ initialBankroll: 1000, kellyFraction: 0.25, maxStakePercent: 10 });
  
  // Sin ventaja: stake 0
  assert.strictEqual(manager.calculateKellyStake(0.5, 2.0), 0);
  assert.strictEqual(manager.calculateKellyStake(0.45, 1.9), 0);
  
  // p=0.55, odds=2.0: full kelly = (0.55*2-1)/1 = 0.10; fraccional 0.25 -> 25 (2.5% de 1000)
  assert.strictEqual(manager.calculateKellyStake(0.55, 2.0), 25);
  
  // Con gran ventaja el tope del 10% del bankroll limita el stake
  const capped = manager.calculateKellyStake(0.9, 5.0);
  assert.strictEqual(capped, 100);
});

test('calculateKellyStake usa el bankroll actual, no el inicial', () => {
  const manager = new BetManager({ initialBankroll: 1000, kellyFraction: 0.5, maxStakePercent: 20 });
  
  const won = manager.createBet(createBetData({ stake: 100 }));
  manager.markBetAsWon(won.id);
  
  // bankroll actual 1100; p=0.6 odds=2.0: full kelly 0.2, fraccional 0.5 -> 10% de 1100 = 110
  assert.strictEqual(manager.calculateKellyStake(0.6, 2.0), 110);
});

test('configureBankroll permite ajustar los parametros de gestion', () => {
  const manager = new BetManager();
  
  manager.configureBankroll({ initialBankroll: 500, maxStakePercent: 5, kellyFraction: 0.1 });
  
  assert.strictEqual(manager.bankroll.initialBankroll, 500);
  assert.strictEqual(manager.bankroll.maxStakePercent, 5);
  assert.strictEqual(manager.bankroll.kellyFraction, 0.1);
  
  assert.throws(
    () => manager.createBet(createBetData({ stake: 50 })),
    /excede/i
  );
});

test('exportData e importData conservan las estadisticas derivadas', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  
  const won = manager.createBet(createBetData({ stake: 100 }));
  manager.createBet(createBetData({ stake: 50, matchId: 'match_2', betSelection: 'player2' }));
  manager.markBetAsWon(won.id);
  
  const restored = new BetManager({ initialBankroll: 1000 });
  restored.importData(manager.exportData());
  
  const original = manager.getStatistics();
  const imported = restored.getStatistics();
  
  assert.strictEqual(imported.totalBets, original.totalBets);
  assert.strictEqual(imported.netProfit, original.netProfit);
  assert.strictEqual(imported.bankroll.current, original.bankroll.current);
  assert.strictEqual(imported.bankroll.available, original.bankroll.available);
});

test('el ROI historico se calcula sobre todo lo apostado', () => {
  const manager = new BetManager({ initialBankroll: 1000 });
  
  const won = manager.createBet(createBetData({ stake: 100 }));
  const lost = manager.createBet(createBetData({ stake: 100, matchId: 'match_2', betSelection: 'player2' }));
  
  manager.markBetAsWon(won.id);
  manager.markBetAsLost(lost.id);
  
  const stats = manager.getStatistics();
  
  assert.strictEqual(stats.totalStaked, 200);
  assert.strictEqual(stats.netProfit, 0);
  assert.strictEqual(stats.roi, '0.00%');
});
