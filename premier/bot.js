const fs = require('fs');
const path = require('path');
const readline = require('readline');

class PremierBot {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.partidos = this.cargar('partidos.json', { partidos: [] }).partidos;
    this.equipos = this.cargar('equipos.json', { equipos: [] }).equipos;
    this.rl = null;
  }

  cargar(nombre, porDefecto) {
    const archivo = path.join(this.dataDir, nombre);
    try {
      if (fs.existsSync(archivo)) {
        return JSON.parse(fs.readFileSync(archivo, 'utf8'));
      }
    } catch (e) {
      console.log('Error leyendo ' + nombre + ': ' + e.message);
    }
    return porDefecto;
  }

  guardar() {
    fs.writeFileSync(path.join(this.dataDir, 'partidos.json'), JSON.stringify({ partidos: this.partidos }, null, 2));
    console.log('Datos guardados.');
  }

  mostrarEquipos() {
    console.log('\n=== EQUIPOS DE LA PREMIER LEAGUE ===');
    this.equipos.forEach((e, i) => console.log((i + 1) + '. ' + e));
    console.log('Total: ' + this.equipos.length + ' equipos');
  }

  listarPartidos() {
    console.log('\n=== PARTIDOS REGISTRADOS ===');
    if (this.partidos.length === 0) { console.log('No hay partidos.'); return; }
    this.partidos.forEach((p, i) => {
      console.log((i + 1) + '. J' + p.jornada + ' | ' + p.local + ' ' + p.goles_local + '-' + p.goles_visitante + ' ' + p.visitante +
        ' | Amar:' + (p.tarjetas_amarillas_local + p.tarjetas_amarillas_visitante) +
        ' Corners:' + (p.corners_local + p.corners_visitante) +
        ' Offsides:' + (p.offsides_local + p.offsides_visitante));
    });
  }

  statsEquipo(equipo) {
    let jug = 0, gf = 0, gc = 0, vict = 0, emp = 0, der = 0;
    let amar = 0, corn = 0, off = 0;
    this.partidos.forEach(p => {
      const esLocal = p.local === equipo;
      const esVis = p.visitante === equipo;
      if (!esLocal && !esVis) return;
      jug++;
      const gfP = esLocal ? p.goles_local : p.goles_visitante;
      const gcP = esLocal ? p.goles_visitante : p.goles_local;
      gf += gfP; gc += gcP;
      if (gfP > gcP) vict++; else if (gfP === gcP) emp++; else der++;
      amar += esLocal ? p.tarjetas_amarillas_local : p.tarjetas_amarillas_visitante;
      corn += esLocal ? p.corners_local : p.corners_visitante;
      off += esLocal ? p.offsides_local : p.offsides_visitante;
    });
    return { jug, gf, gc, vict, emp, der, amar, corn, off };
  }

  mostrarStats() {
    console.log('\n=== ESTADISTICAS POR EQUIPO ===');
    if (this.partidos.length === 0) { console.log('No hay partidos.'); return; }
    this.equipos.forEach(e => {
      const s = this.statsEquipo(e);
      if (s.jug === 0) return;
      console.log(e + ': PJ:' + s.jug + ' V/E/D ' + s.vict + '/' + s.emp + '/' + s.der +
        ' GF:' + s.gf + ' GC:' + s.gc +
        ' Amar:' + (s.amar / s.jug).toFixed(1) +
        ' Corn:' + (s.corn / s.jug).toFixed(1) +
        ' Off:' + (s.off / s.jug).toFixed(1));
    });
  }

  predecir(local, visitante) {
    const sl = this.statsEquipo(local);
    const sv = this.statsEquipo(visitante);
    if (sl.jug === 0 || sv.jug === 0) {
      console.log('Faltan datos para uno de los equipos.');
      return;
    }
    const golesLocal = (sl.gf / sl.jug + sv.gc / sv.jug) / 2;
    const golesVis = (sv.gf / sv.jug + sl.gc / sl.jug) / 2;
    const totalGoles = golesLocal + golesVis;
    const amarillas = (sl.amar / sl.jug + sv.amar / sv.jug);
    const corners = (sl.corn / sl.jug + sv.corn / sv.jug);
    const offsides = (sl.off / sl.jug + sv.off / sv.jug);

    let resultado;
    if (golesLocal > golesVis + 0.3) resultado = 'Gana ' + local;
    else if (golesVis > golesLocal + 0.3) resultado = 'Gana ' + visitante;
    else resultado = 'Empate o partido muy igualado';

    let overUnder = totalGoles >= 2.5 ? 'Over 2.5 goles' : 'Under 2.5 goles';

    console.log('\n========================================');
    console.log('  PREDICCION: ' + local + ' vs ' + visitante);
    console.log('========================================');
    console.log('Resultado esperado: ' + resultado);
    console.log('Goles estimados: ' + local + ' ' + golesLocal.toFixed(1) + ' - ' + golesVis.toFixed(1) + ' ' + visitante);
    console.log('Total goles: ' + totalGoles.toFixed(1) + '  ->  ' + overUnder);
    console.log('Tarjetas amarillas totales: ~' + amarillas.toFixed(1));
    console.log('Corners totales: ~' + corners.toFixed(1));
    console.log('Offsides totales: ~' + offsides.toFixed(1));
    console.log('----------------------------------------');
    console.log('Notas: Las predicciones se basan en promedios');
    console.log('historicos. Combina con cuotas y noticias.');
    console.log('========================================\n');
  }

  menuPredecir() {
    this.rl.question('Equipo local: ', (local) => {
      this.rl.question('Equipo visitante: ', (visitante) => {
        local = local.trim(); visitante = visitante.trim();
        if (!this.equipos.includes(local) || !this.equipos.includes(visitante)) {
          console.log('Equipo no reconocido. Revisa el nombre en la lista de equipos.');
        } else {
          this.predecir(local, visitante);
        }
        this.menu();
      });
    });
  }

  agregarPartido() {
    const campos = [
      ['temporada', 'Temporada (ej 2024-25): ', '2024-25'],
      ['jornada', 'Jornada: ', 1],
      ['local', 'Local: ', 'Arsenal'],
      ['visitante', 'Visitante: ', 'Chelsea'],
      ['goles_local', 'Goles local: ', 0],
      ['goles_visitante', 'Goles visitante: ', 0],
      ['tarjetas_amarillas_local', 'Amarillas local: ', 0],
      ['tarjetas_amarillas_visitante', 'Amarillas visitante: ', 0],
      ['corners_local', 'Corners local: ', 0],
      ['corners_visitante', 'Corners visitante: ', 0],
      ['offsides_local', 'Offsides local: ', 0],
      ['offsides_visitante', 'Offsides visitante: ', 0]
    ];
    const numericos = ['jornada', 'goles_local', 'goles_visitante', 'tarjetas_amarillas_local', 'tarjetas_amarillas_visitante', 'corners_local', 'corners_visitante', 'offsides_local', 'offsides_visitante'];
    const p = {};
    let i = 0;
    const siguiente = () => {
      if (i >= campos.length) {
        this.partidos.push(p);
        if (!this.equipos.includes(p.local)) this.equipos.push(p.local);
        if (!this.equipos.includes(p.visitante)) this.equipos.push(p.visitante);
        fs.writeFileSync(path.join(this.dataDir, 'equipos.json'), JSON.stringify({ equipos: this.equipos }, null, 2));
        this.guardar();
        console.log('Partido agregado.');
        return this.menu();
      }
      const item = campos[i];
      const clave = item[0];
      const mensaje = item[1];
      const porDefecto = item[2];
      this.rl.question(mensaje, (r) => {
        const v = r.trim();
        p[clave] = numericos.includes(clave) ? (parseInt(v) || porDefecto) : (v || porDefecto);
        i++;
        siguiente();
      });
    };
    siguiente();
  }

  menu() {
    console.log('\n===== BOT PREMIER LEAGUE =====');
    console.log('1. Listar equipos');
    console.log('2. Listar partidos');
    console.log('3. Ver estadisticas');
    console.log('4. Predecir partido');
    console.log('5. Agregar partido');
    console.log('6. Salir');
    this.rl.question('Opcion: ', (op) => {
      op = op.trim();
      switch (op) {
        case '1': this.mostrarEquipos(); this.menu(); break;
        case '2': this.listarPartidos(); this.menu(); break;
        case '3': this.mostrarStats(); this.menu(); break;
        case '4': this.menuPredecir(); break;
        case '5': this.agregarPartido(); break;
        case '6': console.log('Hasta pronto!'); this.rl.close(); break;
        default: console.log('Opcion no valida.'); this.menu();
      }
    });
  }

  iniciar() {
    console.log('\n=== BOT PREMIER LEAGUE ===');
    console.log('Analiza y predice: resultados, goles,');
    console.log('tarjetas amarillas, corners y offsides.\n');
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    this.menu();
  }
}

module.exports = PremierBot;

if (require.main === module) {
  new PremierBot().iniciar();
}
