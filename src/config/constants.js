// Configuración del sistema de apuestas de tenis

const SURFACES = {
  HARD: 'hard',
  CLAY: 'clay',
  GRASS: 'grass',
  CARPET: 'carpet'
};

const BET_TYPES = {
  // Apuestas de partido
  MATCH_WINNER: 'match_winner',
  HANDICAP: 'handicap',
  OVER_UNDER: 'over_under',
  CORRECT_SCORE: 'correct_score',
  FIRST_SET_WINNER: 'first_set_winner',
  FIRST_SET_SCORE: 'first_set_score',
  TIEBREAK_WINNER: 'tiebreak_winner',
  
  // Apuestas de sets
  TOTAL_SETS: 'total_sets',
  SET_HANDICAP: 'set_handicap',
  SET_BETTING: 'set_betting',
  
  // Apuestas de juegos
  GAME_HANDICAP: 'game_handicap',
  TOTAL_GAMES: 'total_games',
  
  // Apuestas especiales
  ACE_COUNT: 'ace_count',
  DOUBLE_FAULT_COUNT: 'double_fault_count',
  BREAK_POINT_CONVERSION: 'break_point_conversion',
  
  // Apuestas en vivo
  LIVE_MATCH_WINNER: 'live_match_winner',
  LIVE_NEXT_GAME: 'live_next_game',
  LIVE_NEXT_SET: 'live_next_set'
};

const TOURNAMENTS = {
  // Grand Slams
  AUSTRALIAN_OPEN: 'Australian Open',
  FRENCH_OPEN: 'French Open',
  WIMBLEDON: 'Wimbledon',
  US_OPEN: 'US Open',
  
  // ATP Masters 1000
  INDIAN_WELLS: 'Indian Wells',
  MIAMI: 'Miami Open',
  MADRID: 'Madrid Open',
  ROME: 'Rome Masters',
  MONTREAL: 'Canadian Open',
  CINCINNATI: 'Cincinnati Masters',
  SHANGHAI: 'Shanghai Masters',
  PARIS: 'Paris Masters',
  
  // ATP 500
  DUBAI: 'Dubai Tennis Championships',
  ACAPULCO: 'Acapulco',
  BARCELONA: 'Barcelona Open',
  HAMBURG: 'Hamburg European Open',
  WASHINGTON: 'Citi Open',
  BEIJING: 'China Open',
  BASEL: 'Swiss Indoors',
  VIENNA: 'Vienna Open',
  
  // ATP 250
  BRISBANE: 'Brisbane International',
  AUCKLAND: 'Auckland Open',
  MONTPELLIER: 'Open Sud de France',
  ROTTERDAM: 'Rotterdam Open',
  MARSEILLE: 'Open 13 Provence',
  DELRAY_BEACH: 'Delray Beach Open',
  SAO_PAULO: 'Rio Open',
  MARRAKECH: 'Grand Prix Hassan II',
  BUCHAREST: 'Romanian Open',
  GENEVA: 'Geneva Open',
  S_HERTogenbosch: 'Libema Open',
  HALLE: 'Halle Open',
  LONDON: 'Queen\'s Club Championships',
  UMAG: 'Croatia Open',
  GSTAAD: 'Swiss Open Gstaad',
  KITZBUHEL: 'Generali Open',
  WINSTON_SALEM: 'Winston-Salem Open',
  CHENGDU: 'Chengdu Open',
  SHENZHEN: 'Shenzhen Open',
  STOCKHOLM: 'Stockholm Open',
  MOSCOW: 'Kremlin Cup',
  ANTVERP: 'European Open'
};

const HARD_COURT_TOURNAMENTS = [
  TOURNAMENTS.AUSTRALIAN_OPEN,
  TOURNAMENTS.US_OPEN,
  TOURNAMENTS.INDIAN_WELLS,
  TOURNAMENTS.MIAMI,
  TOURNAMENTS.MADRID,
  TOURNAMENTS.MONTREAL,
  TOURNAMENTS.CINCINNATI,
  TOURNAMENTS.SHANGHAI,
  TOURNAMENTS.PARIS,
  TOURNAMENTS.DUBAI,
  TOURNAMENTS.ACAPULCO,
  TOURNAMENTS.WASHINGTON,
  TOURNAMENTS.BEIJING,
  TOURNAMENTS.BASEL,
  TOURNAMENTS.VIENNA,
  TOURNAMENTS.BRISBANE,
  TOURNAMENTS.AUCKLAND,
  TOURNAMENTS.DELRAY_BEACH,
  TOURNAMENTS.SAO_PAULO,
  TOURNAMENTS.WINSTON_SALEM,
  TOURNAMENTS.CHENGDU,
  TOURNAMENTS.SHENZHEN,
  TOURNAMENTS.STOCKHOLM,
  TOURNAMENTS.ANTVERP
];

const STAT_CATEGORIES = {
  // Estadísticas de servicio
  ACE_PERCENTAGE: 'ace_percentage',
  DOUBLE_FAULT_PERCENTAGE: 'double_fault_percentage',
  FIRST_SERVE_PERCENTAGE: 'first_serve_percentage',
  FIRST_SERVE_POINTS_WON: 'first_serve_points_won',
  SECOND_SERVE_POINTS_WON: 'second_serve_points_won',
  SERVICE_POINTS_WON: 'service_points_won',
  
  // Estadísticas de recepción
  FIRST_SERVE_RETURN_WON: 'first_serve_return_won',
  SECOND_SERVE_RETURN_WON: 'second_serve_return_won',
  RETURN_POINTS_WON: 'return_points_won',
  BREAK_POINTS_CONVERTED: 'break_points_converted',
  BREAK_POINTS_SAVED: 'break_points_saved',
  
  // Estadísticas generales
  WIN_PERCENTAGE: 'win_percentage',
  HARD_COURT_WIN_PERCENTAGE: 'hard_court_win_percentage',
  TIEBREAK_WIN_PERCENTAGE: 'tiebreak_win_percentage',
  AVERAGE_ACES: 'average_aces',
  AVERAGE_DOUBLE_FAULTS: 'average_double_faults',
  
  // Estadísticas por superficie
  SURFACE_WIN_RATE: 'surface_win_rate',
  SURFACE_MATCHES_PLAYED: 'surface_matches_played'
};

const RANKING_POINTS = {
  GRAND_SLAM: 2000,
  ATP_FINALS: 1500,
  ATP_FINALS_RR: 200,  // Round Robin
  MASTERS_1000: 1000,
  ATP_500: 500,
  ATP_250: 250,
  CHALLENGER: 125,
  QUALIFYING: 10
};

const ODDS_FORMATS = {
  DECIMAL: 'decimal',
  FRACTIONAL: 'fractional',
  AMERICAN: 'american'
};

module.exports = {
  SURFACES,
  BET_TYPES,
  TOURNAMENTS,
  HARD_COURT_TOURNAMENTS,
  STAT_CATEGORIES,
  RANKING_POINTS,
  ODDS_FORMATS
};
