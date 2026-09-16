// ============================================================
//  CEREBRO ROBOT DE FUTBOL - EJEMPLO PASO A PASO
//  Ejecuta:  node ejemplo-cerebro.js
// ============================================================

// ---- PASO 1: Cargar el cerebro --------------------------------
const FootballAnalyzer = require('./src/services/FootballAnalyzer');
const brain = new FootballAnalyzer();   // creamos el cerebro vacio

console.log('\n========================================');
console.log('  CEREBRO ROBOT DE FUTBOL - DEMO PASO A PASO');
console.log('========================================\n');

// ---- PASO 2: Crear el equipo LOCAL con sus estadisticas -------
// Cuantos mas datos le des, mas afinada es la prediccion.
const local = brain.addTeam({
  name: 'Real Madrid',
  shortName: 'RMA',
  country: 'España',
  league: 'La Liga',
  leaguePosition: 1,        // 1º en la tabla
  leaguePoints: 78,
  // Estadisticas generales de la temporada
  stats: {
    goals_scored_per_game: 2.1,    // goles que marca por partido
    goals_conceded_per_game: 0.7,  // goles que recibe por partido
    xg_per_game: 1.9,              // goles esperados
    btts_rate: 38,                 // % partidos donde ambos marcan
    over_25_rate: 55,              // % partidos con +2.5 goles
    clean_sheet_rate: 50,          // % partidos sin recibir goles
    points_per_game: 2.1          // puntos por partido
  },
  // Como juega EN CASA (local)
  homeStats: {
    winRate: 87,                   // gana el 87% en casa
    goals_scored_per_game: 2.4,
    goals_conceded_per_game: 0.6
  },
  // Como juega FUERA (no se usa aqui, pero el modelo la tiene)
  awayStats: {
    winRate: 70,
    goals_scored_per_game: 1.8,
    goals_conceded_per_game: 0.8
  },
  // Forma reciente: ultimos 5 resultados (W=gana, D=empata, L=pierde)
  // El MAS RECIENTE PRIMERO.
  form: ['W', 'W', 'D', 'W', 'W']
});

// ---- PASO 3: Crear el equipo VISITANTE ------------------------
const visitante = brain.addTeam({
  name: 'FC Barcelona',
  shortName: 'BAR',
  country: 'España',
  league: 'La Liga',
  leaguePosition: 2,
  leaguePoints: 73,
  stats: {
    goals_scored_per_game: 2.0,
    goals_conceded_per_game: 0.9,
    xg_per_game: 1.8,
    btts_rate: 35,
    over_25_rate: 52,
    clean_sheet_rate: 45,
    points_per_game: 1.95
  },
  homeStats: { winRate: 81, goals_scored_per_game: 2.3, goals_conceded_per_game: 0.8 },
  awayStats: { winRate: 62, goals_scored_per_game: 1.7, goals_conceded_per_game: 1.0 },
  form: ['W', 'D', 'W', 'W', 'L']
});

console.log('Equipos creados:');
console.log('  LOCAL:     ' + local.name + ' (pos ' + local.leaguePosition + ', forma: ' + local.form.join('-') + ')');
console.log('  VISITANTE: ' + visitante.name + ' (pos ' + visitante.leaguePosition + ', forma: ' + visitante.form.join('-') + ')\n');

// ---- PASO 4: Pedirle al cerebro la PREDICCION -----------------
console.log('>>> El cerebro analiza el partido...\n');
const analisis = brain.analyzeMatch(local.id, visitante.id);
const p = analisis.predictions;

console.log('--- RESULTADO 1X2 (quien gana) ---');
console.log('  Gana ' + local.name + ':     ' + p.matchWinner.homeProbability);
console.log('  Empate:               ' + p.matchWinner.drawProbability);
console.log('  Gana ' + visitante.name + ':  ' + p.matchWinner.awayProbability);
console.log('  FAVORITO: ' + p.matchWinner.favorite + '  (confianza: ' + p.matchWinner.confidence + ')');

console.log('\n--- GOLES ---');
console.log('  Goles esperados totales: ' + p.goals.expectedGoals.total);
console.log('  Over/Under 2.5: ' + p.goals.overUnder25.prediction + ' (Over: ' + p.goals.overUnder25.overProbability + ')');
console.log('  Resultado mas probable: ' + p.goals.likelyScore);

console.log('\n--- AMBOS MARCAN (BTTS) ---');
console.log('  ' + p.btts.prediction + ' (Si: ' + p.btts.yesProbability + ')');

// ---- PASO 5: Ver las RECOMENDACIONES del cerebro --------------
console.log('\n--- RECOMENDACIONES DEL CEREBRO ---');
if (analisis.recommendations.length === 0) {
  console.log('  (no hay apuestas de alta confianza para este partido)');
} else {
  analisis.recommendations.forEach((r, i) => {
    console.log('  ' + (i + 1) + '. [' + r.confidence.toUpperCase() + '] ' + r.reason);
    console.log('     Stake recomendado: ' + r.recommendedStake);
  });
}

// ---- PASO 6: Analizar el VALOR de una cuota -------------------
// Aqui esta la clave: comparas la probabilidad del cerebro con la
// cuota que te ofrece la casa de apuestas.
console.log('\n--- ANALISIS DE VALOR ---');
// Supongamos que la casa ofrece estas cuotas:
const cuotaLocal = 1.95;   // gana Real Madrid @ 1.95
const cuotaEmpate = 3.40;
const cuotaVisitante = 3.80;

// Creamos un objeto "partido" minimo para el analisis de valor
const partido = { homeTeamId: local.id, awayTeamId: visitante.id };

[
  { sel: 'home',  cuota: cuotaLocal,      label: local.name },
  { sel: 'draw',  cuota: cuotaEmpate,      label: 'Empate' },
  { sel: 'away',  cuota: cuotaVisitante,   label: visitante.name }
].forEach(item => {
  const v = brain.analyzeBetValue(partido, 'match_winner', item.sel, item.cuota);
  console.log('  ' + item.label + ' @' + item.cuota +
    ' -> valor: ' + v.value + ' (' + v.valueRating + ') -> ' + v.recommendation);
});

console.log('\n  (valor positivo = la cuota es mas alta de lo que el cerebro cree justo = apuesta con ventaja)');

// ---- RESUMEN ------------------------------------------------
console.log('\n========================================');
console.log('  FIN DEL EJEMPLO');
console.log('========================================');
console.log('Para usarlo en modo interactivo (con menus):  npm run football');
console.log('Para cambiar los pesos del modelo:  src/config/footballConstants.js -> PREDICTION_WEIGHTS\n');
