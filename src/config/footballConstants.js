// Configuracion del sistema de apuestas de futbol

const LEAGUES = {
  LA_LIGA: 'La Liga',
  PREMIER_LEAGUE: 'Premier League',
  SERIE_A: 'Serie A',
  BUNDESLIGA: 'Bundesliga',
  LIGUE_1: 'Ligue 1',
  PRIMEIRA_LIGA: 'Primeira Liga',
  EREDIVISIE: 'Eredivisie',
  CHAMPIONS_LEAGUE: 'UEFA Champions League',
  EUROPA_LEAGUE: 'UEFA Europa League',
  COPA_LIBERTADORES: 'Copa Libertadores',
  MLS: 'MLS',
  BRAZIL_SERIE_A: 'Brasileirao Serie A',
  ARGENTINA_PRIMERA: 'Liga Profesional Argentina',
  WORLD_CUP: 'FIFA World Cup',
  EURO_CUP: 'UEFA Euro',
  COPA_AMERICA: 'Copa America'
};

const TOP_LEAGUES = [
  LEAGUES.LA_LIGA,
  LEAGUES.PREMIER_LEAGUE,
  LEAGUES.SERIE_A,
  LEAGUES.BUNDESLIGA,
  LEAGUES.LIGUE_1,
  LEAGUES.CHAMPIONS_LEAGUE,
  LEAGUES.EUROPA_LEAGUE
];

const BET_TYPES = {
  // Apuestas de partido
  MATCH_WINNER: 'match_winner',
  DOUBLE_CHANCE: 'double_chance',
  OVER_UNDER_GOALS: 'over_under_goals',
  ASIAN_HANDICAP: 'asian_handicap',
  BOTH_TEAMS_SCORE: 'both_teams_score',
  CORRECT_SCORE: 'correct_score',
  HT_FT: 'ht_ft',
  DRAW_NO_BET: 'draw_no_bet',

  // Apuestas de goles
  TOTAL_GOALS: 'total_goals',
  TEAM_TOTAL_GOALS: 'team_total_goals',
  FIRST_GOAL_SCORER: 'first_goal_scorer',
  ANYTIME_SCORER: 'anytime_scorer',

  // Apuestas de corners / tarjetas
  OVER_UNDER_CORNERS: 'over_under_corners',
  OVER_UNDER_CARDS: 'over_under_cards',
  RED_CARD: 'red_card',

  // Apuestas por tiempo
  FIRST_HALF_RESULT: 'first_half_result',
  SECOND_HALF_RESULT: 'second_half_result',
  NEXT_GOAL: 'next_goal',

  // Apuestas combinadas
  ACCUMULATOR: 'accumulator'
};

const TEAM_STATS = {
  WIN_PERCENTAGE: 'win_percentage',
  DRAW_PERCENTAGE: 'draw_percentage',
  LOSS_PERCENTAGE: 'loss_percentage',
  POINTS_PER_GAME: 'points_per_game',

  GOALS_SCORED_PER_GAME: 'goals_scored_per_game',
  GOALS_CONCEDED_PER_GAME: 'goals_conceded_per_game',
  SHOTS_PER_GAME: 'shots_per_game',
  SHOTS_ON_TARGET_PER_GAME: 'shots_on_target_per_game',
  XG_PER_GAME: 'xg_per_game',

  HOME_WIN_RATE: 'home_win_rate',
  AWAY_WIN_RATE: 'away_win_rate',
  HOME_GOALS_PER_GAME: 'home_goals_per_game',
  AWAY_GOALS_PER_GAME: 'away_goals_per_game',

  BTTS_RATE: 'btts_rate',
  OVER_25_RATE: 'over_25_rate',
  CLEAN_SHEET_RATE: 'clean_sheet_rate',
  AVG_CORNERS: 'avg_corners',
  AVG_CARDS: 'avg_cards'
};

const ODDS_FORMATS = {
  DECIMAL: 'decimal',
  FRACTIONAL: 'fractional',
  AMERICAN: 'american'
};

// Pesos del cerebro para predecir resultados (deben sumar 1.0)
const PREDICTION_WEIGHTS = {
  FORM: 0.25,
  HOME_AWAY: 0.20,
  ATTACK_DEFENSE: 0.20,
  H2H: 0.15,
  LEAGUE_POSITION: 0.10,
  XG: 0.10
};

module.exports = {
  LEAGUES,
  TOP_LEAGUES,
  BET_TYPES,
  TEAM_STATS,
  ODDS_FORMATS,
  PREDICTION_WEIGHTS
};
