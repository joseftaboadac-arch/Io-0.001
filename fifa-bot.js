// Bot de analisis y prediccion de partidos de selecciones nacionales (fechas FIFA)
// Uso: node fifa-bot.js  (no requiere dependencias externas)

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const ARCHIVO_DATOS = path.join(__dirname, 'datos-selecciones.json');

// Estadisticas por equipo (promedios por partido). Editables desde el menu.
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

// Partidos de la proxima fecha FIFA: 24 de septiembre al 6 de octubre de 2026
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

let equipos = {};
let partidos = [];
const idEspnPorEquipo = {};

function cargarDatos() {
  equipos = Object.assign({}, EQUIPOS_BASE);
  partidos = PARTIDOS_BASE.slice();
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

// Traduccion de nombres ESPN -> nombres internos del bot
const TRADUCCION_EQUIPOS = {
  'spain': 'España',
  'england': 'Inglaterra',
  'croatia': 'Croacia',
  'czech republic': 'República Checa',
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
  'australia': 'Australia',
  'bolivia': 'Bolivia',
  'benin': 'Benín',
  'burkina faso': 'Burkina Faso'
};

// Competiciones a consultar en la API de ESPN (codigo ESPN: etiqueta)
const COMPETENCIA_ESPN = [
  ['uefa.nations', 'UEFA Nations League'],
  ['fifa.friendly', 'Amistoso'],
  ['fifa.world', 'Mundial'],
  ['concaf.nations', 'Concacaf Nations League']
];

function traducirEquipo(nombreEspn) {
  const clave = normalizar(nombreEspn);
  if (TRADUCCION_EQUIPOS[clave]) return TRADUCCION_EQUIPOS[clave];
  return nombreEspn;
}

function asegurarEquipo(nombre) {
  // Crea el equipo si no existe y devuelve su nombre interno
  const clave = buscarEquipo(nombre);
  if (clave) return clave;
  const nombreFinal = TRADUCCION_EQUIPOS[normalizar(nombre)] || nombre;
  if (!equipos[nombreFinal]) {
    equipos[nombreFinal] = { ataque: 1.2, defensa: 1.3, amarillas: 2.2, corners: 4.8, offsides: 2.1, partidos: 0 };
  }
  return nombreFinal;
}

async function calcularPromediosReales(nombreEquipo) {
  // Descarga los ultimos partidos reales del equipo desde ESPN y calcula promedios
  const idEspn = idEspnPorEquipo[nombreEquipo];
  if (!idEspn) return null;
  let historial = [];
  for (const [codigo] of COMPETENCIA_ESPN) {
    try {
      const j = await traerJson('https://site.api.espn.com/apis/site/v2/sports/soccer/' + codigo + '/teams/' + idEspn + '/schedule?limit=40');
      const evs = (j.events || []).filter((e) => {
        if (!e.competitions || !e.competitions[0]) return false;
        const c = e.competitions[0];
        const h = c.competitors.find((x) => x.homeAway === 'home');
        const a = c.competitors.find((x) => x.homeAway === 'away');
        const post = c.status && c.status.type && c.status.type.state === 'post';
        return post && h && a && h.score && a.score && typeof h.score.value === 'number' && typeof a.score.value === 'number';
      });
      historial = historial.concat(evs.map((e) => ({ id: e.id, comp: e.competitions[0], codigo })));;
    } catch (e) {
      // competencia sin historial para este equipo
    }
  }
  if (historial.length === 0) return null;

  // Quitar duplicados y quedarse con los 10 mas recientes
  const vistos = new Set();
  const unicos = historial.filter((p) => {
    if (vistos.has(p.id)) return false;
    vistos.add(p.id);
    return true;
  });
  const recientes = unicos.slice(0, 10);

  const acumulado = { aFavor: 0, enContra: 0, amarillas: 0, corners: 0, offsides: 0, conStats: 0 };
  for (const p of recientes) {
    const h = p.comp.competitors.find((x) => x.homeAway === 'home');
    const a = p.comp.competitors.find((x) => x.homeAway === 'away');
    const soyLocal = String(h.team.id) === String(idEspn);
    const miGoles = soyLocal ? h.score.value : a.score.value;
    const golesRival = soyLocal ? a.score.value : h.score.value;
    acumulado.aFavor += miGoles;
    acumulado.enContra += golesRival;

    if (p.codigo) {
      const stats = await descargarEstadisticasPartido(p.id, p.codigo);
      if (stats && stats[nombreEquipo]) {
        acumulado.amarillas += stats[nombreEquipo].amarillas;
        acumulado.corners += stats[nombreEquipo].corners;
        acumulado.offsides += stats[nombreEquipo].offsides;
        acumulado.conStats++;
      }
    }
  }

  const n = recientes.length;
  return {
    ataque: acumulado.aFavor / n,
    defensa: acumulado.enContra / n,
    amarillas: acumulado.conStats > 0 ? acumulado.amarillas / acumulado.conStats : null,
    corners: acumulado.conStats > 0 ? acumulado.corners / acumulado.conStats : null,
    offsides: acumulado.conStats > 0 ? acumulado.offsides / acumulado.conStats : null,
    partidos: n
  };
}

async function recalcularEquipo(nombreEquipo, mantenerSiFalta = true) {
  const stats = await calcularPromediosReales(nombreEquipo);
  if (!stats) return false;
  const anterior = equipos[nombreEquipo] || { amarillas: 2.2, corners: 4.8, offsides: 2.1 };
  equipos[nombreEquipo] = {
    ataque: stats.ataque,
    defensa: stats.defensa,
    amarillas: stats.amarillas !== null ? stats.amarillas : (mantenerSiFalta ? anterior.amarillas : null),
    corners: stats.corners !== null ? stats.corners : (mantenerSiFalta ? anterior.corners : null),
    offsides: stats.offsides !== null ? stats.offsides : (mantenerSiFalta ? anterior.offsides : null),
    partidos: stats.partidos
  };
  return true;
}

async function traerJson(url) {
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
  return respuesta.json();
}

async function descargarPartidosFecha(desde, hasta) {
  // La API no acepta rangos: se consulta dia por dia
  const partidos = [];
  const vistos = new Set();
  const inicio = new Date(desde + 'T00:00:00Z');
  const fin = new Date(hasta + 'T00:00:00Z');
  const totalDias = Math.round((fin - inicio) / 86400000) + 1;
  let diaActual = 0;
  for (let d = new Date(inicio); d <= fin; d.setUTCDate(d.getUTCDate() + 1)) {
    diaActual++;
    const fecha = d.toISOString().slice(0, 10);
    process.stdout.write('  Consultando ' + fecha + ' (dia ' + diaActual + ' de ' + totalDias + ')...\r');
    for (const [codigo, etiqueta] of COMPETENCIA_ESPN) {
      try {
        const j = await traerJson('https://site.api.espn.com/apis/site/v2/sports/soccer/' + codigo + '/scoreboard?dates=' + fecha.replace(/-/g, ''));
        for (const evento of (j.events || [])) {
          if (vistos.has(evento.id)) continue;
          vistos.add(evento.id);
          const c = evento.competitions[0];
          const local = c.competitors.find((x) => x.homeAway === 'home');
          const visitante = c.competitors.find((x) => x.homeAway === 'away');
          if (!local || !visitante) continue;
          idEspnPorEquipo[traducirEquipo(local.team.displayName)] = local.team.id;
          idEspnPorEquipo[traducirEquipo(visitante.team.displayName)] = visitante.team.id;
          partidos.push({
            idEspn: evento.id,
            fecha,
            competencia: etiqueta,
            local: asegurarEquipo(local.team.displayName),
            visitante: asegurarEquipo(visitante.team.displayName),
            estado: evento.status ? evento.status.type.state : 'pre',
            golesLocal: local.score ? parseInt(local.score, 10) : null,
            golesVisitante: visitante.score ? parseInt(visitante.score, 10) : null
          });
        }
      } catch (e) {
        // Un dia o competencia sin datos no detiene la descarga
      }
    }
  }
  process.stdout.write('\n');
  return partidos;
}

async function descargarEstadisticasPartido(idEspn, codigoCompetencia) {
  try {
    const j = await traerJson('https://site.api.espn.com/apis/site/v2/sports/soccer/' + codigoCompetencia + '/summary?event=' + idEspn);
    const box = j.boxscore;
    if (!box || !box.teams) return null;
    let tieneAlguna = false;
    const datos = {};
    for (const t of box.teams) {
      const st = {};
      for (const s of (t.statistics || [])) st[s.name] = s.displayValue;
      const lista = t.statistics || [];
      if (lista.length > 0) tieneAlguna = true;
      const valor = (nombre) => {
        const v = parseFloat(st[nombre]);
        return isNaN(v) ? null : v;
      };
      datos[traducirEquipo(t.team.displayName)] = {
        goles: valor('goals') || 0,
        amarillas: valor('yellowCards'),
        corners: valor('corners'),
        offsides: valor('offsides')
      };
    }
    return tieneAlguna ? datos : null;
  } catch (e) {
    return null;
  }
}

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

async function recalcularDesdeEspn() {
  console.log('\n=== RECALCULAR EQUIPO CON DATOS REALES ===');
  console.log('Descarga los ultimos 10 partidos reales del equipo desde ESPN');
  console.log('y recalcula sus promedios (goles, amarillas, corners, offsides).\n');
  verEquipos();
  const nombre = await preguntar('\nEquipo a recalcular: ');
  const clave = asegurarEquipo(nombre);
  if (!idEspnPorEquipo[clave]) {
    console.log('No hay ID de ESPN para ese equipo. Ejecuta primero la opcion 7');
    console.log('(Actualizar desde ESPN) para que el bot conozca al equipo.');
    return;
  }
  console.log('Descargando historial de ' + clave + '... (unos segundos)');
  const ok = await recalcularEquipo(clave);
  if (!ok) {
    console.log('No se pudo calcular: sin partidos finalizados en ESPN para ese equipo.');
    return;
  }
  guardarDatos();
  const e = equipos[clave];
  console.log('\nPromedios reales de ' + clave + ' (ultimos ' + e.partidos + ' partidos de ESPN):');
  console.log('  Ataque (goles a favor): ' + num(e.ataque));
  console.log('  Defensa (goles en contra): ' + num(e.defensa));
  if (e.amarillas === null || e.corners === null || e.offsides === null) {
    console.log('  Nota: ESPN no tiene tarjetas/corners/offsides de estos partidos;');
    console.log('  se mantienen los valores previos. Podras afinarlos con la opcion 5.');
  } else {
    console.log('  Amarillas: ' + num(e.amarillas));
    console.log('  Corners: ' + num(e.corners));
    console.log('  Offsides: ' + num(e.offsides));
  }
  console.log('Guardado en ' + ARCHIVO_DATOS);
}

async function actualizarDesdeEspn() {
  console.log('\n=== ACTUALIZAR DESDE ESPN ===');
  console.log('Descarga partidos y estadisticas reales de la fecha FIFA desde la API publica de ESPN.');
  console.log('Necesita internet. Puede demorar unos segundos por dia consultado.\n');

  const desde = await preguntar('Fecha inicial (AAAA-MM-DD, Enter = 2026-09-24): ');
  const hasta = await preguntar('Fecha final (AAAA-MM-DD, Enter = 2026-10-06): ');
  const d = desde || '2026-09-24';
  const h = hasta || '2026-10-06';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^\d{4}-\d{2}-\d{2}$/.test(h)) {
    console.log('Fechas invalidas. Usa el formato AAAA-MM-DD.');
    return;
  }

  const dias = Math.round((new Date(h + 'T00:00:00Z') - new Date(d + 'T00:00:00Z')) / 86400000) + 1;
  if (dias <= 0) {
    console.log('La fecha final debe ser igual o posterior a la inicial.');
    return;
  }
  if (dias > 45) {
    console.log('El rango es muy largo: ' + dias + ' dias (maximo 45).');
    console.log('Las fechas FIFA duran entre 6 y 16 dias. Usa un rango mas corto,');
    console.log('por ejemplo 2026-09-24 a 2026-10-06.');
    return;
  }
  console.log('Se consultaran ' + dias + ' dias. Demora unos segundos por dia.');

  console.log('\nDescargando partidos entre el ' + d + ' y el ' + h + '...');
  let partidosDescargados;
  try {
    partidosDescargados = await descargarPartidosFecha(d, h);
  } catch (e) {
    console.log('Error de conexion: ' + e.message);
    console.log('Verifica que tengas internet en el celular e intenta de nuevo.');
    return;
  }

  if (partidosDescargados.length === 0) {
    console.log('No se encontraron partidos en ese rango.');
    return;
  }

  console.log('Partidos encontrados: ' + partidosDescargados.length + '\n');
  partidosDescargados.forEach((p) => {
    const marcador = p.estado === 'post' ? ('  [' + p.golesLocal + '-' + p.golesVisitante + ']') : '';
    console.log('  ' + p.fecha + ' | ' + p.competencia + ': ' + p.local + ' vs ' + p.visitante + marcador);
  });

  const confirmar = await preguntar('\nReemplazar la lista de partidos del bot por estos? (s/n): ');
  if (confirmar.toLowerCase() !== 's') {
    console.log('Lista de partidos sin cambios.');
    return;
  }

  let nuevoId = 1;
  partidos = partidosDescargados.map((p) => ({
    id: nuevoId++,
    fecha: p.fecha,
    competencia: p.competencia,
    local: p.local,
    visitante: p.visitante
  }));

  const codigoPorEtiqueta = {};
  COMPETENCIA_ESPN.forEach(([codigo, etiqueta]) => { codigoPorEtiqueta[etiqueta] = codigo; });

  const jugados = partidosDescargados.filter((p) => p.estado === 'post');
  console.log('\nActualizando estadisticas con ' + jugados.length + ' partidos finalizados...');
  let actualizados = 0;
  for (const p of jugados) {
    const codigo = codigoPorEtiqueta[p.competencia];
    if (!codigo) continue;
    const stats = await descargarEstadisticasPartido(p.idEspn, codigo);
    if (!stats || !stats[p.local] || !stats[p.visitante]) continue;
    asegurarEquipo(p.local);
    asegurarEquipo(p.visitante);
    if (!equipos[p.local] || !equipos[p.visitante]) continue;

    const statsLocal = stats[p.local];
    const statsVisitante = stats[p.visitante];
    statsLocal.golesEnContra = statsVisitante.goles;
    statsVisitante.golesEnContra = statsLocal.goles;

    actualizarPromediosConResultado(p.local, statsLocal);
    actualizarPromediosConResultado(p.visitante, statsVisitante);
    actualizados += 2;
  }

  guardarDatos();
  console.log('Listo. ' + actualizados + ' estadisticas de equipo actualizadas.');
  console.log('Partidos y promedios guardados en ' + ARCHIVO_DATOS);
  const ver = await preguntar('Ver la tabla de estadisticas actualizada? (s/n): ');
  if (ver.toLowerCase() === 's') verEquipos();
}

function guardarDatos() {
  try {
    fs.writeFileSync(ARCHIVO_DATOS, JSON.stringify({ equipos, partidos, idEspnPorEquipo }, null, 2), 'utf8');
  } catch (e) {
    console.log('No se pudieron guardar los datos: ' + e.message);
  }
}

function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function buscarEquipo(nombre) {
  const clave = normalizar(nombre);
  for (const nombreEquipo of Object.keys(equipos)) {
    if (normalizar(nombreEquipo) === clave) return nombreEquipo;
  }
  return null;
}

function poisson(k, lambda) {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

function predecir(local, visitante) {
  const golesLocal = ((local.ataque + visitante.defensa) / 2) * 1.10;
  const golesVisitante = ((visitante.ataque + local.defensa) / 2) * 0.95;
  const MAX_GOLES = 6;
  const matriz = [];
  for (let i = 0; i <= MAX_GOLES; i++) {
    matriz[i] = [];
    for (let j = 0; j <= MAX_GOLES; j++) {
      matriz[i][j] = poisson(i, golesLocal) * poisson(j, golesVisitante);
    }
  }

  let pLocal = 0, pEmpate = 0, pVisitante = 0, btts = 0;
  const marcadores = [];
  for (let i = 0; i <= MAX_GOLES; i++) {
    for (let j = 0; j <= MAX_GOLES; j++) {
      const p = matriz[i][j];
      if (i > j) pLocal += p;
      else if (i === j) pEmpate += p;
      else pVisitante += p;
      if (i > 0 && j > 0) btts += p;
      marcadores.push({ marcador: i + '-' + j, probabilidad: p });
    }
  }

  const over = (linea) => {
    let total = 0;
    for (let i = 0; i <= MAX_GOLES; i++) {
      for (let j = 0; j <= MAX_GOLES; j++) {
        if (i + j > linea) total += matriz[i][j];
      }
    }
    return total;
  };

  marcadores.sort((a, b) => b.probabilidad - a.probabilidad);

  return {
    golesLocal,
    golesVisitante,
    pLocal,
    pEmpate,
    pVisitante,
    over15: over(1.5),
    over25: over(2.5),
    over35: over(3.5),
    btts,
    topMarcadores: marcadores.slice(0, 5),
    amarillas: local.amarillas + visitante.amarillas,
    corners: local.corners + visitante.corners,
    offsides: local.offsides + visitante.offsides
  };
}

function pct(x) {
  return (x * 100).toFixed(1) + '%';
}

function num(x) {
  return x.toFixed(2);
}

function mostrarPrediccion(nombreLocal, nombreVisitante, pred, encabezado) {
  console.log('\n========================================');
  console.log('  PREDICCION: ' + nombreLocal + ' vs ' + nombreVisitante);
  if (encabezado) console.log('  ' + encabezado);
  console.log('========================================');

  console.log('\nGOLES ESPERADOS');
  console.log('  ' + nombreLocal + ': ' + num(pred.golesLocal) + '  |  ' + nombreVisitante + ': ' + num(pred.golesVisitante));

  console.log('\nRESULTADO (1X2)');
  console.log('  Gana ' + nombreLocal + ': ' + pct(pred.pLocal));
  console.log('  Empate: ' + pct(pred.pEmpate));
  console.log('  Gana ' + nombreVisitante + ': ' + pct(pred.pVisitante));

  console.log('\nGOLES TOTALES');
  console.log('  Mas de 1.5 goles: ' + pct(pred.over15));
  console.log('  Mas de 2.5 goles: ' + pct(pred.over25));
  console.log('  Mas de 3.5 goles: ' + pct(pred.over35));
  console.log('  Ambos equipos marcan: ' + pct(pred.btts));

  console.log('\nMARCADORES EXACTOS MAS PROBABLES');
  pred.topMarcadores.forEach((m, idx) => {
    console.log('  ' + (idx + 1) + ') ' + m.marcador + '  (' + pct(m.probabilidad) + ')');
  });

  console.log('\nOTRAS METRICAS ESPERADAS');
  console.log('  Tarjetas amarillas: ' + num(pred.amarillas));
  console.log('  Corners: ' + num(pred.corners));
  console.log('  Offsides: ' + num(pred.offsides));

  console.log('\nRECOMENDACION');
  const resultados = [
    { texto: 'Gana ' + nombreLocal, prob: pred.pLocal },
    { texto: 'Empate', prob: pred.pEmpate },
    { texto: 'Gana ' + nombreVisitante, prob: pred.pVisitante }
  ].sort((a, b) => b.prob - a.prob);
  if (resultados[0].prob >= 0.55) {
    console.log('  -> Favorito claro: ' + resultados[0].texto + ' (' + pct(resultados[0].prob) + ')');
  } else {
    console.log('  -> Partido parejo, el favorito no supera 55%. Considera doble oportunidad.');
  }
  if (pred.over25 >= 0.55) console.log('  -> El partido tiende a tener goles: over 2.5 (' + pct(pred.over25) + ')');
  else if (pred.over25 <= 0.40) console.log('  -> El partido tiende a ser cerrado: under 2.5 (' + pct(1 - pred.over25) + ')');
  if (pred.btts >= 0.55) console.log('  -> Es probable que ambos marquen (' + pct(pred.btts) + ')');
  console.log('  (Prediccion estadistica. No garantiza resultados reales.)');
}

const rl = readline.createInterface({ input: process.stdin });
const colaEntrada = [];
let entradaPendiente = null;

rl.on('line', (linea) => {
  const valor = linea.trim();
  if (entradaPendiente) {
    const resolver = entradaPendiente;
    entradaPendiente = null;
    resolver(valor);
  } else {
    colaEntrada.push(valor);
  }
});

rl.on('close', () => {
  if (entradaPendiente) {
    const resolver = entradaPendiente;
    entradaPendiente = null;
    resolver('');
  }
});

function preguntar(texto) {
  return new Promise((resolve) => {
    process.stdout.write(texto);
    if (colaEntrada.length > 0) {
      resolve(colaEntrada.shift());
      return;
    }
    entradaPendiente = resolve;
  });
}

function verPartidos() {
  console.log('\n=== PARTIDOS DE LA FECHA FIFA (24 sep - 6 oct 2026) ===');
  partidos.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach((p) => {
    console.log('  [' + p.id + '] ' + p.fecha + ' | ' + p.competencia + ': ' + p.local + ' vs ' + p.visitante);
  });
}

async function predecirDeFecha() {
  if (partidos.length === 0) {
    console.log('No hay partidos cargados. Agregalos con la opcion 6.');
    return;
  }
  verPartidos();
  const respuesta = await preguntar('\nNumero del partido a predecir: ');
  const partido = partidos.find((p) => String(p.id) === respuesta);
  if (!partido) {
    console.log('Partido no encontrado.');
    return;
  }
  const local = equipos[asegurarEquipo(partido.local)];
  const visitante = equipos[asegurarEquipo(partido.visitante)];
  if (!local || !visitante) {
    console.log('Faltan estadisticas de uno de los equipos. Actualizalas en la opcion 5.');
    return;
  }
  const pred = predecir(local, visitante);
  mostrarPrediccion(partido.local, partido.visitante, pred, partido.fecha + ' - ' + partido.competencia);
}

async function pedirEquipo(texto) {
  const nombre = await preguntar(texto);
  const clave = buscarEquipo(nombre);
  if (clave) {
    console.log('  -> Equipo encontrado: ' + clave);
    return clave;
  }
  const crear = await preguntar('  Equipo no encontrado. Crearlo con estadisticas genericas? (s/n): ');
  if (crear.toLowerCase() === 's') {
    equipos[nombre] = { ataque: 1.4, defensa: 1.2, amarillas: 2.2, corners: 5.2, offsides: 2.0 };
    console.log('  -> Equipo creado: ' + nombre + ' (edita sus estadisticas en la opcion 5)');
    return nombre;
  }
  return null;
}

async function predecirPersonalizado() {
  const local = await pedirEquipo('Nombre del equipo local: ');
  if (!local) return;
  const visitante = await pedirEquipo('Nombre del equipo visitante: ');
  if (!visitante) return;
  if (local === visitante) {
    console.log('El local y el visitante no pueden ser el mismo.');
    return;
  }
  const pred = predecir(equipos[local], equipos[visitante]);
  mostrarPrediccion(local, visitante, pred, 'Duelo personalizado');
}

function verEquipos() {
  console.log('\n=== ESTADISTICAS DE EQUIPOS (promedios por partido) ===');
  console.log('  Equipo               Ataque  Defensa  Amarillas  Corners  Offsides');
  Object.keys(equipos).sort((a, b) => a.localeCompare(b)).forEach((nombre) => {
    const e = equipos[nombre];
    console.log(
      '  ' + nombre.padEnd(20) + ' ' + num(e.ataque).padStart(6) + ' ' + num(e.defensa).padStart(8) +
      ' ' + num(e.amarillas).padStart(10) + ' ' + num(e.corners).padStart(8) + ' ' + num(e.offsides).padStart(8)
    );
  });
}

async function editarEquipo() {
  verEquipos();
  const nombre = await preguntar('\nEquipo a editar: ');
  const clave = buscarEquipo(nombre);
  if (!clave) {
    console.log('Equipo no encontrado.');
    return;
  }
  const e = equipos[clave];
  console.log('Editando ' + clave + '. Presiona Enter para mantener el valor actual.');

  const campos = [
    { campo: 'ataque', etiqueta: 'Goles a favor por partido', actual: e.ataque },
    { campo: 'defensa', etiqueta: 'Goles en contra por partido', actual: e.defensa },
    { campo: 'amarillas', etiqueta: 'Tarjetas amarillas por partido', actual: e.amarillas },
    { campo: 'corners', etiqueta: 'Corners por partido', actual: e.corners },
    { campo: 'offsides', etiqueta: 'Offsides por partido', actual: e.offsides }
  ];

  for (const c of campos) {
    const valor = await preguntar(c.etiqueta + ' (actual ' + num(c.actual) + '): ');
    if (valor !== '') {
      const numero = parseFloat(valor.replace(',', '.'));
      if (!isNaN(numero) && numero >= 0) {
        e[c.campo] = numero;
      } else {
        console.log('  Valor invalido, se mantiene el actual.');
      }
    }
  }
  guardarDatos();
  console.log('Estadisticas de ' + clave + ' actualizadas y guardadas.');
}

async function agregarPartido() {
  const fecha = await preguntar('Fecha del partido (AAAA-MM-DD): ');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    console.log('Fecha invalida. Usa el formato AAAA-MM-DD, por ejemplo 2026-11-12.');
    return;
  }
  const competencia = await preguntar('Competencia (Amistoso, UEFA Nations League, etc.): ');
  const local = await pedirEquipo('Equipo local: ');
  if (!local) return;
  const visitante = await pedirEquipo('Equipo visitante: ');
  if (!visitante) return;
  if (local === visitante) {
    console.log('El local y el visitante no pueden ser el mismo.');
    return;
  }
  const nuevoId = partidos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  partidos.push({ id: nuevoId, fecha, competencia: competencia || 'Amistoso', local, visitante });
  guardarDatos();
  console.log('Partido agregado con el numero [' + nuevoId + '].');
}

function mostrarAyuda() {
  console.log('\n=== COMO FUNCIONA ESTE BOT ===');
  console.log('  1. Cada equipo tiene promedios por partido: goles a favor (ataque),');
  console.log('     goles en contra (defensa), tarjetas amarillas, corners y offsides.');
  console.log('  2. Los goles esperados se calculan combinando el ataque de un equipo');
  console.log('     con la defensa del rival, con ventaja para el local (+10%).');
  console.log('  3. Con la distribucion de Poisson se calculan las probabilidades de');
  console.log('     resultado (1X2), over/under de goles, ambos marcan y marcadores');
  console.log('     exactos.');
  console.log('  4. Amarillas, corners y offsides se estiman sumando los promedios de');
  console.log('     ambos equipos.');
  console.log('  5. Cuanto mas precisas sean las estadisticas (opcion 5), mejores seran');
  console.log('     las predicciones. Actualizalas despues de cada fecha FIFA.');
  console.log('  6. Tus cambios se guardan automaticamente en datos-selecciones.json.');
  console.log('  7. Actualizar desde ESPN: descarga partidos y estadisticas reales desde');
  console.log('     la API publica de ESPN (necesita internet). Actualiza los promedios');
  console.log('     de cada seleccion con los resultados reales de los partidos jugados.');
  console.log('  8. Esto es una herramienta estadistica de estudio: no garantiza');
  console.log('     resultados y no es asesoramiento de apuestas.');
}

function mostrarMenu() {
  console.log('\n==============================');
  console.log('  BOT SELECCIONES - FECHA FIFA');
  console.log('==============================');
  console.log('1. Ver partidos de la fecha FIFA');
  console.log('2. Predecir un partido de la fecha');
  console.log('3. Predecir un duelo personalizado');
  console.log('4. Ver estadisticas de equipos');
  console.log('5. Editar estadisticas de un equipo');
  console.log('6. Agregar partido');
  console.log('7. Actualizar desde ESPN (internet)');
  console.log('8. Recalcular un equipo con datos reales');
  console.log('9. Ayuda / como funciona');
  console.log('0. Salir');
}

const ACCIONES = {
  '1': verPartidos,
  '2': predecirDeFecha,
  '3': predecirPersonalizado,
  '4': verEquipos,
  '5': editarEquipo,
  '6': agregarPartido,
  '7': actualizarDesdeEspn,
  '8': recalcularDesdeEspn,
  '9': mostrarAyuda,
  '0': null
};

async function ejecutarOpcion(opcion) {
  if (opcion === '0') return true;
  const accion = ACCIONES[opcion];
  if (!accion) {
    console.log('Opcion no valida. Escribe del 1 al 9, o 0 para salir.');
    return false;
  }
  await accion();
  return false;
}

async function main() {
  cargarDatos();
  console.log('\nBot de analisis y prediccion de partidos de selecciones.');
  console.log('Fecha FIFA cargada: 24 de septiembre al 6 de octubre de 2026.');
  console.log('Escribe 9 para ver como funciona el bot.');

  rl.on('SIGINT', () => {
    guardarDatos();
    console.log('\nDatos guardados. Hasta la proxima.');
    process.exit(0);
  });

  let salir = false;
  while (!salir) {
    mostrarMenu();
    const opcion = await preguntar('Opcion: ');
    salir = await ejecutarOpcion(opcion);
  }
  guardarDatos();
  console.log('Datos guardados en ' + ARCHIVO_DATOS + '. Hasta la proxima.');
  rl.close();
}

main();
