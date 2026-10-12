# IoTrendRobot - Robot de Trading para MetaTrader 5

Robot de trading algorítmico (Expert Advisor) para MetaTrader 5 basado en la estrategia con mejor respaldo documentado: **seguimiento de tendencia con filtros**.

- **Archivo**: `mt5/IoTrendRobot.mq5` (MQL5, un solo archivo, sin dependencias externas)
- **Activos recomendados**: EURUSD, GBPUSD, XAUUSD (oro)
- **Temporalidades recomendadas**: H1 o H4 (más estable que M5/M15)

> ⚠️ Ningún robot garantiza ganancias. Trading implica riesgo de pérdida total del capital. Úsalo primero **solo en cuenta demo** durante al menos 1-2 meses.

---

## 1. Estudio de estrategias: qué se investigó y qué se eligió

Se analizaron las estrategias más utilizadas y con resultados positivos documentados en backtests independientes (QuantifiedStrategies, MQL5 Articles, ForexTester, backtests públicos de EAs):

| Estrategia | Qué es | Resultados documentados | Veredicto |
|---|---|---|---|
| **Seguimiento de tendencia (EMA cruce + filtros)** | Opera a favor de la tendencia con medias exponenciales | Profit factor 1.2-1.6 en backtests multi-activo; ~67% win rate con filtros; la más usada por EAs comerciales exitosos | ✅ **Elegida** |
| RSI reversión a la media | Compra sobreventa, vende sobrecompra | Funciona en rangos, falla en tendencias fuertes | Parcial: usado como **filtro** |
| ADX fuerza de tendencia | Mide si hay tendencia real | Filtra el 60-70% de señales falsas en mercado lateral | Parcial: usado como **filtro** |
| Bollinger / ruptura de rango | Rupturas de volatilidad | Bueno en oro, irregular en forex | Descartada (más sensible al broker) |
| Scalping M1-M5 | Muchas operaciones pequeñas | Comisiones/spread destruyen el borde en la mayoría de retail | Descartada |
| Martingala / grids | Doblar tras perder | Backtests "perfectos" hasta que queman la cuenta | ❌ Descartada (riesgo total) |

### La estrategia del robot (por qué es sólida)

Un cruce EMA 20/50 solo genera muchas señales falsas en mercado lateral. Los backtests muestran que **los filtros son los que convierten una estrategia perdedora en ganadora**. El robot implementa exactamente eso:

**Entrada COMPRA** (todas deben cumplirse):
1. EMA 20 cruza **hacia arriba** la EMA 50 (nueva tendencia alcista)
2. Precio por **encima** de la EMA 200 (solo compramos a favor de la tendencia mayor)
3. ADX ≥ 22 (hay tendencia real, no mercado lateral)
4. RSI < 70 (no compramos en sobrecompra extrema)

**Entrada VENTA**: lo espejo (cruce bajista, precio bajo EMA200, ADX ≥ 22, RSI > 30).

**Salidas** (múltiples capas de protección):
- **Stop Loss = 1.5 × ATR** (se adapta a la volatilidad; nunca un SL fijo en puntos)
- **Take Profit = 3.0 × ATR** → ratio riesgo:beneficio de **1:2** (una ganancia paga dos pérdidas)
- **Trailing stop de 1.5 × ATR** que se activa tras ganar 1 × ATR: protege ganancias en tendencias largas
- **Cierre por señal opuesta**: si la tendencia se invierte, cierra antes de que toque el SL
- **Límite de pérdida diaria** (por defecto 3%): si pierdes 3% en un día, el robot se detiene hasta mañana

**Tamaño de posición**: arriesga exactamente **1% del balance por operación** (valor por defecto, el estándar profesional). Calcula el lote automáticamente según la distancia del SL.

---

## 2. Cómo instalarlo en tu COMPUTADORA (recomendado) ✅

Esta es la forma **más fácil y completa**, porque en PC tienes el MetaEditor (editor/compilador), el Probador de Estrategias (backtest) y el control total. Tarda ~10 minutos.

### Paso 1: Descarga MetaTrader 5
- Descarga MT5 gratis desde el sitio de tu broker (cualquier broker con MT5: Exness, IC Markets, XM, Pepperstone, etc.) o desde [metatrader5.com](https://www.metatrader5.com).
- Instala e inicia sesión con tu cuenta (te recomiendo empezar con **cuenta demo**).

### Paso 2: Copia el archivo del robot
1. En MT5, abre la pestaña **Archivo → Abrir carpeta de datos** (o `Ctrl+Shift+D` en el Navegador).
2. Entra a la carpeta: `MQL5 → Experts`.
3. Copia ahí el archivo `IoTrendRobot.mq5` de este repositorio.

### Paso 3: Compílalo (convierte el texto en programa)
1. En MT5 presiona **F4** (abre el MetaEditor).
2. En el panel izquierdo, busca `Experts → IoTrendRobot.mq5`, ábrelo.
3. Presiona **F7** (Compilar). Debe decir `0 errors, 0 warnings`.
4. Vuelve a MT5. En el **Navegador** (Ctrl+N) → Expert Advisors → haz clic derecho → **Actualizar**. Verás `IoTrendRobot`.

### Paso 4: Pruébalo primero en HISTÓRICO (backtest)
1. Presiona **Ctrl+R** (Probador de Estrategias).
2. Configura: **Experto**: IoTrendRobot · **Símbolo**: EURUSD · **Periodo**: H1 · **Modelo**: Cada tick basado en ticks reales · **Rango de fechas**: último año.
3. Clic en **Iniciar**. Revisa: Profit Factor (> 1.3 aceptable), Drawdown máximo (< 20%), número de operaciones (> 50 para que sea estadísticamente válido).
4. Puedes **optimizar** parámetros (pestaña "Optimización") cambiando de a uno o dos (ej. `InpSlAtrMult` 1.0-2.5 paso 0.25). ⚠️ No optimices 10 parámetros a la vez: eso es sobreajuste y en real falla.

### Paso 5: Ponlo a operar
1. Abre un gráfico de **EURUSD H1** (o XAUUSD H1).
2. Arrastra `IoTrendRobot` desde el Navegador al gráfico.
3. En la ventana de parámetros, revisa los valores (deja los predeterminados para empezar).
4. Activa el botón **AutoTrading** en la barra superior de MT5 (debe quedar verde) y marca "Permitir trading algorítmico" en Herramientas → Opciones → Expert Advisors.
5. Verás una carita sonriente en la esquina del gráfico: el robot está vivo. Cada cruz de EMA que pase los filtros abrirá/cerrará operaciones automáticamente.

---

## 3. ¿Se puede hacer DESDE EL CELULAR? 📱

**Respuesta directa**: compilar/editar el código NO se puede desde el celular; **usar un robot YA instalado en PC sí, parcialmente**:

| Acción | ¿Celular? | Nota |
|---|---|---|
| Editar/compilar código MQL5 | ❌ No | MetaEditor no existe para Android/iOS |
| Instalar un EA desde cero | ❌ No | La app móvil de MT5 no carga EAs |
| **Monitorear el robot corriendo en tu PC** | ✅ Sí | Instala la app móvil de MT5 e inicia sesión con la misma cuenta: ves y cierras posiciones del EA en vivo |
| **VPS (lo más parecido a "desde el celular")** | ✅ Sí | Un VPS de MT5 corre el robot 24/7 sin tu PC encendida; lo controlas desde el celular |

### Opción recomendada si solo tienes celular: VPS
1. En MT5 de PC (un solo registro inicial en PC es inevitable): registra un **VPS de MQL5** (clic derecho en tu cuenta en el Navegador → "Registrar VPS"). MQL5 ofrece VPS desde ~10 USD/mes; muchos brokers lo regalan si tienes cierto balance.
2. El VPS replica tu MT5 con el robot corriendo 24/7.
3. Desde la app **MT5 para Android/iOS** monitoreas todo: posiciones abiertas, ganancia/perdida, historial.

La realidad técnica: **el ciclo correcto es PC (o VPS) para instalar → celular para supervisar**. Los "bots" que se venden como apps móviles de trading automático son en realidad señales o conectan a un servidor de terceros con acceso a tu cuenta (riesgo de seguridad elevado). Evítalos.

---

## 4. Parámetros que puedes ajustar (los importantes)

| Parámetro | Predeterminado | Qué hace |
|---|---|---|
| `InpRiskPercent` | 1.0 | % del balance arriesgado por operación. **Nunca subas de 2%** |
| `InpEmaFastPeriod / InpEmaSlowPeriod` | 20 / 50 | El cruce de tendencia. Para H4 prueba 9/21 |
| `InpAdxMin` | 22 | Sube a 25 para menos señales y más calidad |
| `InpSlAtrMult / InpTpAtrMult` | 1.5 / 3.0 | Distancias de SL/TP. Mantén ratio 1:2 |
| `InpMaxDailyLossPct` | 3.0 | Freno de seguridad diario. 0 lo desactiva |
| `InpUseTrendFilter / Adx / Rsi` | true | Puedes apagar cada filtro para experimentar (el backtest te mostrará por qué conviene tenerlos) |

---

## 5. Plan de uso responsable

1. **Semana 1-2**: solo backtest en el Probador de Estrategias, ajusta como máximo 1-2 parámetros.
2. **Mes 1-2**: cuenta **demo** en tiempo real. El robot opera solo; tú solo observas.
3. **Mes 3+**: si la demo se mantiene positiva (profit factor > 1.2, drawdown < 20%), pasa a real con **dinero que puedas permitirte perder**, riesgo 1% y límite diario activo.
4. Nunca aumentes el riesgo para "recuperar" pérdidas: esa es la ruta clásica a quemar la cuenta.

---

## Estructura

```
Io-0.001/
├── mt5/
│   └── IoTrendRobot.mq5   # Expert Advisor completo (MQL5)
├── src/                    # Bots existentes (tenis, FIFA)
├── fifa-bot.js
└── index.js
```

## Licencia
MIT - mismo término que el repositorio.
