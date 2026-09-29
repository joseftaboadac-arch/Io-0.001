const readline = require('readline');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'fifa-dates.json');

function isoInDays(days, hour = 16) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

const DEFAULT_DATES = [
  { id: 'wc-final-2026', nombre: 'Final Mundial FIFA 2026', fecha: isoInDays(15, 19), tipo: 'mundial', sede: 'MetLife Stadium, Nueva Jersey' },
  { id: 'wc-semifinal-2026', nombre: 'Semifinales Mundial FIFA 2026', fecha: isoInDays(9, 19), tipo: 'mundial', sede: 'Dallas y Atlanta' },
  { id: 'wc-cuartos-2026', nombre: 'Cuartos de final Mundial FIFA 2026', fecha: isoInDays(5, 17), tipo: 'mundial', sede: 'Estados Unidos' },
  { id: 'wc-octavos-2026', nombre: 'Octavos de final Mundial FIFA 2026', fecha: isoInDays(1, 17), tipo: 'mundial', sede: 'Estados Unidos, Mexico, Canada' },
  { id: 'fifa-ventana-octubre', nombre: 'Ventana FIFA de amistosos (octubre)', fecha: isoInDays(34, 16), tipo: 'amistoso', sede: 'Internacional' }
];

class FifaDatesBot {
  constructor(dataFile = DATA_FILE) {
    this.dataFile = dataFile;
    this.dates = [];
    this.rl = null;
  }

  load() {
    try {
      this.dates = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
    } catch (error) {
      this.dates = [...DEFAULT_DATES];
      this.save();
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
    fs.writeFileSync(this.dataFile, JSON.stringify(this.dates, null, 2));
  }

  getNext(limit = 5) {
    const now = new Date();
    return this.dates
      .map((d) => ({ ...d, fechaObj: new Date(d.fecha) }))
      .filter((d) => d.fechaObj > now)
      .sort((a, b) => a.fechaObj - b.fechaObj)
      .slice(0, limit);
  }

  daysUntil(dateStr) {
    const ms = new Date(dateStr).getTime() - Date.now();
    return {
      dias: Math.floor(ms / 86400000),
      horas: Math.floor((ms % 86400000) / 3600000),
      minutos: Math.floor((ms % 3600000) / 60000)
    };
  }

  addDate(nombre, fecha, tipo = 'partido', sede = 'Por definir') {
    if (isNaN(new Date(fecha).getTime())) return false;
    const id = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + Date.now().toString(36);
    this.dates.push({ id, nombre, fecha, tipo, sede });
    this.save();
    return true;
  }

  removeDate(idOrNombre) {
    const before = this.dates.length;
    this.dates = this.dates.filter(
      (d) => d.id !== idOrNombre && !d.nombre.toLowerCase().includes(idOrNombre.toLowerCase())
    );
    this.save();
    return before - this.dates.length;
  }

  printDate(d) {
    const t = this.daysUntil(d.fecha);
    console.log(`\n  ${d.nombre} [${d.tipo}]`);
    console.log(`  Fecha: ${new Date(d.fecha).toLocaleString('es')} | Sede: ${d.sede}`);
    console.log(`  Faltan: ${t.dias} dias, ${t.horas} horas y ${t.minutos} minutos`);
  }

  start() {
    this.load();
    console.log('\n=== FIFA FECHAS BOT ===\n');
    console.log('Bot de fechas FIFA: mundiales, clasificatorias, sorteos y mas.');
    console.log('Comandos: proximo, calendario, agregar, eliminar, hoy, ayuda, salir\n');

    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'fifa> ' });
    this.rl.prompt();

    this.rl.on('line', (line) => {
      const input = line.trim().toLowerCase();
      switch (input) {
        case 'proximo':
          this.getNext(1).forEach((d) => this.printDate(d));
          if (!this.getNext(1).length) console.log('No hay fechas futuras.');
          break;
        case 'calendario':
          this.getNext(10).forEach((d) => this.printDate(d));
          break;
        case 'hoy': {
          const today = new Date().toISOString().slice(0, 10);
          const matches = this.dates.filter((d) => d.fecha.slice(0, 10) === today);
          matches.length ? matches.forEach((d) => this.printDate(d)) : console.log('Hoy no hay fechas FIFA registradas.');
          break;
        }
        case 'agregar':
          this.rl.question('Nombre del evento: ', (nombre) => {
            this.rl.question('Fecha (YYYY-MM-DD o ISO): ', (fecha) => {
              this.rl.question('Tipo (mundial/clasificacion/evento/amistoso/partido): ', (tipo) => {
                this.rl.question('Sede: ', (sede) => {
                  const ok = this.addDate(nombre, fecha, tipo || 'partido', sede || 'Por definir');
                  console.log(ok ? 'Fecha agregada.' : 'Fecha invalida.');
                  this.rl.prompt();
                });
              });
            });
          });
          break;
        case 'eliminar':
          this.rl.question('ID o nombre del evento a eliminar: ', (q) => {
            const n = this.removeDate(q);
            console.log(n > 0 ? `Eliminadas ${n} fecha(s).` : 'No se encontro la fecha.');
            this.rl.prompt();
          });
          break;
        case 'ayuda':
          console.log('Comandos: proximo, calendario, hoy, agregar, eliminar, salir');
          break;
        case 'salir':
        case 'exit':
          this.rl.close();
          return;
        default:
          if (input) console.log('Comando no reconocido. Escribe "ayuda".');
      }
      this.rl.prompt();
    }).on('close', () => {
      console.log('Hasta luego.');
      process.exit(0);
    });
  }
}

if (require.main === module) {
  new FifaDatesBot().start();
}

module.exports = FifaDatesBot;
