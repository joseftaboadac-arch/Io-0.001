# Tennis Bot - Especialista en Piso Duro

🎾 **Bot de apuestas de tenis especializado en superficie de piso duro**

Este es un sistema completo para analizar y gestionar apuestas de tenis con enfoque exclusivo en partidos que se juegan en **piso duro** (hard court). El sistema analiza todos los tipos de apuestas disponibles: **Match Winner, Handicap, Over/Under, Correct Score, First Set Winner, Total Sets, Total Games, Ace Count, Tiebreak Winner**, y más.

## 🚀 Características Principales

### 🎯 Análisis Especializado en Piso Duro
- **Enfoque 100% en piso duro**: Todos los análisis, estadísticas y predicciones están optimizados para esta superficie
- **Base de datos de jugadores**: Información completa de los mejores jugadores en piso duro
- **Historial de partidos**: Seguimiento de partidos jugados en todas las superficies
- **Estadísticas avanzadas**: Win rate por superficie, forma actual, head-to-head, y más

### 📊 Tipos de Apuestas Soportados

#### Apuestas de Partido
- **Match Winner**: Ganador del partido
- **Handicap**: Ventaja/desventaja de juegos o sets
- **Over/Under**: Total de juegos, sets o aces
- **Correct Score**: Resultado exacto del partido
- **First Set Winner**: Ganador del primer set
- **First Set Score**: Resultado exacto del primer set
- **Tiebreak Winner**: Ganador del tie-break

#### Apuestas Especiales
- **Ace Count**: Número de aces en el partido
- **Double Fault Count**: Número de dobles faltas
- **Break Point Conversion**: Conversión de break points

#### Apuestas en Vivo
- **Live Match Winner**: Ganador del partido en vivo
- **Live Next Game**: Próximo juego en vivo
- **Live Next Set**: Próximo set en vivo

### 🧠 Motor de Predicciones
- **Análisis de enfrentamientos**: Comparación detallada entre dos jugadores
- **Predicción de resultados**: Probabilidades de ganador, sets, tie-breaks
- **Recomendaciones inteligentes**: Sugerencias de apuestas basadas en estadísticas
- **Análisis de valor**: Determina si una apuesta tiene valor positivo

### 💰 Gestión de Apuestas
- **Creación de apuestas**: Todos los tipos de apuestas disponibles
- **Seguimiento de apuestas**: Estado, ganancias, pérdidas
- **Bet Slips**: Grupos de apuestas combinadas
- **Estadísticas de apuestas**: Win rate, ROI, beneficio neto
- **Historial completo**: Registro de todas las apuestas realizadas

### 📱 Interfaz para Móvil
- **CLI optimizada**: Diseñada para uso en terminal móvil
- **Navegación sencilla**: Menús intuitivos y comandos simples
- **Información clara**: Visualización adaptada a pantallas pequeñas

### 🔄 Sistema de Actualización
- **Actualización automática**: Configurable por intervalos
- **Fuentes múltiples**: APIs externas y archivos locales
- **Sincronización**: Guarda y carga datos desde archivos JSON
- **Datos de ejemplo**: Carga rápida de datos para pruebas

## 📥 Instalación

### Requisitos
- Node.js 14+ (recomendado Node.js 18+)
- npm o yarn
- Terminal o emulador de terminal (para uso en móvil)

### Pasos de instalación

```bash
# Clonar el repositorio
git clone https://github.com/joseftaboadac-arch/Io-0.001.git
cd Io-0.001

# Instalar dependencias
npm install

# Opcional: Instalar chalk para colores (mejora la experiencia)
npm install chalk
```

## 🚀 Uso

### Iniciar el Bot

```bash
# Iniciar el bot
npm start

# O
node src/index.js
```

### Comandos Básicos

Una vez iniciado el bot, verás el menú principal con las siguientes opciones:

```
=== MENU PRINCIPAL ===

1. Jugadores
2. Partidos
3. Análisis de enfrentamientos
4. Gestión de apuestas
5. Estadísticas
6. Actualizar datos
7. Configuración
8. Salir
```

### Navegación

- **Usa números** (1-8) para seleccionar opciones del menú
- **Usa nombres de comandos**: `jugadores`, `partidos`, `analizar`, `apuestas`, etc.
- **Usa `volver` o `back`** para retroceder en los menús
- **Usa `salir` o `exit`** para salir de la aplicación
- **Usa `menu`** para volver al menú principal
- **Usa `ayuda`** para mostrar ayuda

## 🎯 Guía de Uso

### 1. Jugadores

```
=== JUGADORES ===

1. Listar todos los jugadores
2. Buscar jugador
3. Top jugadores en piso duro
4. Detalles de un jugador
5. Volver al menú principal
```

- **Listar jugadores**: Muestra todos los jugadores con su ranking y win rate en piso duro
- **Buscar jugador**: Encuentra jugadores por nombre
- **Top jugadores**: Muestra los mejores jugadores en piso duro ordenados por win rate
- **Detalles**: Información completa de un jugador (estadísticas, forma actual, historial)

### 2. Partidos

```
=== PARTIDOS ===

1. Listar todos los partidos
2. Partidos de piso duro
3. Partidos futuros
4. Partidos completados
5. Buscar partido por torneo
6. Detalles de un partido
7. Volver al menú principal
```

- **Partidos de piso duro**: Filtra solo partidos en esta superficie
- **Partidos futuros**: Partidos programados para apostar
- **Detalles de partido**: Información completa incluyendo jugadores, odds, resultado

### 3. Análisis de Enfrentamientos

```
=== ANÁLISIS DE ENFRENTAMIENTOS ===

1. Analizar partido existente
2. Comparar dos jugadores
3. Ver recomendaciones
4. Analizar valor de apuesta
5. Volver al menú principal
```

- **Analizar partido**: Predicciones detalladas para un partido específico
- **Comparar jugadores**: Análisis head-to-head entre dos jugadores
- **Recomendaciones**: Sugerencias automáticas de apuestas
- **Análisis de valor**: Determina si una apuesta tiene valor positivo

### 4. Gestión de Apuestas

```
=== GESTIÓN DE APUESTAS ===

1. Crear nueva apuesta
2. Listar mis apuestas
3. Ver apuestas pendientes
4. Ver apuestas ganadas
5. Ver apuestas perdidas
6. Ver estadísticas de apuestas
7. Volver al menú principal
```

- **Crear apuesta**: Selecciona partido, tipo de apuesta, selección, odds y cantidad
- **Mis apuestas**: Historial de tus apuestas
- **Estadísticas**: Win rate, ROI, beneficio neto

### 5. Estadísticas

Muestra estadísticas generales:
- Estadísticas de piso duro (partidos, aces, dobles faltas)
- Top jugadores en piso duro
- Estadísticas de apuestas (win rate, ROI, beneficio neto)

### 6. Actualizar Datos

```
=== ACTUALIZAR DATOS ===

1. Actualizar desde archivos locales
2. Cargar datos de ejemplo
3. Guardar datos en archivos
4. Volver al menú principal
```

- **Archivos locales**: Carga datos desde archivos JSON
- **Datos de ejemplo**: Carga jugadores y partidos de ejemplo para pruebas
- **Guardar datos**: Exporta todos los datos a archivos JSON

### 7. Configuración

```
=== CONFIGURACIÓN ===

1. Configurar usuario
2. Configurar actualización automática
3. Volver al menú principal
```

- **Configurar usuario**: Establece tu nombre de usuario para el seguimiento de apuestas
- **Actualización automática**: Configura intervalos de actualización (ej: cada 60 minutos)

## 📱 Uso en Móvil

### Requisitos para móvil
1. **Aplicación de terminal**: Necesitas una app de terminal en tu móvil
   - **Android**: Termux (recomendado), Termius, o JuiceSSH
   - **iOS**: Termius, or a-Shell

2. **Node.js en móvil**:
   - **Termux (Android)**:
     ```bash
     pkg install nodejs
     ```
   - **Otras apps**: Verifica si soportan Node.js

### Pasos para usar en Termux (Android)

```bash
# 1. Instalar Termux desde F-Droid (recomendado)
# 2. Abrir Termux y actualizar paquetes
pkg update && pkg upgrade

# 3. Instalar Node.js
pkg install nodejs

# 4. Clonar el repositorio
git clone https://github.com/joseftaboadac-arch/Io-0.001.git
cd Io-0.001

# 5. Instalar dependencias
npm install

# 6. Iniciar el bot
npm start
```

### Consejos para móvil
- **Usa el teclado**: La navegación por menús es más fácil con el teclado
- **Comandos cortos**: Usa números en lugar de nombres completos
- **Pantalla vertical**: La interfaz está optimizada para este formato
- **Zoom**: Ajusta el zoom de tu terminal para mejor visualización

## 🎾 Datos de Ejemplo

El sistema incluye datos de ejemplo de los mejores jugadores de tenis en piso duro:

### Jugadores Incluidos
- Novak Djokovic
- Carlos Alcaraz
- Daniil Medvedev
- Jannik Sinner
- Andrey Rublev
- Stefanos Tsitsipas
- Alexander Zverev
- Casper Ruud
- Taylor Fritz
- Frances Tiafoe

### Torneos de Piso Duro
- Australian Open
- US Open
- Indian Wells
- Miami Open
- Madrid Open
- Cincinnati Masters
- Shanghai Masters
- Paris Masters
- Y muchos más...

## 📊 Estadísticas y Análisis

### Factores Considerados en las Predicciones

1. **Win Rate en Piso Duro**: Porcentaje de victorias en esta superficie
2. **Win Rate General**: Porcentaje de victorias en todas las superficies
3. **Ranking ATP**: Posición actual en el ranking
4. **Forma Actual**: Resultados de los últimos 5 partidos
5. **Head-to-Head**: Historial entre los dos jugadores
6. **Estadísticas de Servicio**: Porcentaje de primer servicio, puntos ganados con servicio
7. **Estadísticas de Retorno**: Puntos ganados en el retorno
8. **Conversión de Break Points**: Efectividad en puntos de break

### Tipos de Recomendaciones

El sistema genera recomendaciones con diferentes niveles de confianza:
- **Alta confianza**: Diferencia de probabilidad > 25%
- **Confianza media**: Diferencia de probabilidad 10-25%
- **Baja confianza**: Diferencia de probabilidad < 10%

## 💡 Consejos para Apuestas

### Estrategias Recomendadas

1. **Siempre analiza el valor**: Usa la función de análisis de valor para identificar apuestas con valor positivo
2. **Enfócate en piso duro**: Este bot está especializado en esta superficie
3. **Considera la forma actual**: Los jugadores en buena forma tienen mejor rendimiento
4. **Revisa el head-to-head**: Algunos jugadores tienen buen historial contra otros
5. **Gestiona tu bankroll**: No apuestes más de lo que puedes permitirte perder

### Tipos de Apuestas Recomendados

- **Match Winner**: Para partidos con claro favorito
- **Total Sets Over 2.5**: Cuando ambos jugadores tienen buen win rate
- **First Set Winner**: Para jugadores con buen inicio
- **Total Games Over**: Para partidos entre jugadores defensivos

## 🔧 Personalización

### Configurar API Keys

El sistema soporta integración con APIs externas:

```javascript
// En tu código
const dataUpdater = new DataUpdater(analyzer, betManager);
dataUpdater.configureApiKeys({
  atp: 'tu_api_key_atp',
  itf: 'tu_api_key_itf',
  odds: 'tu_api_key_odds'
});
```

### Configurar Actualización Automática

```javascript
// Actualizar cada 30 minutos
dataUpdater.setAutoUpdate(30);

// Detener actualización automática
dataUpdater.stopAutoUpdate();
```

## 📁 Estructura del Proyecto

```
tennis-betting-bot/
├── src/
│   ├── config/
│   │   └── constants.js       # Constantes del sistema
│   ├── models/
│   │   ├── Player.js          # Modelo de jugador
│   │   ├── Match.js           # Modelo de partido
│   │   └── Bet.js             # Modelo de apuesta
│   ├── services/
│   │   ├── TennisAnalyzer.js  # Analizador de tenis
│   │   ├── BetManager.js      # Gestor de apuestas
│   │   └── DataUpdater.js     # Actualizador de datos
│   ├── cli/
│   │   ├── TennisBotCLI.js    # CLI principal
│   │   ├── TennisBotCLI_part2.js
│   │   ├── TennisBotCLI_part3.js
│   │   └── TennisBotCLI_part4.js
│   └── index.js               # Punto de entrada
├── data/                     # Datos locales (se crea automáticamente)
│   ├── players.json
│   ├── matches.json
│   └── bets.json
├── package.json
└── README.md
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz un fork del proyecto
2. Crea una rama con tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📜 Licencia

MIT License - Copyright (c) 2024 Tennis Bot Team

## 🙏 Agradecimientos

- ATP Tour por los datos de tenis
- A todos los desarrolladores de Node.js y las librerías utilizadas
- A la comunidad de apuestas deportivas por su feedback

---

**¡Disfruta usando el Tennis Bot y que tengas buenas apuestas en piso duro! 🎾💰**
