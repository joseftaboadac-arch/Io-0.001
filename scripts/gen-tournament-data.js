
// Genera data/players.json y data/matches.json con los torneos actuales:
// ATP 250 Chengdu, ATP 250 Hangzhou, WTA 500 Singapur (23-29 septiembre 2026)
// Uso: node scripts/gen-tournament-data.js

const fs = require('fs');
const path = require('path');
const Player = require('../src/models/Player');
const Match = require('../src/models/Match');

const dataDir = path.join(__dirname, '..', 'data');

// name, country, ranking (ATP/WTA segun lista de entrada)
const PLAYERS = [
  // ATP 250 Chengdu
  ['Valentin Vacherot', 'Monaco', 19, 'right', 'two-handed'],
  ['Alejandro Davidovich Fokina', 'Spain', 29, 'right', 'two-handed'],
  ['Alejandro Tabilo', 'Chile', 32, 'left', 'two-handed'],
  ['Botic van de Zandschulp', 'Netherlands', 40, 'right', 'two-handed'],
  ['Hubert Hurkacz', 'Poland', 46, 'right', 'one-handed'],
  ['Nuno Borges', 'Portugal', 48, 'right', 'two-handed'],
  ['Denis Shapovalov', 'Canada', 50, 'left', 'one-handed'],
  ['Sebastian Baez', 'Argentina', 51, 'right', 'two-handed'],
  ['Jenson Brooksby', 'USA', 60, 'right', 'two-handed'],
  ['Alexander Shevchenko', 'Kazakhstan', 62, 'right', 'two-handed'],
  ['Martin Damm', 'USA', 88, 'right', 'two-handed'],
  ['Lloyd Harris', 'South Africa', 90, 'right', 'two-handed'],
  ['Aleksandar Kovacevic', 'USA', 95, 'right', 'two-handed'],
  ['Adrian Mannarino', 'France', 96, 'left', 'two-handed'],
  ['Shang Juncheng', 'China', 100, 'right', 'two-handed'],
  ['Alexandre Muller', 'France', 102, 'right', 'two-handed'],
  ['Facundo Diaz Acosta', 'Argentina', 105, 'left', 'two-handed'],
  ['Zhang Zhizhen', 'China', 112, 'right', 'two-handed'],
  ['Alexei Popyrin', 'Australia', 115, 'right', 'two-handed'],
  ['Nikoloz Basilashvili', 'Georgia', 120, 'right', 'one-handed'],
  ['Juan Manuel Cerundolo', 'Argentina', 125, 'left', 'two-handed'],
  ['Federico Cina', 'Italy', 130, 'right', 'two-handed'],
  ['Miomir Kecmanovic', 'Serbia', 135, 'right', 'two-handed'],
  ['Moise Kouame', 'France', 140, 'right', 'two-handed'],
  ['Shintaro Mochizuki', 'Japan', 145, 'right', 'two-handed'],
  ['Lorenzo Sonego', 'Italy', 150, 'right', 'two-handed'],
  ['James Duckworth', 'Australia', 155, 'right', 'two-handed'],
  ['Zhou Yichen', 'China', 160, 'right', 'two-handed'],
  ['Vit Kopriva', 'Czech Republic', 175, 'right', 'two-handed'],
  ['Tallon Griekspoor', 'Netherlands', 45, 'right', 'two-handed'],

  // ATP 250 Hangzhou
  ['Daniil Medvedev', 'Russia', 6, 'right', 'two-handed'],
  ['Andrey Rublev', 'Russia', 25, 'right', 'two-handed'],
  ['Tomas Martin Etcheverry', 'Argentina', 30, 'right', 'two-handed'],
  ['Quentin Halys', 'France', 49, 'right', 'two-handed'],
  ['Adolfo Daniel Vallejo', 'Paraguay', 58, 'right', 'two-handed'],
  ['Fabian Marozsan', 'Hungary', 59, 'right', 'two-handed'],
  ['Jaime Faria', 'Portugal', 68, 'right', 'two-handed'],
  ['Kamil Majchrzak', 'Poland', 73, 'right', 'two-handed'],
  ['Roman Safiullin', 'Russia', 80, 'right', 'two-handed'],
  ['Mattia Bellucci', 'Italy', 85, 'left', 'two-handed'],
  ['Adam Walton', 'Australia', 95, 'right', 'two-handed'],
  ['Coleman Wong', 'Hong Kong', 100, 'right', 'two-handed'],
  ['Carlos Ugo Carabelli', 'Argentina', 105, 'right', 'two-handed'],
  ['Dalibor Svrcina', 'Czech Republic', 115, 'right', 'two-handed'],
  ['Hugo Gaston', 'France', 125, 'left', 'two-handed'],
  ['Rinky Hijikata', 'Australia', 130, 'right', 'two-handed'],
  ['Kyrian Jacquet', 'France', 135, 'right', 'two-handed'],
  ['Shimabukuro Shintaro', 'Japan', 145, 'right', 'two-handed'],
  ['Alex Bolt', 'Australia', 155, 'left', 'two-handed'],
  ['Taro Daniel', 'Japan', 160, 'right', 'two-handed'],
  ['Bu Yunchaokete', 'China', 90, 'right', 'two-handed'],
  ['Zheng Michael', 'China', 165, 'right', 'two-handed'],
  ['Sun Fajing', 'China', 170, 'right', 'two-handed'],
  ['Cui Jie', 'China', 180, 'right', 'two-handed'],
  ['Terence Atmane', 'France', 175, 'right', 'two-handed'],
  ['Valentin Royer', 'France', 108, 'right', 'two-handed'],
  ['Dalyn Sweeny', 'Australia', 112, 'right', 'two-handed'],

  // WTA 500 Singapur
  ['Mirra Andreeva', 'Russia', 5, 'right', 'two-handed'],
  ['Amanda Anisimova', 'USA', 11, 'right', 'two-handed'],
  ['Alexandra Eala', 'Philippines', 18, 'right', 'two-handed'],
  ['Elise Mertens', 'Belgium', 19, 'right', 'two-handed'],
  ['Maja Chwalinska', 'Poland', 26, 'right', 'two-handed'],
  ['Leylah Fernandez', 'Canada', 31, 'left', 'two-handed'],
  ['Maria Sakkari', 'Greece', 33, 'right', 'two-handed'],
  ['Donna Vekic', 'Croatia', 37, 'right', 'two-handed'],
  ['Daria Kasatkina', 'Australia', 34, 'right', 'two-handed'],
  ['Aliaksandra Sasnovich', 'Belarus', 36, 'right', 'two-handed'],
  ['Alycia Parks', 'USA', 38, 'right', 'two-handed'],
  ['Kristina Mladenovic', 'France', 40, 'right', 'two-handed'],
  ['Anna-Lena Friedsam', 'Germany', 42, 'right', 'two-handed'],
  ['Joanna Garland', 'Chinese Taipei', 44, 'right', 'two-handed'],
  ['Nao Hibino', 'Japan', 46, 'right', 'two-handed'],
  ['Kyoka Okamura', 'Japan', 48, 'right', 'two-handed'],
  ['Barbora Krejcikova', 'Czech Republic', 50, 'right', 'two-handed'],
  ['Victoria Morvayova', 'Slovakia', 52, 'right', 'two-handed'],
  ['Talia Gibson', 'Australia', 54, 'right', 'two-handed'],
  ['Oleksandra Oliynykova', 'Ukraine', 56, 'right', 'two-handed'],
  ['Tatiana Prozorova', 'Russia', 58, 'right', 'two-handed'],
  ['Sofia Costoulas', 'Belgium', 60, 'right', 'two-handed'],
  ['Wang Xinyu', 'China', 62, 'right', 'two-handed'],
  ['Linda Fruhvirtova', 'Czech Republic', 64, 'right', 'two-handed'],
  ['Storm Hunter', 'Australia', 66, 'left', 'two-handed'],
  ['Fiona Ferro', 'France', 68, 'right', 'two-handed'],
  ['Rebecca Sramkova', 'Slovakia', 70, 'right', 'two-handed'],
  ['Mei Yamaguchi', 'Japan', 72, 'right', 'two-handed'],
  ['Valentina Wolff', 'Germany', 74, 'right', 'two-handed']
];

// [torneo, ronda, p1, p2, ganador (1|2|null=proximo), setsP1, setsP2, dia]
// setsP1/setsP2: arrays de games por set del jugador 1 y 2
const MATCHES = [
  // ATP 250 Chengdu - 1a ronda (resultados reales 24-25 sep)
  ['Chengdu Open', 'R1', 'Lloyd Harris', 'Aleksandar Kovacevic', 1, [6, 6, null], [3, 4, null], 24],
  ['Chengdu Open', 'R1', 'Martin Damm', 'Shintaro Mochizuki', 1, [6, 6, null], [1, 4, null], 24],
  ['Chengdu Open', 'R1', 'Alexander Shevchenko', 'Hubert Hurkacz', 2, [0, 3, null], [6, 6, null], 24],
  ['Chengdu Open', 'R1', 'Juan Manuel Cerundolo', 'Zhou Yichen', 1, [6, 6, null], [2, 3, null], 24],
  ['Chengdu Open', 'R1', 'Moise Kouame', 'Alexandre Muller', 2, [0, 4, null], [2, 6, null], 24],
  ['Chengdu Open', 'R1', 'Shang Juncheng', 'Adrian Mannarino', 2, [2, 7, 1, null], [6, 5, 6, null], 24],
  ['Chengdu Open', 'R1', 'Miomir Kecmanovic', 'Nikoloz Basilashvili', 2, [6, 3, 6, null], [3, 6, 7, null], 24],
  ['Chengdu Open', 'R1', 'Federico Cina', 'Carlos Ugo Carabelli', 1, [6, 6, null], [3, 2, null], 24],
  ['Chengdu Open', 'R1', 'James Duckworth', 'Lorenzo Sonego', 2, [0, 4, null], [6, 6, null], 24],
  ['Chengdu Open', 'R1', 'Tallon Griekspoor', 'Denis Shapovalov', 2, [0, 6, 6, null], [2, 3, 7, null], 24],
  ['Chengdu Open', 'R1', 'Sebastian Baez', 'Jenson Brooksby', 2, [0, 3, null], [6, 6, null], 24],
  ['Chengdu Open', 'R1', 'Vit Kopriva', 'Zhou Yichen', 1, [6, 6, null], [4, 3, null], 24],
  // ATP 250 Chengdu - 2a ronda (25-26 sep)
  ['Chengdu Open', 'R2', 'Valentin Vacherot', 'Lloyd Harris', null, null, null, 26],
  ['Chengdu Open', 'R2', 'Martin Damm', 'Hubert Hurkacz', null, null, null, 26],
  ['Chengdu Open', 'R2', 'Alejandro Tabilo', 'Adrian Mannarino', null, null, null, 25],
  ['Chengdu Open', 'R2', 'Juan Manuel Cerundolo', 'Alejandro Davidovich Fokina', null, null, null, 26],
  ['Chengdu Open', 'R2', 'Federico Cina', 'Alexandre Muller', null, null, null, 26],
  ['Chengdu Open', 'R2', 'Lorenzo Sonego', 'Jenson Brooksby', null, null, null, 25],
  ['Chengdu Open', 'R2', 'Nikoloz Basilashvili', 'Botic van de Zandschulp', null, null, null, 25],
  ['Chengdu Open', 'R2', 'Denis Shapovalov', 'Vit Kopriva', null, null, null, 25],

  // ATP 250 Hangzhou - 1a ronda (resultados reales 24-25 sep)
  ['Hangzhou Open', 'R1', 'Valentin Royer', 'Adam Walton', 1, [6, 6, null], [3, 4, null], 24],
  ['Hangzhou Open', 'R1', 'Zhang Zhizhen', 'Coleman Wong', 2, [2, 3, null], [6, 6, null], 24],
  ['Hangzhou Open', 'R1', 'Cui Jie', 'Adolfo Daniel Vallejo', 2, [1, 6, 2, null], [2, 7, 6, null], 24],
  ['Hangzhou Open', 'R1', 'Mattia Bellucci', 'Kamil Majchrzak', 2, [0, 4, null], [6, 6, null], 24],
  ['Hangzhou Open', 'R1', 'Bu Yunchaokete', 'Zheng Michael', 1, [6, 6, null], [4, 3, null], 24],
  ['Hangzhou Open', 'R1', 'Rinky Hijikata', 'Dalibor Svrcina', 1, [6, 7, 6, null], [7, 6, 4, null], 24],
  ['Hangzhou Open', 'R1', 'Fabian Marozsan', 'Alex Bolt', 1, [6, 4, null], [4, 2, null], 24],
  ['Hangzhou Open', 'R1', 'Jaime Faria', 'Terence Atmane', 1, [2, 6, 1, 6, null], [1, 7, 6, 9, null], 24],
  ['Hangzhou Open', 'R1', 'Shimabukuro Shintaro', 'Hugo Gaston', 2, [0, 4, null], [6, 6, null], 24],
  ['Hangzhou Open', 'R1', 'James Duckworth', 'Lorenzo Sonego', 2, [0, 4, null], [6, 6, null], 24],
  ['Hangzhou Open', 'R1', 'Sun Fajing', 'Roman Safiullin', 2, [0, 0, null], [6, 6, null], 24],
  ['Hangzhou Open', 'R1', 'Coleman Wong', 'Zhang Zhizhen', null, null, null, 24],
  ['Hangzhou Open', 'R1', 'Alexei Popyrin', 'Kyrian Jacquet', 2, [1, 2, null], [6, 6, null], 25],
  ['Hangzhou Open', 'R1', 'Dalyn Sweeny', 'Taro Daniel', 2, [6, 6, 2, null], [6, 7, 6, null], 24],
  // ATP 250 Hangzhou - 2a ronda (25-26 sep)
  ['Hangzhou Open', 'R2', 'Daniil Medvedev', 'Valentin Vacherot', null, null, null, 26],
  ['Hangzhou Open', 'R2', 'Coleman Wong', 'Adolfo Daniel Vallejo', null, null, null, 26],
  ['Hangzhou Open', 'R2', 'Quentin Halys', 'Roman Safiullin', null, null, null, 26],
  ['Hangzhou Open', 'R2', 'Bu Yunchaokete', 'Kamil Majchrzak', null, null, null, 26],
  ['Hangzhou Open', 'R2', 'Fabian Marozsan', 'Taro Daniel', null, null, null, 25],
  ['Hangzhou Open', 'R2', 'Kyrian Jacquet', 'Tomas Martin Etcheverry', null, null, null, 25],
  ['Hangzhou Open', 'R2', 'Jaime Faria', 'Hugo Gaston', null, null, null, 25],
  ['Hangzhou Open', 'R2', 'Rinky Hijikata', 'Andrey Rublev', null, null, null, 25],

  // WTA 500 Singapur - 1a ronda (21-22 sep)
  ['Singapore Tennis Open', 'R1', 'Maria Sakkari', 'Linda Fruhvirtova', 1, [6, 6, null], [4, 1, null], 22],
  ['Singapore Tennis Open', 'R1', 'Barbora Krejcikova', 'Anna-Lena Friedsam', 1, [2, 7, 7, null], [6, 5, 6, null], 22],
  ['Singapore Tennis Open', 'R1', 'Donna Vekic', 'Wang Xinyu', 2, [0, 6, null], [2, 2, null], 22],
  ['Singapore Tennis Open', 'R1', 'Tatiana Prozorova', 'Sofia Costoulas', 1, [2, 5, 7, 6, null], [6, 7, 6, 2, null], 22],
  ['Singapore Tennis Open', 'R1', 'Alycia Parks', 'Mei Yamaguchi', 1, [6, 6, null], [4, 3, null], 22],
  ['Singapore Tennis Open', 'R1', 'Valentina Wolff', 'Oleksandra Oliynykova', 2, [0, 6, 7, null], [2, 1, 6, null], 22],
  // WTA 500 Singapur - 2a ronda (23-24 sep)
  ['Singapore Tennis Open', 'R2', 'Aliaksandra Sasnovich', 'Daria Kasatkina', 1, [6, 6, null], [0, 2, null], 23],
  ['Singapore Tennis Open', 'R2', 'Alycia Parks', 'Leylah Fernandez', 2, [0, 3, null], [2, 6, null], 23],
  ['Singapore Tennis Open', 'R2', 'Elise Mertens', 'Barbora Krejcikova', null, null, null, 23],
  ['Singapore Tennis Open', 'R2', 'Oleksandra Oliynykova', 'Maja Chwalinska', 2, [0, 0, null], [6, 6, null], 23],
  ['Singapore Tennis Open', 'R2', 'Wang Xinyu', 'Joanna Garland', 1, [6, 6, null], [0, 4, null], 24],
  ['Singapore Tennis Open', 'R2', 'Tatiana Prozorova', 'Alexandra Eala', 1, [2, 6, 7, 5, null], [6, 7, 5, 3, null], 24],
  ['Singapore Tennis Open', 'R2', 'Maria Sakkari', 'Nao Hibino', 1, [6, 6, null], [2, 1, null], 24],
  ['Singapore Tennis Open', 'R2', 'Talia Gibson', 'Victoria Morvayova', 1, [6, 7, 6, null], [0, 6, 1, null], 24],
  // WTA 500 Singapur - cuartos (25 sep, en curso)
  ['Singapore Tennis Open', 'QF', 'Mirra Andreeva', 'Leylah Fernandez', null, null, null, 25],
  ['Singapore Tennis Open', 'QF', 'Elise Mertens', 'Maja Chwalinska', null, null, null, 25],
  ['Singapore Tennis Open', 'QF', 'Wang Xinyu', 'Tatiana Prozorova', null, null, null, 25],
  ['Singapore Tennis Open', 'QF', 'Maria Sakkari', 'Talia Gibson', null, null, null, 25]
];

function buildPlayer(name, country, ranking, hand, backhand) {
  const player = new Player({ name, country, ranking, hand, backhand });
  return player;
}

function buildMatch(tournament, round, p1Name, p2Name, winner, setsP1, setsP2, day) {
  const p1 = playerMap.get(p1Name);
  const p2 = playerMap.get(p2Name);
  if (!p1 || !p2) {
    console.error('Jugador no encontrado:', !p1 ? p1Name : p2Name);
    return null;
  }

  const isWTA = tournament === 'Singapore Tennis Open';
  const completed = winner !== null && setsP1 !== null;

  const date = new Date(Date.UTC(2026, 8, day, isWTA ? 8 : 2, 0, 0)).toISOString();

  const matchData = {
    tournament,
    tournamentCategory: isWTA ? 'wta500' : 'atp250',
    round,
    surface: 'hard',
    date,
    status: completed ? 'completed' : 'upcoming',
    player1: p1,
    player2: p2,
    player1Id: p1.id,
    player2Id: p2.id
  };

  if (completed) {
    const sets = [];
    for (let i = 0; i < setsP1.length; i++) {
      if (setsP1[i] === null) break;
      sets.push({ gamesP1: setsP1[i], gamesP2: setsP2[i] });
    }
    matchData.score = { sets };
    matchData.result = {
      player1Score: sets.filter(s => s.gamesP1 > s.gamesP2).length,
      player2Score: sets.filter(s => s.gamesP2 > s.gamesP1).length,
      winner: winner === 1 ? p1.id : p2.id
    };
  }

  return new Match(matchData);
}

// Construir jugadores
const playerMap = new Map();
PLAYERS.forEach(([name, country, ranking, hand, backhand]) => {
  const p = buildPlayer(name, country, ranking, hand, backhand);
  playerMap.set(name, p);
});

// Construir partidos
const matches = [];
MATCHES.forEach(m => {
  const match = buildMatch(...m);
  if (match) matches.push(match);
});

// Guardar
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const playersOut = Array.from(playerMap.values()).map(p => p.toJSON());
fs.writeFileSync(path.join(dataDir, 'players.json'), JSON.stringify(playersOut, null, 2));
fs.writeFileSync(path.join(dataDir, 'matches.json'), JSON.stringify(matches.map(m => m.toJSON()), null, 2));

console.log('Generados:');
console.log(' -', playersOut.length, 'jugadores en data/players.json');
console.log(' -', matches.length, 'partidos en data/matches.json');
console.log(' - completados:', matches.filter(m => m.status === 'completed').length);
console.log(' - proximos:', matches.filter(m => m.status === 'upcoming').length);
