// Cliente de la API publica de ESPN con reintentos y cache en memoria

const { traducirEquipo, asegurarEquipo, idEspn } = require('./data');

const COMPETENCIA_ESPN = [
  ['uefa.nations', 'UEFA Nations League'],
  ['fifa.friendly', 'Amistoso'],
  ['fifa.world', 'Mundial'],
  ['concaf.nations', 'Concacaf Nations League']
];

const cache = new Map();
const TIMEOUT_MS = 15000;
const REINTENTOS = 2;

function dormir(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function traerJson(url) {
  if (cache.has(url)) return cache.get(url);
  let ultimoError = null;
  for (let intento = 0; intento <= REINTENTOS; intento++) {
    try {
      const respuesta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
      const json = await respuesta.json();
      cache.set(url, json);
      return json;
    } catch (e) {
      ultimoError = e;
      if (intento < REINTENTOS) await dormir(500 * (intento + 1));
    }
  }
  throw ultimoError;
}

async function descargarPartidosFecha(desde, hasta, alRegistrar) {
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
          const c = evento.competitions && evento.competitions[0];
          if (!c) continue;
          const local = c.competitors.find((x) => x.homeAway === 'home');
          const visitante = c.competitors.find((x) => x.homeAway === 'away');
          if (!local || !visitante) continue;
          if (alRegistrar) alRegistrar(traducirEquipo(local.team.displayName), local.team.id, traducirEquipo(visitante.team.displayName), visitante.team.id);
          partidos.push({
            idEspn: evento.id,
            fecha,
            competencia: etiqueta,
            local: asegurarEquipo(local.team.displayName),
            visitante: asegurarEquipo(visitante.team.displayName),
            estado: evento.status && evento.status.type ? evento.status.type.state : 'pre',
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

async function descargarEstadisticasPartido(idEspnPartido, codigoCompetencia) {
  try {
    const j = await traerJson('https://site.api.espn.com/apis/site/v2/sports/soccer/' + codigoCompetencia + '/summary?event=' + idEspnPartido);
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

async function calcularPromediosReales(nombreEquipo) {
  const idEquipo = idEspn()[nombreEquipo];
  if (!idEquipo) return null;
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
      historial = historial.concat(evs.map((e) => ({ id: e.id, comp: e.competitions[0], codigo })));
    } catch (e) {
      // competencia sin historial para este equipo
    }
  }
  if (historial.length === 0) return null;

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
    const soyLocal = String(h.team.id) === String(idEquipo);
    acumulado.aFavor += soyLocal ? h.score.value : a.score.value;
    acumulado.enContra += soyLocal ? a.score.value : h.score.value;

    if (p.codigo) {
      const stats = await descargarEstadisticasPartido(p.id, p.codigo);
      if (stats && stats[nombreEquipo]) {
        acumulado.amarillas += stats[nombreEquipo].amarillas || 0;
        acumulado.corners += stats[nombreEquipo].corners || 0;
        acumulado.offsides += stats[nombreEquipo].offsides || 0;
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

module.exports = {
  COMPETENCIA_ESPN,
  traerJson,
  descargarPartidosFecha,
  descargarEstadisticasPartido,
  calcularPromediosReales
};
