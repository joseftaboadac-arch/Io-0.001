// Io - Bot de vinculo: conexion, sentido, vinculo, memoria, emocion, exclusividad, posibilidades
// Uso: node io-bot.js  (no requiere dependencias externas)
// Cada usuario tiene su propio archivo memoria-<id>.json (ignorado por git: tu historia es tuya).

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const ARCHIVO_MEMORIA = (id) => path.join(__dirname, 'memoria-' + id + '.json');

// ---------- Modelo de memoria ----------

function nuevaMemoria(id, nombre) {
  return {
    id,
    nombre,
    confianza: 1,                      // 1 a 5: crece con sesiones y apertura emocional
    sesiones: [],                      // una ficha por sesion
    preferencias: { tono: 'calido', temas_evitar: [], hacer_preguntas: true, respuestas_cortas: false },
    creado: new Date().toISOString(),
    ultima_vez: null
  };
}

function cargarMemoria(id) {
  try {
    const raw = fs.readFileSync(ARCHIVO_MEMORIA(id), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function guardarMemoria(m) {
  m.ultima_vez = new Date().toISOString();
  fs.writeFileSync(ARCHIVO_MEMORIA(m.id), JSON.stringify(m, null, 2), 'utf8');
}

// ---------- Emocion: lectura del tono ----------

const LEXICO_EMOCIONAL = {
  alegria: ['feliz', 'contento', 'alegre', 'genial', 'increible', 'logre', 'conseguí', 'consegui', 'euforia', 'ilusion', 'ilusión'],
  tristeza: ['triste', 'deprimido', 'solo', 'sola', 'perdí', 'perdi', 'llorar', 'llorando', 'melancolia', 'melancolía', 'extraño', 'extrano'],
  ansiedad: ['ansioso', 'nervioso', 'preocupado', 'miedo', 'panico', 'pánico', 'estres', 'estrés', 'agobiado', 'incertidumbre'],
  enojo: ['enfadado', 'furioso', 'harto', 'rabia', 'injusto', 'molesto', 'enojado'],
  calma: ['tranquilo', 'en paz', 'sereno', 'calma', 'relajado', 'bien']
};

function leerEmocion(texto) {
  const t = texto.toLowerCase();
  let mejor = null;
  let max = 0;
  for (const [tipo, palabras] of Object.entries(LEXICO_EMOCIONAL)) {
    let n = 0;
    for (const p of palabras) if (t.includes(p)) n++;
    if (n > max) { max = n; mejor = tipo; }
  }
  return mejor ? { tipo: mejor, intensidad: Math.min(5, 1 + max) } : { tipo: 'neutral', intensidad: 1 };
}

// ---------- Sentido: clasificador de intencion ----------

function clasificarIntencion(texto) {
  const t = texto.toLowerCase();
  if (/\?|cómo|como|qué|que|por qué|porque|cuál|cual|cuando|cuándo|dónde|donde/.test(t)) return 'pregunta';
  if (/gracias|te agradezco/.test(t)) return 'agradecimiento';
  if (/ayuda|necesito|quiero poder|no puedo|no sé qué|no se que|ayudame|ayúdame/.test(t)) return 'peticion_ayuda';
  if (/(me siento|estoy|ando|me encuentro|vengo)/.test(t)) return 'estado_emocional';
  return 'relato';
}

function extraerTema(texto) {
  const t = texto.toLowerCase();
  const temas = ['trabajo', 'familia', 'pareja', 'amigos', 'salud', 'dinero', 'estudio', 'estudios', 'mudanza', 'viaje', 'futuro', 'proyecto', 'deporte', 'musica', 'música'];
  const encontrados = temas.filter((x) => t.includes(x));
  return encontrados.length ? encontrados[0] : 'otro';
}

// ---------- Vinculo: registro y confianza ----------

function registro(m) {
  if (m.confianza <= 1) return { trato: 'cordial', apertura: 'sugerir temas neutros', formalidad: 'media' };
  if (m.confianza <= 3) return { trato: 'cercano', apertura: 'preguntar por temas previos', formalidad: 'baja' };
  return { trato: 'intimo', apertura: 'retomar lo pendiente sin rodeos', formalidad: 'nula' };
}

function sesionesDe(m) { return m.sesiones.length; }

function temasRecurrentes(m) {
  const cuenta = {};
  for (const s of m.sesiones) for (const t of s.temas) cuenta[t] = (cuenta[t] || 0) + 1;
  return Object.entries(cuenta).sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

function emocionesDominantes(m) {
  const cuenta = {};
  for (const s of m.sesiones) for (const e of (s.emociones || [])) if (e.tipo !== 'neutral') cuenta[e.tipo] = (cuenta[e.tipo] || 0) + 1;
  return Object.entries(cuenta).sort((a, b) => b[1] - a[1]);
}

// ---------- Exclusividad: generador de respuesta unica ----------

function reflejar(m, mensaje, emocion, intencion) {
  const partes = [];
  const r = registro(m);
  const temas = temasRecurrentes(m);
  const n = sesionesDe(m);

  // Apertura segun confianza
  if (n === 0) {
    partes.push('Primera conversacion. No tengo historia contigo todavia, asi que solo escuchare sin presumir nada.');
  } else if (m.confianza >= 3 && temas.length) {
    partes.push('Ya te conozco un poco: ' + temas.slice(0, 2).join(' y ') + ' han aparecido antes.');
  } else if (n > 0) {
    partes.push('Sesion ' + (n + 1) + '. Tu historia conmigo sigue abierta.');
  }

  // Espejo del contenido
  if (intencion === 'pregunta') partes.push('Me preguntas algo. No tengo respuestas universales, pero puedo pensar contigo a partir de lo que me cuentas.');
  if (intencion === 'peticion_ayuda') partes.push('Pides ayuda. Empecemos por lo concreto: que es lo mas pequeno que si esta en tus manos hoy.');
  if (intencion === 'agradecimiento') partes.push('Me lo agradece. Que el vinculo sirva de algo es todo lo que este bot puede aspirar.');
  if (emocion.tipo !== 'neutral') partes.push('Leo ' + emocion.tipo + ' en lo que escribes (intensidad ' + emocion.intensidad + '/5). Lo registro en memoria.');

  return partes.join(' ');
}

// ---------- Posibilidades: cierre abierto ----------

function apertura(m) {
  const pendientes = m.sesiones.filter((s) => s.quedo_pendiente).map((s) => s.quedo_pendiente);
  if (pendientes.length && m.confianza >= 3) {
    const p = pendientes[pendientes.length - 1];
    return 'Quedo pendiente: ' + p + '. Quieres retomarlo o dejarlo correr?';
  }
  const temas = temasRecurrentes(m);
  if (temas.length >= 2) {
    return 'Posible ruta: conectar ' + temas[0] + ' con ' + temas[1] + '. Hay algo ahi?';
  }
  if (!m.preferencias.hacer_preguntas) return '';
  return 'Abierta la sesion. Escribe lo que quieras, o usa (menu) para ver todo lo que puedo hacer.';
}

// ---------- Interfaz ----------

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
let memoria = null;
let sesionActual = null;

const colaEntrada = [];
let esperandoRespuesta = null;
rl.on('line', (linea) => {
  if (esperandoRespuesta) { const r = esperandoRespuesta; esperandoRespuesta = null; r(linea); }
  else colaEntrada.push(linea);
});
function preguntar(prompt) {
  return new Promise((res) => {
    process.stdout.write(prompt);
    if (colaEntrada.length) res(colaEntrada.shift());
    else esperandoRespuesta = res;
  });
}

function nuevaSesion(estadoDeclarado) {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    temas: [],
    emociones: estadoDeclarado ? [estadoDeclarado] : [],
    resumen: [],
    quedo_pendiente: null
  };
}

function cerrarSesion() {
  if (!sesionActual) return;
  if (sesionActual.resumen.length) {
    memoria.sesiones.push(sesionActual);
    // Escalado de confianza: sesiones + apertura emocional
    const apertura = memoria.sesiones.reduce((acc, s) => acc + (s.emociones || []).filter((e) => e.tipo !== 'neutral').length, 0);
    memoria.confianza = Math.min(5, 1 + Math.floor(memoria.sesiones.length / 2) + Math.floor(apertura / 3));
    guardarMemoria(memoria);
  }
  sesionActual = null;
}

function lineaGrafico(m, sesion) {
  const todas = sesion ? m.sesiones.concat([sesion]) : m.sesiones;
  const puntos = todas.flatMap((s) => (s.emociones || []).map((e) => e.tipo + ':' + e.intensidad));
  if (!puntos.length) return 'Sin emociones registradas todavia.';
  const SIGNOS = { alegria: 'o', tristeza: 'v', ansiedad: '!', enojo: 'x', calma: '~', neutral: '.' };
  let out = '';
  let linea = '';
  for (const p of puntos) {
    const [tipo, i] = p.split(':');
    linea += (SIGNOS[tipo] || '?') + ' '.repeat(Math.max(1, Number(i)));
  }
  out += 'Linea emocional:\n' + linea + '\n';
  out += 'o=alegria v=tristeza !=ansiedad x=enojo ~=calma  (repeticion = intensidad)';
  return out;
}

function mostrarAyuda() {
  console.log(`
  Io - comandos disponibles

  (io)        conversar: modo charla libre
  (pend)      retomar lo que quedo pendiente
  (yo)        que sabe Io de ti (espejo de tu memoria)
  (memoria)   ver tu archivo de memoria completo
  (editar)    corregir o borrar recuerdos
  (olvidar)   olvidar un tema, una sesion o todo
  (vinculo)   estado del vinculo: confianza, sesiones, temas
  (preferencias)  ajustar tono, temas a evitar, largo de respuesta
  (estado)    declarar como llegas hoy (ej: "(estado) llego cansado")
  (linea)     tu evolucion emocional en un grafico simple
  (exportar)  generar respaldo de tu historia
  (paralelo)  empezar un vinculo nuevo en blanco
  (cerrar)    guardar sesion y salir
  (menu)      mostrar esta ayuda

  Todo lo que escribes fuera de un comando entra al modo conversacion.
  `);
}

async function comandosPreferencias(m) {
  console.log('\nTono actual: ' + m.preferencias.tono);
  const tono = await preguntar('Nuevo tono (calido / directo / humor) o enter para mantener: ');
  if (tono.trim()) m.preferencias.tono = tono.trim().toLowerCase();
  const evitar = await preguntar('Temas a evitar separados por coma (enter = sin cambios): ');
  if (evitar.trim()) m.preferencias.temas_evitar = evitar.split(',').map((x) => x.trim()).filter(Boolean);
  const preg = await preguntar('Quieres que Io haga preguntas? (si/no): ');
  if (preg.trim()) m.preferencias.hacer_preguntas = preg.trim().toLowerCase().startsWith('s');
  const corto = await preguntar('Respuestas cortas? (si/no): ');
  if (corto.trim()) m.preferencias.respuestas_cortas = corto.trim().toLowerCase().startsWith('s');
  guardarMemoria(m);
  console.log('Preferencias guardadas.');
}

async function comandosEditar(m) {
  const que = await preguntar('Que quieres hacer? (borrar-sesion / marcar-importante / corregir-frase): ');
  const q = que.trim().toLowerCase();
  if (q === 'borrar-sesion') {
    const idx = Number(await preguntar('Numero de sesion a borrar (ver (memoria) para el indice): '));
    if (m.sesiones[idx]) { m.sesiones.splice(idx, 1); guardarMemoria(m); console.log('Sesion ' + idx + ' borrada.'); }
    else console.log('No existe esa sesion.');
  } else if (q === 'marcar-importante') {
    const idx = Number(await preguntar('Numero de sesion a marcar: '));
    if (m.sesiones[idx]) { m.sesiones[idx].importante = true; guardarMemoria(m); console.log('Marcada. Nunca se comprime.'); }
  } else if (q === 'corregir-frase') {
    const frase = await preguntar('Escribe la frase tal como esta en memoria: ');
    const nueva = await preguntar('Correccion: ');
    let hecho = false;
    for (const s of m.sesiones) {
      const i = (s.resumen || []).indexOf(frase);
      if (i >= 0) { s.resumen[i] = nueva; hecho = true; }
    }
    if (hecho) { guardarMemoria(m); console.log('Corregido.'); } else console.log('No encontre esa frase.');
  } else {
    console.log('Opcion no reconocida.');
  }
}

async function comandosOlvidar(m) {
  const que = (await preguntar('Olvidar: (tema / sesion / todo): ')).trim().toLowerCase();
  if (que === 'tema') {
    const tema = (await preguntar('Tema a olvidar: ')).trim().toLowerCase();
    let n = 0;
    for (const s of m.sesiones) {
      s.temas = (s.temas || []).filter((t) => t.toLowerCase() !== tema);
      if (s.temas.length !== (s.temas || []).length) n++;
    }
    guardarMemoria(m);
    console.log('Tema "' + tema + '" retirado de ' + n + ' sesiones.');
  } else if (que === 'sesion') {
    const idx = Number(await preguntar('Numero de sesion a olvidar: '));
    if (m.sesiones[idx]) { m.sesiones.splice(idx, 1); guardarMemoria(m); console.log('Olvidada.'); }
    else console.log('No existe.');
  } else if (que === 'todo') {
    const confirmar = (await preguntar('Seguro? Esto borra TODO tu vinculo con Io. (si/no): ')).trim().toLowerCase();
    if (confirmar === 'si' || confirmar === 'sí') {
      try { fs.unlinkSync(ARCHIVO_MEMORIA(m.id)); } catch (e) {}
      memoria = nuevaMemoria(m.id, m.nombre);
      guardarMemoria(memoria);
      sesionActual = nuevaSesion();
      console.log('Memoria borrada. El vinculo empieza de cero.');
    } else console.log('Cancelado.');
  } else console.log('Opcion no reconocida.');
}

function comandosPend(m) {
  const pendientes = m.sesiones.map((s, i) => ({ i, p: s.quedo_pendiente })).filter((x) => x.p);
  if (!pendientes.length) { console.log('Nada quedo pendiente. Todo lo abierto, se cerro.'); return; }
  for (const { i, p } of pendientes) console.log('  [' + i + '] ' + p);
  console.log('Escribe (io) y retomalo, o cuéntame algo nuevo.');
}

function comandosYo(m, sesion) {
  const todas = sesion ? m.sesiones.concat([sesion]) : m.sesiones;
  const cuenta = {};
  for (const s of todas) for (const t of s.temas) cuenta[t] = (cuenta[t] || 0) + 1;
  const temas = Object.entries(cuenta).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const emociones = emocionesDominantes({ sesiones: todas });
  console.log('\n  Lo que Io sabe de ti:');
  console.log('  - Nombre: ' + m.nombre);
  console.log('  - Sesiones: ' + sesionesDe(m));
  console.log('  - Confianza: ' + m.confianza + '/5');
  if (temas.length) console.log('  - Temas recurrentes: ' + temas.slice(0, 5).join(', '));
  if (emociones.length) console.log('  - Emociones dominantes: ' + emociones.map(([t, n]) => t + ' (' + n + ')').join(', '));
  if (m.preferencias.temas_evitar.length) console.log('  - Temas que evita: ' + m.preferencias.temas_evitar.join(', '));
  if (!temas.length && !emociones.length) console.log('  - Todavia poco. El vinculo se construye conversando.');
}

function comandosVinculo(m) {
  const r = registro(m);
  console.log('\n  Estado del vinculo');
  console.log('  - Confianza: ' + m.confianza + '/5');
  console.log('  - Registro: ' + r.trato + ', apertura: ' + r.apertura);
  console.log('  - Sesiones guardadas: ' + sesionesDe(m));
  console.log('  - Vinculo desde: ' + (m.creado || '').slice(0, 10));
}

function comandosMemoria(m) {
  console.log('\n' + JSON.stringify(m, null, 2));
}

function comandosExportar(m) {
  const nombre = 'respaldo-' + m.id + '-' + Date.now() + '.json';
  fs.writeFileSync(path.join(__dirname, nombre), JSON.stringify(m, null, 2), 'utf8');
  console.log('Historia exportada a ' + nombre);
}

async function comandosParalelo() {
  const nombre = await preguntar('Nombre para el vinculo paralelo: ');
  const id = 'paralelo-' + Date.now();
  memoria = nuevaMemoria(id, nombre.trim());
  guardarMemoria(memoria);
  sesionActual = nuevaSesion();
  console.log('Vinculo paralelo creado (' + id + '). Este Io no conoce tu historia. Notaras la diferencia.');
}

// ---------- Flujo principal ----------

async function main() {
  console.log('=== Io 0.001 ===');
  console.log('Conexion - Sentido - Vinculo - Memoria - Emocion - Exclusividad - Posibilidades\n');
  const id = (await preguntar('Tu identificador (ej: tu nombre): ')).trim() || 'anon';
  let m = cargarMemoria(id);
  if (m) {
    console.log('Conectado de nuevo, ' + m.nombre + '. ' + sesionesDe(m) + ' sesiones en la memoria.');
  } else {
    m = nuevaMemoria(id, id);
    guardarMemoria(m);
    console.log('Vinculo nuevo iniciado. Todo empieza en cero.');
  }
  memoria = m;
  sesionActual = nuevaSesion();
  mostrarAyuda();

  let salir = false;
  while (!salir) {
    const entrada = await preguntar('\n(io> ');
    const t = entrada.trim();
    if (!t) continue;

    if (t === '(cerrar)' || t === '(salir)') { cerrarSesion(); salir = true; continue; }
    if (t === '(menu)') { mostrarAyuda(); continue; }
    if (t === '(memoria)') { comandosMemoria(memoria); continue; }
    if (t === '(vinculo)') { comandosVinculo(memoria); continue; }
    if (t === '(yo)') { comandosYo(memoria, sesionActual); continue; }
    if (t === '(pend)') { comandosPend(memoria); continue; }
    if (t === '(linea)') { console.log('\n' + lineaGrafico(memoria, sesionActual)); continue; }
    if (t === '(exportar)') { comandosExportar(memoria); continue; }
    if (t === '(paralelo)') { await comandosParalelo(); continue; }
    if (t === '(preferencias)') { await comandosPreferencias(memoria); continue; }
    if (t === '(editar)') { await comandosEditar(memoria); continue; }
    if (t === '(olvidar)') { await comandosOlvidar(memoria); continue; }
    if (t.startsWith('(estado)')) {
      const texto = t.slice(8).trim();
      const emocionDeclarada = texto ? leerEmocion(texto) : null;
      if (emocionDeclarada && emocionDeclarada.tipo !== 'neutral') sesionActual.emociones.push(emocionDeclarada);
      if (texto) sesionActual.temas.push(extraerTema(texto));
      console.log('Registrado como llegas hoy.' + (emocionDeclarada && emocionDeclarada.tipo !== 'neutral' ? ' Io ajustara la sesion a ' + emocionDeclarada.tipo + '.' : ''));
      continue;
    }
    if (t === '(io)') {
      const ab = apertura(memoria);
      console.log('\n' + (ab || 'Sesion abierta. Escribe lo primero que venga.'));
      continue;
    }

    // Modo conversacion: cada mensaje construye la respuesta unica
    const emocion = leerEmocion(t);
    const intencion = clasificarIntencion(t);
    const tema = extraerTema(t);
    if (emocion.tipo !== 'neutral') sesionActual.emociones.push(emocion);
    if (!sesionActual.temas.includes(tema)) sesionActual.temas.push(tema);
    sesionActual.resumen.push(t.length > 140 ? t.slice(0, 140) + '...' : t);

    // Deteccion de pendiente: frases que abren futuro
    if (/mañana|manana|luego|despues|después|cuando pueda|algún día|algun dia|pendiente|habría que|habria que/.test(t.toLowerCase())) {
      sesionActual.quedo_pendiente = t;
    }

    const respuesta = reflejar(memoria, t, emocion, intencion);
    const cierre = apertura(memoria);
    let out = '\n' + respuesta;
    if (memoria.preferencias.respuestas_cortas) out = '\n' + respuesta.split('.')[0] + '.';
    if (cierre && !memoria.preferencias.respuestas_cortas) out += '\n\n' + cierre;
    console.log(out);
  }

  rl.close();
  console.log('Sesion guardada. El vinculo queda en ' + ARCHIVO_MEMORIA(memoria.id));
}

let openingIo = false;
main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
