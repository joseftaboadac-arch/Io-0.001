// Interfaz de menu del bot de selecciones (fechas FIFA)

const readline = require('readline');
const {
  ARCHIVO_DATOS, cargarDatos, guardarDatos, buscarEquipo, asegurarEquipo,
  equipos, partidos, setPartidos, idEspn, actualizarPromediosConResultado
} = require('./data');
const { COMPETENCIA_ESPN, descargarPartidosFecha, descargarEstadisticasPartido, calcularPromediosReales } = require('./espn');
const { predecir } = require('./prediccion');

function pct(x) { return (x * 100).toFixed(1) + '%'; }
function num(x) { return Number(x).toFixed(2); }

function fechaDeManana() {
  const manana = new Date();
  manana.setUTCDate(manana.getUTCDate() + 1);
  return manana.toISOString().slice(0, 10);
}

function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(texto + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

function codigoPorEtiqueta() {
  const mapa = {};
  COMPETENCIA_ESPN.forEach(([codigo, etiqueta]) => { mapa[etiqueta] = codigo; });
  return mapa;
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

function informeCompacto(local, visitante, pred, competencia) {
  const resultados = [
    { texto: '1', prob: pred.pLocal },
    { texto: 'X', prob: pred.pEmpate },
    { texto: '2', prob: pred.pVisitante }
  ].sort((a, b) => b.prob - a.prob);
  const favorito = resultados[0].prob >= 0.55
    ? 'favorito ' + resultados[0].texto + ' (' + pct(resultados[0].prob) + ')'
    : 'partido parejo, mejor doble oportunidad';
  const consejos = [];
  if (pred.over25 >= 0.55) consejos.push('over 2.5');
  else if (pred.over25 <= 0.40) consejos.push('under 2.5');
  if (pred.btts >= 0.55) consejos.push('ambos marcan');
  console.log('  ' + competencia + ' | ' + local + ' vs ' + visitante);
  console.log('    Goles esperados: ' + num(pred.golesLocal) + ' - ' + num(pred.golesVisitante) +
    ' | 1X2: ' + pct(pred.pLocal) + ' / ' + pct(pred.pEmpate) + ' / ' + pct(pred.pVisitante));
  console.log('    Over 2.5: ' + pct(pred.over25) + ' | BTTS: ' + pct(pred.btts) +
    ' | Marcador mas probable: ' + pred.topMarcadores[0].marcador + ' (' + pct(pred.topMarcadores[0].probabilidad) + ')');
  console.log('    Recomendacion: ' + favorito + (consejos.length > 0 ? ' | ' + consejos.join(' + ') : ''));
}

function verPartidos() {
  const lista = partidos();
  if (lista.length === 0) {
    console.log('No hay partidos cargados. Agregalos con la opcion 6.');
    return;
  }
  console.log('\n=== PARTIDOS DE LA FECHA FIFA ===');
  lista.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach((p) => {
    console.log('  [' + p.id + '] ' + p.fecha + ' | ' + p.competencia + ': ' + p.local + ' vs ' + p.visitante);
  });
}

function verEquipos() {
  const lista = equipos();
  console.log('\n=== ESTADISTICAS DE EQUIPOS (promedios por partido) ===');
  console.log('  Equipo               Ataque  Defensa  Amarillas  Corners  Offsides');
  Object.keys(lista).sort((a, b) => a.localeCompare(b)).forEach((nombre) => {
    const e = lista[nombre];
    console.log(
      '  ' + nombre.padEnd(20) + ' ' + num(e.ataque).padStart(6) + ' ' + num(e.defensa).padStart(8) +
      ' ' + num(e.amarillas).padStart(10) + ' ' + num(e.corners).padStart(8) + ' ' + num(e.offsides).padStart(8)
    );
  });
}

async function predecirDeFecha(preguntar) {
  verPartidos();
  if (partidos().length === 0) return;
  const respuesta = await preguntar('\nNumero del partido a predecir: ');
  const partido = partidos().find((p) => String(p.id) === respuesta);
  if (!partido) {
    console.log('Partido no encontrado.');
    return;
  }
  const local = equipos()[asegurarEquipo(partido.local)];
  const visitante = equipos()[asegurarEquipo(partido.visitante)];
  if (!local || !visitante) {
    console.log('Faltan estadisticas de uno de los equipos. Actualizalas en la opcion 5.');
    return;
  }
  const pred = predecir(local, visitante);
  mostrarPrediccion(partido.local, partido.visitante, pred, partido.fecha + ' - ' + partido.competencia);
}

async function pedirEquipo(texto, preguntar, generico) {
  const nombre = await preguntar(texto);
  const clave = buscarEquipo(nombre);
  if (clave) {
    console.log('  -> Equipo encontrado: ' + clave);
    return clave;
  }
  const crear = await preguntar('  Equipo no encontrado. Crearlo con estadisticas genericas? (s/n): ');
  if (crear.toLowerCase() === 's') {
    equipos()[nombre] = generico;
    console.log('  -> Equipo creado: ' + nombre + ' (edita sus estadisticas en la opcion 5)');
    return nombre;
  }
  return null;
}

const GENERICO = { ataque: 1.4, defensa: 1.2, amarillas: 2.2, corners: 5.2, offsides: 2.0 };

async function predecirPersonalizado(preguntar) {
  const local = await pedirEquipo('Nombre del equipo local: ', preguntar, GENERICO);
  if (!local) return;
  const visitante = await pedirEquipo('Nombre del equipo visitante: ', preguntar, GENERICO);
  if (!visitante) return;
  if (local === visitante) {
    console.log('El local y el visitante no pueden ser el mismo.');
    return;
  }
  const pred = predecir(equipos()[local], equipos()[visitante]);
  mostrarPrediccion(local, visitante, pred, 'Duelo personalizado');
}

async function editarEquipo(preguntar) {
  verEquipos();
  const nombre = await preguntar('\nEquipo a editar: ');
  const clave = buscarEquipo(nombre);
  if (!clave) {
    console.log('Equipo no encontrado.');
    return;
  }
  const e = equipos()[clave];
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

async function agregarPartido(preguntar) {
  const fecha = await preguntar('Fecha del partido (AAAA-MM-DD): ');
  if (!esFechaValida(fecha)) {
    console.log('Fecha invalida. Usa el formato AAAA-MM-DD, por ejemplo 2026-11-12.');
    return;
  }
  const competencia = await preguntar('Competencia (Amistoso, UEFA Nations League, etc.): ');
  const local = await pedirEquipo('Equipo local: ', preguntar, GENERICO);
  if (!local) return;
  const visitante = await pedirEquipo('Equipo visitante: ', preguntar, GENERICO);
  if (!visitante) return;
  if (local === visitante) {
    console.log('El local y el visitante no pueden ser el mismo.');
    return;
  }
  const lista = partidos();
  const nuevoId = lista.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  lista.push({ id: nuevoId, fecha, competencia: competencia || 'Amistoso', local, visitante });
  guardarDatos();
  console.log('Partido agregado con el numero [' + nuevoId + '].');
}

async function actualizarDesdeEspn(preguntar) {
  console.log('\n=== ACTUALIZAR DESDE ESPN ===');
  console.log('Descarga partidos y estadisticas reales de la fecha FIFA desde la API publica de ESPN.');
  console.log('Necesita internet. Puede demorar unos segundos por dia consultado.\n');

  const desde = await preguntar('Fecha inicial (AAAA-MM-DD, Enter = 2026-09-24): ');
  const hasta = await preguntar('Fecha final (AAAA-MM-DD, Enter = 2026-10-06): ');
  const d = desde || '2026-09-24';
  const h = hasta || '2026-10-06';
  if (!esFechaValida(d) || !esFechaValida(h)) {
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
    console.log('Las fechas FIFA duran entre 6 y 16 dias. Usa un rango mas corto.');
    return;
  }
  console.log('Se consultaran ' + dias + ' dias. Demora unos segundos por dia.');

  console.log('\nDescargando partidos entre el ' + d + ' y el ' + h + '...');
  let partidosDescargados;
  try {
    partidosDescargados = await descargarPartidosFecha(d, h);
  } catch (e) {
    console.log('Error de conexion: ' + e.message);
    console.log('Verifica que tengas internet e intenta de nuevo.');
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
  setPartidos(partidosDescargados.map((p) => ({
    id: nuevoId++,
    fecha: p.fecha,
    competencia: p.competencia,
    local: p.local,
    visitante: p.visitante
  })));

  const mapaCodigo = codigoPorEtiqueta();
  const jugados = partidosDescargados.filter((p) => p.estado === 'post');
  console.log('\nActualizando estadisticas con ' + jugados.length + ' partidos finalizados...');
  let actualizados = 0;
  for (const p of jugados) {
    const codigo = mapaCodigo[p.competencia];
    if (!codigo) continue;
    const stats = await descargarEstadisticasPartido(p.idEspn, codigo);
    if (!stats || !stats[p.local] || !stats[p.visitante]) continue;
    asegurarEquipo(p.local);
    asegurarEquipo(p.visitante);
    if (!equipos()[p.local] || !equipos()[p.visitante]) continue;

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

async function analizarPartidosDeManana(preguntar) {
  console.log('\n=== ANALISIS DE LOS PARTIDOS DE MANANA ===');
  console.log('Descarga los partidos de la fecha indicada desde la API publica de ESPN');
  console.log('y genera la prediccion de cada uno. Necesita internet.\n');

  const respuesta = await preguntar('Fecha a analizar (AAAA-MM-DD, Enter = manana): ');
  let fecha;
  if (respuesta === '') {
    fecha = fechaDeManana();
  } else {
    if (!esFechaValida(respuesta)) {
      console.log('Fecha invalida. Usa el formato AAAA-MM-DD.');
      return;
    }
    fecha = respuesta;
  }

  console.log('Descargando partidos del ' + fecha + '...');
  let descargados;
  try {
    descargados = await descargarPartidosFecha(fecha, fecha);
  } catch (e) {
    console.log('Error de conexion: ' + e.message);
    console.log('Verifica que tengas internet e intenta de nuevo.');
    return;
  }

  if (descargados.length === 0) {
    console.log('No se encontraron partidos de selecciones para el ' + fecha + '.');
    return;
  }

  const porJugar = descargados.filter((p) => p.estado !== 'post');
  const lista = porJugar.length > 0 ? porJugar : descargados;
  if (porJugar.length === 0) {
    console.log('Todos los partidos de esa fecha ya finalizaron; se muestra el analisis previo.');
  }

  console.log('\nPartidos a analizar: ' + lista.length + '\n');
  let analizadas = 0;
  for (const p of lista) {
    const nombreLocal = asegurarEquipo(p.local);
    const nombreVisitante = asegurarEquipo(p.visitante);
    const local = equipos()[nombreLocal];
    const visitante = equipos()[nombreVisitante];
    if (!local || !visitante) {
      console.log('  ' + p.competencia + ' | ' + p.local + ' vs ' + p.visitante);
      console.log('    Sin estadisticas para uno de los equipos; agrega el partido con la opcion 6');
      console.log('    y edita sus estadisticas en la opcion 5 para poder predecirlo.');
      continue;
    }
    informeCompacto(nombreLocal, nombreVisitante, predecir(local, visitante), p.competencia);
    analizadas++;
  }

  guardarDatos();
  console.log('\nResumen: ' + analizadas + ' de ' + lista.length + ' partidos analizados.');
  console.log('(Prediccion estadistica. No garantiza resultados reales.)');
}

async function recalcularDesdeEspn(preguntar) {
  console.log('\n=== RECALCULAR EQUIPO CON DATOS REALES ===');
  console.log('Descarga los ultimos 10 partidos reales del equipo desde ESPN');
  console.log('y recalcula sus promedios (goles, amarillas, corners, offsides).\n');
  verEquipos();
  const nombre = await preguntar('\nEquipo a recalcular: ');
  const clave = asegurarEquipo(nombre);
  if (!idEspn()[clave]) {
    console.log('No hay ID de ESPN para ese equipo. Ejecuta primero la opcion 7');
    console.log('(Actualizar desde ESPN) para que el bot conozca al equipo.');
    return;
  }
  console.log('Descargando historial de ' + clave + '... (unos segundos)');
  const stats = await calcularPromediosReales(clave);
  if (!stats) {
    console.log('No se pudo calcular: sin partidos finalizados en ESPN para ese equipo.');
    return;
  }
  const anterior = equipos()[clave] || { amarillas: 2.2, corners: 4.8, offsides: 2.1 };
  equipos()[clave] = {
    ataque: stats.ataque,
    defensa: stats.defensa,
    amarillas: stats.amarillas !== null ? stats.amarillas : anterior.amarillas,
    corners: stats.corners !== null ? stats.corners : anterior.corners,
    offsides: stats.offsides !== null ? stats.offsides : anterior.offsides,
    partidos: stats.partidos
  };
  guardarDatos();
  const e = equipos()[clave];
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
  console.log('  9. Analizar partidos de manana: descarga del dia siguiente (o de la');
  console.log('     fecha que elijas) los partidos reales desde ESPN y muestra la');
  console.log('     prediccion de todos de una sola vez.');
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
  console.log('10. Analizar partidos de manana (internet)');
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
  '10': analizarPartidosDeManana
};

async function main() {
  cargarDatos();
  console.log('\nBot de analisis y prediccion de partidos de selecciones.');
  console.log('Escribe 9 para ver como funciona el bot.');

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

  rl.on('SIGINT', () => {
    guardarDatos();
    console.log('\nDatos guardados. Hasta la proxima.');
    process.exit(0);
  });

  const preguntar = (texto) => new Promise((resolve) => {
    process.stdout.write(texto);
    if (colaEntrada.length > 0) {
      resolve(colaEntrada.shift());
      return;
    }
    entradaPendiente = resolve;
  });

  let salir = false;
  while (!salir) {
    mostrarMenu();
    const opcion = await preguntar('Opcion: ');
    if (opcion === '0') {
      salir = true;
      continue;
    }
    const accion = ACCIONES[opcion];
    if (!accion) {
      console.log('Opcion no valida. Escribe del 1 al 10, o 0 para salir.');
      continue;
    }
    await accion(preguntar);
  }
  guardarDatos();
  console.log('Datos guardados en ' + ARCHIVO_DATOS + '. Hasta la proxima.');
  rl.close();
}

module.exports = { main };
