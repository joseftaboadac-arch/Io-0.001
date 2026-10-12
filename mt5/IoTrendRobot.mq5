//+------------------------------------------------------------------+
//|                                                IoTrendRobot.mq5  |
//|  Robot de trading para MetaTrader 5 - Seguimiento de tendencia   |
//|  Estrategia: cruce EMA + filtro EMA200 + ADX + RSI, SL/TP por ATR|
//+------------------------------------------------------------------+
#property copyright "Io-0.001"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

CTrade trade;

//--- Entradas: estrategia
input group "=== Estrategia (medias) ==="
input int    InpEmaFastPeriod      = 20;      // Periodo EMA rapida
input int    InpEmaSlowPeriod      = 50;      // Periodo EMA lenta
input int    InpEmaTrendPeriod     = 200;     // Periodo EMA de tendencia (filtro)
input bool   InpUseTrendFilter     = true;    // Usar filtro EMA200 (solo operar a favor)
input bool   InpUseAdxFilter       = true;    // Usar filtro ADX (fuerza de tendencia)
input int    InpAdxPeriod          = 14;      // Periodo ADX
input double InpAdxMin             = 22.0;    // ADX minimo para operar
input bool   InpUseRsiFilter       = true;    // Usar filtro RSI (evitar sobrecompra/sobreventa)
input int    InpRsiPeriod          = 14;      // Periodo RSI
input double InpRsiMaxLong         = 70.0;    // RSI maximo permitido para comprar
input double InpRsiMinShort        = 30.0;    // RSI minimo permitido para vender

//--- Entradas: riesgo y gestion
input group "=== Riesgo y gestion ==="
input double InpRiskPercent        = 1.0;     // Riesgo por operacion (% del balance)
input double InpFixedLot           = 0.0;     // Lote fijo (0 = usar riesgo %)
input double InpAtrPeriod          = 14;      // Periodo ATR
input double InpSlAtrMult          = 1.5;     // Stop Loss = ATR x este valor
input double InpTpAtrMult          = 3.0;     // Take Profit = ATR x este valor (R:R 1:2)
input bool   InpUseTrailing        = true;    // Usar trailing stop
input double InpTrailAtrMult       = 1.5;     // Trailing stop = ATR x este valor
input double InpTrailStartAtrMult  = 1.0;     // Iniciar trailing tras ATR x este valor de ganancia
input double InpMaxDailyLossPct    = 3.0;     // Perdida maxima diaria (%) - 0 = desactivado
input int    InpMaxSpreadPoints    = 0;       // Spread maximo en puntos (0 = sin limite)
input int    InpMagicNumber        = 20251012;// Magic number
input string InpTradeComment       = "IoTrendRobot";

//--- Handles de indicadores
int hEmaFast  = INVALID_HANDLE;
int hEmaSlow  = INVALID_HANDLE;
int hEmaTrend = INVALID_HANDLE;
int hAdx      = INVALID_HANDLE;
int hRsi      = INVALID_HANDLE;
int hAtr      = INVALID_HANDLE;

//--- Estado
datetime lastBarTime   = 0;
double   dayStartBalance = 0.0;
int      currentDay     = -1;

//+------------------------------------------------------------------+
int OnInit()
  {
   if(InpEmaFastPeriod >= InpEmaSlowPeriod)
     {
      Print("ERROR: la EMA rapida debe ser menor que la lenta.");
      return(INIT_PARAMETERS_INCORRECT);
     }

   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(20);

   hEmaFast  = iMA(_Symbol, _Period, InpEmaFastPeriod, 0, MODE_EMA, PRICE_CLOSE);
   hEmaSlow  = iMA(_Symbol, _Period, InpEmaSlowPeriod, 0, MODE_EMA, PRICE_CLOSE);
   hEmaTrend = iMA(_Symbol, _Period, InpEmaTrendPeriod, 0, MODE_EMA, PRICE_CLOSE);
   hAdx      = iADX(_Symbol, _Period, InpAdxPeriod);
   hRsi      = iRSI(_Symbol, _Period, InpRsiPeriod, PRICE_CLOSE);
   hAtr      = iATR(_Symbol, _Period, (int)InpAtrPeriod);

   if(hEmaFast == INVALID_HANDLE || hEmaSlow == INVALID_HANDLE ||
      hEmaTrend == INVALID_HANDLE || hAdx == INVALID_HANDLE ||
      hRsi == INVALID_HANDLE || hAtr == INVALID_HANDLE)
     {
      Print("ERROR: no se pudieron crear los indicadores.");
      return(INIT_FAILED);
     }

   Print("IoTrendRobot iniciado en ", _Symbol, " ", EnumToString(_Period));
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   if(hEmaFast  != INVALID_HANDLE) IndicatorRelease(hEmaFast);
   if(hEmaSlow  != INVALID_HANDLE) IndicatorRelease(hEmaSlow);
   if(hEmaTrend != INVALID_HANDLE) IndicatorRelease(hEmaTrend);
   if(hAdx      != INVALID_HANDLE) IndicatorRelease(hAdx);
   if(hRsi      != INVALID_HANDLE) IndicatorRelease(hRsi);
   if(hAtr      != INVALID_HANDLE) IndicatorRelease(hAtr);
  }

//+------------------------------------------------------------------+
//| Lee un valor de un buffer del indicador en la barra indicada      |
//+------------------------------------------------------------------+
double GetValue(const int handle, const int bufferIndex, const int shift)
  {
   double buf[1];
   if(CopyBuffer(handle, bufferIndex, shift, 1, buf) != 1)
      return(EMPTY_VALUE);
   return(buf[0]);
  }

//+------------------------------------------------------------------+
//| Verifica si ya existe una posicion abierta por este EA           |
//+------------------------------------------------------------------+
bool HasOpenPosition()
  {
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionSelectByTicket(ticket) &&
         PositionGetString(POSITION_SYMBOL) == _Symbol &&
         PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         return(true);
     }
   return(false);
  }

//+------------------------------------------------------------------+
//| Perdida diaria: bloquea el trading si se supera el limite        |
//+------------------------------------------------------------------+
bool DailyLossLimitReached()
  {
   if(InpMaxDailyLossPct <= 0)
      return(false);

   MqlDateTime now;
   TimeCurrent(now);
   if(now.day != currentDay)
     {
      currentDay = now.day;
      dayStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
     }

   if(dayStartBalance <= 0)
      return(false);

   double lossPct = (dayStartBalance - AccountInfoDouble(ACCOUNT_BALANCE)) / dayStartBalance * 100.0;
   if(lossPct >= InpMaxDailyLossPct)
     {
      Print("Limite de perdida diaria alcanzado (", DoubleToString(lossPct, 2), "%). Trading detenido por hoy.");
      return(true);
     }
   return(false);
  }

//+------------------------------------------------------------------+
//| Calcula el tamano de lote segun el riesgo configurado            |
//+------------------------------------------------------------------+
double CalcLotSize(const double slDistancePrice)
  {
   if(InpFixedLot > 0)
      return(NormalizeLot(InpFixedLot));

   double balance    = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskMoney  = balance * InpRiskPercent / 100.0;

   double tickValue  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize   = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickValue <= 0 || tickSize <= 0)
      return(0.0);

   double lossPerLot = slDistancePrice / tickSize * tickValue;
   if(lossPerLot <= 0)
      return(0.0);

   double lots = riskMoney / lossPerLot;
   return(NormalizeLot(lots));
  }

//+------------------------------------------------------------------+
double NormalizeLot(double lots)
  {
   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   if(lotStep > 0)
      lots = MathFloor(lots / lotStep) * lotStep;
   lots = MathMax(minLot, MathMin(maxLot, lots));

   double marginRequired = 0.0;
   if(OrderCalcMargin(ORDER_TYPE_BUY, _Symbol, lots, SymbolInfoDouble(_Symbol, SYMBOL_ASK), marginRequired))
     {
      double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
      if(marginRequired > freeMargin)
        {
         Print("Margen insuficiente para ", DoubleToString(lots, 2), " lotes.");
         return(0.0);
        }
     }
   return(lots);
  }

//+------------------------------------------------------------------+
//| Trailing stop dinamico basado en ATR                             |
//+------------------------------------------------------------------+
void ManageTrailingStop()
  {
   if(!InpUseTrailing || !HasOpenPosition())
      return;

   double atr = GetValue(hAtr, 0, 1);
   if(atr == EMPTY_VALUE || atr <= 0)
      return;

   double trailDistance = atr * InpTrailAtrMult;
   double startDistance = atr * InpTrailStartAtrMult;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;

      long   type     = PositionGetInteger(POSITION_TYPE);
      double openPrice= PositionGetDouble(POSITION_PRICE_OPEN);
      double curSL    = PositionGetDouble(POSITION_SL);
      double curTP    = PositionGetDouble(POSITION_TP);

      if(type == POSITION_TYPE_BUY)
        {
         double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
         if(bid - openPrice >= startDistance)
           {
            double newSL = NormalizeDouble(bid - trailDistance, _Digits);
            if(newSL > openPrice && (curSL == 0 || newSL > curSL))
               trade.PositionModify(ticket, newSL, curTP);
           }
        }
      else if(type == POSITION_TYPE_SELL)
        {
         double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         if(openPrice - ask >= startDistance)
           {
            double newSL = NormalizeDouble(ask + trailDistance, _Digits);
            if(newSL < openPrice && (curSL == 0 || newSL < curSL))
               trade.PositionModify(ticket, newSL, curTP);
           }
        }
     }
  }

//+------------------------------------------------------------------+
//| Cierra la posicion si la tendencia se invierte                    |
//+------------------------------------------------------------------+
void CloseOnOppositeSignal(const bool bullishNow)
  {
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(!PositionSelectByTicket(ticket)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;

      long type = PositionGetInteger(POSITION_TYPE);
      if(bullishNow && type == POSITION_TYPE_SELL)
         trade.PositionClose(ticket);
      else if(!bullishNow && type == POSITION_TYPE_BUY)
         trade.PositionClose(ticket);
     }
  }

//+------------------------------------------------------------------+
//| Abre una operacion con SL/TP por ATR                             |
//+------------------------------------------------------------------+
bool OpenTrade(const bool isLong)
  {
   double atr = GetValue(hAtr, 0, 1);
   if(atr == EMPTY_VALUE || atr <= 0)
      return(false);

   double slDistance = atr * InpSlAtrMult;
   double tpDistance = atr * InpTpAtrMult;
   double lots = CalcLotSize(slDistance);
   if(lots <= 0)
     {
      Print("Lote calculado invalido, no se opera.");
      return(false);
     }

   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   double price, sl, tp;
   if(isLong)
     {
      price = ask;
      sl = NormalizeDouble(price - slDistance, _Digits);
      tp = NormalizeDouble(price + tpDistance, _Digits);
      if(!trade.Buy(lots, _Symbol, price, sl, tp, InpTradeComment))
        {
         Print("Fallo al abrir COMPRA: ", trade.ResultRetcodeDescription());
         return(false);
        }
     }
   else
     {
      price = bid;
      sl = NormalizeDouble(price + slDistance, _Digits);
      tp = NormalizeDouble(price - tpDistance, _Digits);
      if(!trade.Sell(lots, _Symbol, price, sl, tp, InpTradeComment))
        {
         Print("Fallo al abrir VENTA: ", trade.ResultRetcodeDescription());
         return(false);
        }
     }
   return(true);
  }

//+------------------------------------------------------------------+
void OnTick()
  {
   ManageTrailingStop();

   datetime curBarTime = iTime(_Symbol, _Period, 0);
   if(curBarTime == lastBarTime)
      return;

   if(DailyLossLimitReached())
     {
      lastBarTime = curBarTime;
      return;
     }

   if(InpMaxSpreadPoints > 0)
     {
      long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
      if(spread > InpMaxSpreadPoints)
        {
         lastBarTime = curBarTime;
         return;
        }
     }

   double emaFastNow  = GetValue(hEmaFast, 0, 1);
   double emaSlowNow  = GetValue(hEmaSlow, 0, 1);
   double emaFastPrev = GetValue(hEmaFast, 0, 2);
   double emaSlowPrev = GetValue(hEmaSlow, 0, 2);
   double emaTrend    = GetValue(hEmaTrend, 0, 1);
   double closePrev   = iClose(_Symbol, _Period, 1);

   if(emaFastNow == EMPTY_VALUE || emaSlowNow == EMPTY_VALUE ||
      emaFastPrev == EMPTY_VALUE || emaSlowPrev == EMPTY_VALUE ||
      emaTrend == EMPTY_VALUE)
     {
      lastBarTime = curBarTime;
      return;
     }

   double adx = GetValue(hAdx, 0, 1);
   double rsi = GetValue(hRsi, 0, 1);

   bool crossedUp   = (emaFastPrev <= emaSlowPrev && emaFastNow > emaSlowNow);
   bool crossedDown = (emaFastPrev >= emaSlowPrev && emaFastNow < emaSlowNow);

   if(!crossedUp && !crossedDown)
     {
      lastBarTime = curBarTime;
      return;
     }

   bool bullishNow = crossedUp;

   if(InpUseAdxFilter && (adx == EMPTY_VALUE || adx < InpAdxMin))
     {
      lastBarTime = curBarTime;
      return;
     }

   if(InpUseTrendFilter)
     {
      if(crossedUp && closePrev < emaTrend)
        {
         lastBarTime = curBarTime;
         return;
        }
      if(crossedDown && closePrev > emaTrend)
        {
         lastBarTime = curBarTime;
         return;
        }
     }

   if(InpUseRsiFilter)
     {
      if(crossedUp && (rsi == EMPTY_VALUE || rsi > InpRsiMaxLong))
        {
         lastBarTime = curBarTime;
         return;
        }
      if(crossedDown && (rsi == EMPTY_VALUE || rsi < InpRsiMinShort))
        {
         lastBarTime = curBarTime;
         return;
        }
     }

   CloseOnOppositeSignal(bullishNow);

   if(!HasOpenPosition())
      OpenTrade(bullishNow);

   lastBarTime = curBarTime;
  }
//+------------------------------------------------------------------+
