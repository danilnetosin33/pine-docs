let symbol = "AAPL";
let timeframe = "1D";

const bars_data = require(`./assets/JSON/${symbol}/${symbol}, ${timeframe}.json`);

let bar_index = 0;
let low = bars_data.map((el) => el.low[0]);
let high = bars_data.map((el) => el.high[0]);
let close = bars_data.map((el) => el.close);
let open = bars_data.map((el) => el.open);
console.log("LOW", low);
console.log("HIGH", high);
console.log("CLOSE", close);
console.log("OPEN", open);

var lastReversalBarsLong = [];
var lastReversalBarsShort = [];
let orderCall = "Both";

bearishReversal =
  (orderCall == "Both" || orderCall == "Long Only") &&
  high[0] > high[1] &&
  close[0] < close[1];
bullishReversal =
  (orderCall == "Both" || orderCall == "Short Only") &&
  low[0] < low[1] &&
  close[0] > close[1];
bullish_TAR =
  (orderCall == "Both" || orderCall == "Long Only") &&
  low[1] < low[2] &&
  close[1] > close[2] &&
  high[0] > high[1];
bearish_TAR =
  (orderCall == "Both" || orderCall == "Short Only") &&
  high[1] > high[2] &&
  close[1] < close[2] &&
  low[0] < low[1];

//LONG
if (low[0] < low[1] && close[0] > close[1]) {
  let reversal_bar_long = {
    barIndex: bar_index,
    barLow: low[0],
    barHigh: high[0],
    isOutter: true,
  };
  lastReversalBarsLong.push(reversal_bar_long);
}
if (lastReversalBarsLong.length > 0) {
  temp_el = lastReversalBarsLong[lastReversalBarsLong.length - 1];
  temp_el.isOutter = temp_el.barLow > low[0];
  if (last_bar_index - temp_el.barIndex > barsCloseReversal) {
    lastReversalBarsLong = [];
  } else if (temp_el.barHigh < high[0]) {
    bullish_TAR = true;
    lastReversalBarsLong = [];
  }
}

//SHORT
if (high[0] > high[1] && close[0] < close[1]) {
  let reversal_bar_short = {
    barIndex: bar_index,
    barLow: low[0],
    barHigh: high[0],
    isOutter: true,
  };
  lastReversalBarsShort.push(reversal_bar_short);
}
if (lastReversalBarsShort.length > 0) {
  temp_el = lastReversalBarsShort[lastReversalBarsShort.length - 1];
  temp_el.isOutter = temp_el.barHigh < high[0];
  if (last_bar_index - temp_el.barIndex > barsCloseReversal) {
    lastReversalBarsShort = [];
  } else if (temp_el.barLow > low[0]) {
    bearish_TAR = true;
    lastReversalBarsShort = [];
  }
}

// ARRAYS
// long
var entryPriceDisplayLong = [];
var closePriceDisplayLong = [];
var entryPriceLong = [];
var closePriceLong = [];
var entryBarindexLong = [];
var countClosedBySLLong = 0;
var countClosedByProfitLong = 0;
var countSameCloseBull = 0;

// short
var entryPriceDisplayShort = [];
var closePriceDisplayShort = [];
var entryPriceShort = [];
var closePriceShort = [];
var entryBarindexShort = [];
var countClosedBySLShort = 0;
var countClosedByProfitShort = 0;
var countSameCloseBear = 0;

// additional
var arrayStatistics = [];
var totalProfit = 0.0;
var countClosedByBarCount = 0;
var countClosedByBearishReversal = 0;
var countClosedByBullishReversal = 0;
var countOpened = 0;
var lastLow = 0.0;
var lastHigh = 0.0;
var lastIndex = 0.0;
var closedBySL = false;
var closeByReversal = false;
var closedByTP = false;
var closedByBars = false;

// UTILS FUNCTIONS
function countTakeProfitPerTrade(initPrice, lastPrice, order) {
  return (order / initPrice) * (lastPrice - initPrice);
}
function findElementByBarIndex(arrayBla, value) {
  let result = false;
  arrayBla.forEach((el) => {
    if (el.barIndex && el.barIndex == value) {
      result = el;
    }
    return result;
  });
}
function findIndexByBarIndex(arrayBla, value) {
  let result = false;
  arrayBla.forEach((el, index) => {
    if (el.barIndex && el.barIndex == value) {
      result = index;
    }
    return result;
  });
}

// FILTER FUNCTIONS
function filterByDateRange(arrayBla) {
  let result = [];
  let date_start = 1; //timestamp(startYear, startMonth, startDate)
  let date_end = 1; //timestamp(endYear, endMonth, endDate)
  if (arrayBla.length > 0) {
    arrayBla.forEach((el) => {
      if (el.timeEnter > date_start && date_end > el.timeExit) {
        result.push(el);
      }
    });
  }
  return result;
}
function filterByEnterSignalFunc(arrayBla, value) {
  let result = [];
  if (arrayBla.length > 0) {
    arrayBla.forEach((el) => {
      if (el.entrySignal == value || value == "All") {
        result.push(el);
      }
    });
  }
  return result;
}
function filterByExitSignalFunc(arrayBla, value) {
  let result = [];
  if (arrayBla.length > 0) {
    arrayBla.forEach((el) => {
      if (el.signalExit == value || value == "All") {
        result.push(el);
      }
    });
  }
  return result;
}

// ENTER ORDERS
// LONG
isOpenedTrades = arrayStatistics.length > 0 ? true : false; // ?
condBarsIgnore = arrayStatistics.length > 0 || isOpenedTrades ? true : true; // ?

if (true || (bullish_TAR && inDateRange && condBarsIgnore)) {
  entryPriceLong.push(high[1]);
  entryBarindexLong.push(bar_index);
  entryPriceDisplayLong.push(high[1]);
  let addItem = {
    entrySignal: "BullTAR",
    barIndex: bar_index,
    exitPrice: null,
    timeEnter: new Date(),
    initPrice: high[1],
    id: arrayStatistics.length + 1,
  };
  arrayStatistics.push(addItem);
  lastLow = low[1];
  countOpened += 1;
}

// SHORT
if (true || (bearish_TAR && inDateRange && condBarsIgnore)) {
  entryPriceShort.push(low[1]);
  entryPriceDisplayShort.push(low[1]);
  entryBarindexShort.push(bar_index);
  let addItem = {
    entrySignal: "BearTAR",
    barIndex: bar_index,
    exitPrice: null,
    timeEnter: new Date(),
    initPrice: low[1],
    id: arrayStatistics.length + 1,
  };
  arrayStatistics.push(addItem);
  lastHigh = high[1];
  countOpened += 1;
}

//CLOSED BY SL
//LONG
if (true || (low[0] < lastLow && entryBarindexLong.length > 0)) {
  closedBySL = true;
  if (
    entryPriceLong.length > 0 &&
    bar_index > entryBarindexLong[entryBarindexLong.length - 1]
  )
    entryPriceLong.forEach((el, index) => {
      countClosedBySLLong += 1;
      totalProfit += countTakeProfitPerTrade(
        entryPriceLong[index],
        lastLow,
        order
      );
      let elIndex = findIndexByBarIndex(
        arrayStatistics,
        entryBarindexLong[index]
      );
      arrayStatistic[elIndex] = {
        timeExit: time,
        signalExit: "SL",
        exitPrice: lastLow,
        profit: countTakeProfitPerTrade(entryPriceLong[index], lastLow, order),
        barIndexExit: bar_index,
      };
    });
  entryPriceLong = [];
  entryBarindexLong = [];
}

// SHORT
if (true || (high[0] > lastHigh && entryBarindexShort.length > 0)) {
  closedBySL = true;
  if (
    entryPriceShort.length > 0 &&
    bar_index > entryBarindexShort[entryBarindexShort.length - 1]
  )
    entryPriceShort.forEach((el, index) => {
      countClosedBySLShort += 1;
      totalProfit +=
        countTakeProfitPerTrade(entryPriceShort[index], lastHigh, order) * -1;
      let elIndex = findIndexByBarIndex(
        arrayStatistics,
        entryBarindexShort[index]
      );
      arrayStatistic[elIndex] = {
        timeExit: time,
        signalExit: "SL",
        exitPrice: lastHigh,
        profit:
          countTakeProfitPerTrade(entryPriceShort[index], lastHigh, order) * -1,
        barIndexExit: bar_index,
      };
    });
  entryPriceShort = [];
  entryBarindexShort = [];
}

// CLOSED BY REVERSAL
// LONG
if (bearishReversal) {
  if (entryPriceLong.length > 0) {
    closePriceLong.push(low[1]);
    closePriceDisplayLong.push(low[1]);
    entryPriceLong.forEach((el, index) => {
      if (
        bar_index - entryBarindexLong[entryBarindexLong.length - 1] >
        barsCloseReversal
      ) {
        closeByReversal = true;
        totalProfit += countTakeProfitPerTrade(
          entryPriceLong[index],
          low[1],
          order
        );
        countClosedByBearishReversal += 1;
        elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexLong[index]
        );
        arrayStatistics[elIndex] = {
          timeExit: time,
          signalExit: "Reversal",
          exitPrice: low[1],
          profit: countTakeProfitPerTrade(entryPriceLong[index], low[1], order),
          barIndexExit: bar_index,
        };
        entryPriceLong.splice(index, 1);
        entryBarindexLong.splice(index, 1);
      }
    });
  }
}
// SHORT

if (bullishReversal) {
  if (entryPriceShort.length > 0) {
    entryPriceShort.push(low[1]);
    closePriceDisplayShort.push(low[1]);
    entryPriceShort.forEach((el, index) => {
      if (
        bar_index - entryBarindexLong[entryPriceShort.length - 1] >
        barsCloseReversal
      ) {
        closeByReversal = true;
        totalProfit +=
          countTakeProfitPerTrade(entryPriceShort[index], high[1], order) * -1;
        countClosedByBearishReversal += 1;
        elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexShort[index]
        );
        arrayStatistics[elIndex] = {
          timeExit: time,
          signalExit: "Reversal",
          exitPrice: high[1],
          profit:
            countTakeProfitPerTrade(entryPriceShort[index], high[1], order) *
            -1,
          barIndexExit: bar_index,
        };
        entryPriceShort.splice(index, 1);
        entryBarindexShort.splice(index, 1);
      }
    });
  }
}

// CLOSED BY BAR INDEX
//LONG
if (entryBarindexLong.length > 0 && entryPriceLong.length > 0) {
  entryBarindexLong.forEach((el, index) => {
    if (
      bar_index - barsClose >=
      entryBarindexLong[entryBarindexLong.length - 1]
    ) {
      countClosedByBarCount += 1;
      closedByBars = true;
      totalProfit += countTakeProfitPerTrade(
        entryPriceLong[index],
        open,
        order
      );
      elIndex = findIndexByBarIndex(arrayStatistics, entryBarindexLong[index]);
      arrayStatistics[elIndex] = {
        timeExit: time,
        signalExit: "Bars",
        exitPrice: open[0],
        profit: countTakeProfitPerTrade(entryPriceLong[index], open[0], order),
        barIndexExit: bar_index,
      };
      entryPriceLong.splice(index, 1);
      entryBarindexLong.splice(index, 1);
    }
  });
}

//SHORT
if (entryBarindexShort.length > 0 && entryPriceShort.length > 0) {
  entryBarindexShort.forEach((el, index) => {
    if (
      bar_index - barsClose >=
      entryBarindexShort[entryBarindexShort.length - 1]
    ) {
      countClosedByBarCount += 1;
      closedByBars = true;
      totalProfit +=
        countTakeProfitPerTrade(entryPriceShort[index], open[0], order) * -1;
      elIndex = findIndexByBarIndex(arrayStatistics, entryBarindexShort[index]);
      arrayStatistics[elIndex] = {
        timeExit: time,
        signalExit: "Bars",
        exitPrice: open[0],
        profit:
          countTakeProfitPerTrade(entryPriceShort[index], open[0], order) * -1,
        barIndexExit: bar_index,
      };
      entryPriceShort.splice(index, 1);
      entryBarindexShort.splice(index, 1);
    }
  });
}

//CLOSED BY  TAKE PROFIT BY PERCENTAGE
//LONG
if (entryPriceLong.length > 0) {
  entryPriceLong.forEach((el, index) => {
    if (
      true ||
      (entryPriceLong[entryPriceLong.length - 1] *
        ((100 + profitPercantage) / 100) <=
        close[0] &&
        bar_index > entryBarindexLong[entryBarindexLong.length - 1])
    ) {
      countClosedByProfitLong += 1;
      closedByTP = true;
      totalProfit += countTakeProfitPerTrade(
        entryPriceLong[index],
        entryPriceLong[index] * ((100 + profitPercantage) / 100),
        order
      );
      elIndex = findIndexByBarIndex(arrayStatistics, entryBarindexLong[index]);
      arrayStatistics[elIndex] = {
        timeExit: time,
        signalExit: "TP",
        exitPrice: open[0],
        profit: countTakeProfitPerTrade(entryPriceLong[index], open[0], order),
        barIndexExit: bar_index,
      };
      entryPriceLong.splice(index, 1);
      entryBarindexLong.splice(index, 1);
    }
  });
}

//SHORT
if (entryPriceShort.length > 0) {
  entryPriceShort.forEach((el, index) => {
    if (
      true ||
      (entryPriceShort[entryPriceShort.length - 1] *
        ((100 + profitPercantage) / 100) <=
        close[0] &&
        bar_index > entryBarindexLong[entryBarindexShort.length - 1])
    ) {
      countClosedByProfitShort += 1;
      closedByTP = true;
      totalProfit +=
        countTakeProfitPerTrade(
          entryPriceShort[index],
          entryPriceShort[index] * ((100 + profitPercantage) / 100),
          order
        ) * -1;
      elIndex = findIndexByBarIndex(arrayStatistics, entryBarindexShort[index]);
      arrayStatistics[elIndex] = {
        timeExit: time,
        signalExit: "TP",
        exitPrice: open[0],
        profit:
          countTakeProfitPerTrade(entryPriceShort[index], open[0], order) * -1,
        barIndexExit: bar_index,
      };
      entryPriceShort.splice(index, 1);
      entryBarindexShort.splice(index, 1);
    }
  });
}
