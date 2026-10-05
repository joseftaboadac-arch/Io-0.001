// Modelo de prediccion: Poisson bivariado sobre promedios de equipo

const MAX_GOLES = 6;
const VENTAJA_LOCAL = 1.10;
const FACTOR_VISITANTE = 0.95;

function poisson(k, lambda) {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

function predecir(local, visitante) {
  const golesLocal = ((local.ataque + visitante.defensa) / 2) * VENTAJA_LOCAL;
  const golesVisitante = ((visitante.ataque + local.defensa) / 2) * FACTOR_VISITANTE;
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

module.exports = { predecir, poisson };
