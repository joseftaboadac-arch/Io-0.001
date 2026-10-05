// Datos de selecciones: equipos base, partidos base y persistencia en disco

const fs = require('fs');
const path = require('path');

const ARCHIVO_DATOS = path.join(__dirname, '..', '..', 'datos-selecciones.json');

const EQUIPOS_BASE = {
  'España': { ataque: 2.3, defensa: 0.7, amarillas: 1.6, corners: 6.5, offsides: 1.8 },
  'Inglaterra': { ataque: 2.0, defensa: 0.8, amarillas: 1.8, corners: 6.0, offsides: 2.0 },
  'Croacia': { ataque: 1.8, defensa: 1.0, amarillas: 2.2, corners: 5.5, offsides: 2.2 },
  'República Checa': { ataque: 1.5, defensa: 1.3, amarillas: 2.0, corners: 5.0, offsides: 2.1 },
  'Francia': { ataque: 2.2, defensa: 0.8, amarillas: 1.9, corners: 6.2, offsides: 1.9 },
  'Italia': { ataque: 1.9, defensa: 0.9, amarillas: 2.1, corners: 5.4, offsides: 2.3 },
  'Alemania': { ataque: 2.1, defensa: 0.9, amarillas: 1.8, corners: 6.3, offsides: 2.0 },
  'Países Bajos': { ataque: 2.0, defensa: 0.9, amarillas: 1.9, corners: 6.0, offsides: 2.1 },
  'Portugal': { ataque: 2.1, defensa: 0.9, amarillas: 1.9, corners: 5.8, offsides: 1.9 },
  'Argentina': { ataque: 2.2, defensa: 0.8, amarillas: 2.0, corners: 5.9, offsides: 2.2 },
  'Brasil': { ataque: 2.0, defensa: 0.9, amarillas: 2.1, corners: 6.1, offsides: 2.0 },
  'Uruguay': { ataque: 1.6, defensa: 1.0, amarillas: 2.4, corners: 5.2, offsides: 2.3 },
  'Colombia': { ataque: 1.8, defensa: 1.0, amarillas: 2.3, corners: 5.6, offsides: 2.1 },
  'México': { ataque: 1.7, defensa: 1.1, amarillas: 2.2, corners: 5.5, offsides: 2.0 },
  'Estados Unidos': { ataque: 1.8, defensa: 1.1, amarillas: 1.9, corners: 5.7, offsides: 1.8 },
  'Chile': { ataque: 1.3, defensa: 1.4, amarillas: 2.5, corners: 5.0, offsides: 2.2 },
  'Perú': { ataque: 1.1, defensa: 1.3, amarillas: 2.6, corners: 4.8, offsides: 2.1 },
  'Ecuador': { ataque: 1.4, defensa: 1.1, amarillas: 2.3, corners: 5.3, offsides: 2.2 },
  'Japón': { ataque: 1.9, defensa: 0.9, amarillas: 1.7, corners: 5.8, offsides: 1.7 },
  'Corea del Sur': { ataque: 1.8, defensa: 1.0, amarillas: 1.9, corners: 5.7, offsides: 1.8 },
  'Australia': { ataque: 1.6, defensa: 1.2, amarillas: 2.0, corners: 5.4, offsides: 1.9 },
  'Bolivia': { ataque: 1.1, defensa: 1.6, amarillas: 2.7, corners: 4.6, offsides: 2.4 },
  'Benín': { ataque: 1.0, defensa: 1.5, amarillas: 2.4, corners: 4.4, offsides: 2.3 },
  'Burkina Faso': { ataque: 1.2, defensa: 1.3, amarillas: 2.5, corners: 4.5, offsides: 2.2 }
};

const PARTIDOS_BASE = [
  { id: 1, fecha: '2026-09-24', competencia: 'UEFA Nations League', local: 'Países Bajos', visitante: 'Alemania' },
  { id: 2, fecha: '2026-09-26', competencia: 'UEFA Nations League', local: 'Inglaterra', visitante: 'España' },
  { id: 3, fecha: '2026-09-26', competencia: 'Amistoso', local: 'Japón', visitante: 'Uruguay' },
  { id: 4, fecha: '2026-09-26', competencia: 'Amistoso', local: 'México', visitante: 'Colombia' },
  { id: 5, fecha: '2026-09-26', competencia: 'Amistoso', local: 'Estados Unidos', visitante: 'Perú' },
  { id: 6, fecha: '2026-09-29', competencia: 'UEFA Nations League', local: 'España', visitante: 'Croacia' },
  { id: 7, fecha: '2026-09-29', competencia: 'Amistoso', local: 'Corea del Sur', visitante: 'Ecuador' },
  { id: 8, fecha: '2026-09-29', competencia: 'Amistoso', local: 'Australia', visitante: 'Brasil' },
  { id: 9, fecha: '2026-09-29', competencia: 'Amistoso', local: 'Estados Unidos', visitante: 'Chile' },
  { id: 10, fecha: '2026-09-29', competencia: 'Amistoso', local: 'México', visitante: 'Perú' },
  { id: 11, fecha: '2026-09-30', competencia: 'Amistoso', local: 'Argentina', visitante: 'Bolivia' },
  { id: 12, fecha: '2026-10-02', competencia: 'UEFA Nations League', local: 'Francia', visitante: 'Italia' },
  { id: 13, fecha: '2026-10-03', competencia: 'UEFA Nations League', local: 'España', visitante: 'República Checa' },
  { id: 14, fecha: '2026-10-03', competencia: 'Amistoso', local: 'México', visitante: 'Estados Unidos' },
  { id: 15, fecha: '2026-10-03', competencia: 'Amistoso', local: 'Argentina', visitante: 'Burkina Faso' },
  { id: 16, fecha: '2026-10-06', competencia: 'UEFA Nations League', local: 'Croacia', visitante: 'España' },
  { id: 17, fecha: '2026-10-06', competencia: 'Amistoso', local: 'México', visitante: 'Chile' },
  { id: 18, fecha: '2026-10-06', competencia: 'Amistoso', local: 'Argentina', visitante: 'Benín' }
];

const TRADUCCION_EQUIPOS = {
  'spain': 'España',
  'england': 'Inglaterra',
  'croatia': 'Croacia',
  'czech republic': 'República Checa',
  'czechia': 'República Checa',
  'france': 'Francia',
  'italy': 'Italia',
  'germany': 'Alemania',
  'netherlands': 'Países Bajos',
  'portugal': 'Portugal',
  'argentina': 'Argentina',
  'brazil': 'Brasil',
  'uruguay': 'Uruguay',
  'colombia': 'Colombia',
  'mexico': 'México',
  'united states': 'Estados Unidos',
  'usa': 'Estados Unidos',
  'chile': 'Chile',
  'peru': 'Perú',
  'ecuador': 'Ecuador',
  'japan': 'Japón',
  'south korea': 'Corea del Sur',
  'republic of korea': 'Corea del Sur',
  'korea republic': 'Corea del Sur',
  'australia': 'Australia',
  'bolivia': 'Bolivia',
  'benin': 'Benín',
  'burkina faso': 'Burkina Faso'
};

let equipos = {};
let partidos = [];
const idEspnPorEquipo = {};

function normalizar(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function traducirEquipo(nombreEspn) {
  return TRADUCCION_EQUIPOS[normalizar(nombreEspn)] || nombreEspn;
}

function buscarEquipo(nombre) {
  const clave = normalizar(nombre);
  for (const nombreEquipo of Object.keys(equipos)) {
    if (normalizar(nombreEquipo) === clave) return nombreEquipo;
  }
  return null;
}

function asegurarEquipo(nombre) {
  const clave = buscarEquipo(nombre);
  if (clave) return clave;
  const nombreFinal = traducirEquipo(nombre);
  if (!equipos[nombreFinal]) {
    equipos[nombreFinal] = { ataque: 1.2, defensa: 1.3, amarillas: 2.2, corners: 4.8, offsides: 2.1, partidos: 0 };
  }
  return nombreFinal;
}

function cargarDatos() {
  equipos = Object.assign({}, EQUIPOS_BASE);
  partidos = PARTIDOS_BASE.slice();
  for (const clave of Object.keys(idEspnPorEquipo)) delete idEspnPorEquipo[clave];
  if (fs.existsSync(ARCHIVO_DATOS)) {
    try {
      const guardado = JSON.parse(fs.readFileSync(ARCHIVO_DATOS, 'utf8'));
      if (guardado.equipos) equipos = Object.assign(equipos, guardado.equipos);
      if (Array.isArray(guardado.partidos)) partidos = guardado.partidos;
      if (guardado.idEspnPorEquipo) Object.assign(idEspnPorEquipo, guardado.idEspnPorEquipo);
    } catch (e) {
      console.log('No se pudo leer datos-selecciones.json, se usan los datos base.');
    }
  }
}

function guardarDatos() {
  try {
    fs.writeFileSync(ARCHIVO_DATOS, JSON.stringify({ equipos, partidos, idEspnPorEquipo }, null, 2), 'utf8');
  } catch (e) {
    console.log('No se pudieron guardar los datos: ' + e.message);
  }
}

module.exports = {
  ARCHIVO_DATOS,
  cargarDatos,
  guardarDatos,
  normalizar,
  traducirEquipo,
  buscarEquipo,
  asegurarEquipo,
  equipos: () => equipos,
  partidos: () => partidos,
  idEspn: () => idEspnPorEquipo,
  setPartidos: (nuevos) => { partidos = nuevos; },
  actualizarPromediosConResultado
};

function actualizarPromediosConResultado(equipo, stats) {
  if (!equipos[equipo]) return;
  const e = equipos[equipo];
  const partidas = (e.partidos || 0) + 1;
  e.partidos = partidas;
  e.ataque = ((e.ataque * (partidas - 1)) + stats.goles) / partidas;
  e.defensa = ((e.defensa * (partidas - 1)) + stats.golesEnContra) / partidas;
  e.amarillas = ((e.amarillas * (partidas - 1)) + stats.amarillas) / partidas;
  e.corners = ((e.corners * (partidas - 1)) + stats.corners) / partidas;
  e.offsides = ((e.offsides * (partidas - 1)) + stats.offsides) / partidas;
}
