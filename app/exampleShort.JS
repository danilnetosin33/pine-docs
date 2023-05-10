// --> line 128 START
// Think that problem is : enter several times in close conditions

// Data settings
let symbol = "AAPL";
let timeframe = "1D";

// Config settings
let orderCall = "Short Only";

//"Both";
let barsCloseReversal = 5;
let barsClose = 5;
let barsIgnore = 5;
let profitPercantage = 5;
let order = 1000;

let bars_data = require(`./assets/JSON/${symbol}/${symbol}, ${timeframe}.json`);
bars_data = bars_data.reverse();

let delta = 0; // Math.abs(bars_data[0].time - bars_data[1].time);

//1356991200000 -  01.01.2013
//1388527200000 - 01.01.2014 +
//1420063200000 - 01.01.2015 +

//1451599200000 - 01.01.2016 +
//1483221600000 - 01.01.2017 +
//1514757600000 - 01.01.2018 +
//1546293600000 - 01.01.2019 +
//1577829600000 - 01.01.2020 +
//1609452000000 - 01.01.2021 +
//1640988000000 - 01.01.2022 +
//1672524000000 - 01.01.2023

bars_data = bars_data.filter(
  (el) =>
    +el.time + "000" >= 1356991200000 - delta * 2000 &&
    +el.time + "000" < 1672524000000
);

console.log(
  "BARS_DATA",

  new Date(+(bars_data[0].time + "000")).toDateString()
);

let low = bars_data.map((el) => el.low);
let high = bars_data.map((el) => el.high);
let close = bars_data.map((el) => el.close);
let open = bars_data.map((el) => el.open);
let time = bars_data.map((el) => el.time);
let last_bar_index = bars_data.length - 1;

// console.log("LOW", low);
// console.log("HIGH", high);
// console.log("CLOSE", close);
// console.log("OPEN", open);
// console.log("TIME", time);

var lastReversalBarsLong = [];
var lastReversalBarsShort = [];

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
  });
  return result;
}
function findIndexByBarIndex(arrayBla, value) {
  let result = -1;
  arrayBla.forEach((el, index) => {
    if (el.barIndex && el.barIndex == value) {
      result = index;
    }
  });
  return result;
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

/// START
bars_data.forEach((bar, bar_index) => {
  if (bar_index < 1) return;
  let bearishReversal =
    (orderCall == "Both" || orderCall == "Long Only") &&
    high[bar_index] > high[bar_index - 1] &&
    close[bar_index] < close[bar_index - 1];
  let bullishReversal =
    (orderCall == "Both" || orderCall == "Short Only") &&
    low[bar_index] < low[bar_index - 1] &&
    close[bar_index] > close[bar_index - 1];
  let bullish_TAR =
    (orderCall == "Both" || orderCall == "Long Only") &&
    low[bar_index - 1] < low[bar_index - 2] &&
    close[bar_index - 1] > close[bar_index - 2] &&
    high[bar_index] > high[bar_index - 1];
  let bearish_TAR =
    (orderCall == "Both" || orderCall == "Short Only") &&
    high[bar_index - 1] > high[bar_index - 2] &&
    close[bar_index - 1] < close[bar_index - 2] &&
    low[bar_index] < low[bar_index - 1];
  //SHORT
  if (
    high[bar_index] > high[bar_index - 1] &&
    close[bar_index] < close[bar_index - 1]
  ) {
    let reversal_bar_short = {
      barIndex: bar_index,
      barLow: low[bar_index],
      barHigh: high[bar_index],
      isOutter: true,
    };
    lastReversalBarsShort.push(reversal_bar_short);
  }
  if (lastReversalBarsShort.length > 0) {
    temp_el = lastReversalBarsShort[lastReversalBarsShort.length - 1];
    temp_el.isOutter = temp_el.barHigh < high[bar_index];
    if (bar_index - temp_el.barIndex < barsCloseReversal) {
      lastReversalBarsShort = [];
    } else if (temp_el.barLow > low[bar_index]) {
      bearish_TAR = true;
      lastReversalBarsShort = [];
    }
  }

  // ENTER ORDERS
  let isOpenedTrades =
    arrayStatistics.length > 0
      ? !arrayStatistics[arrayStatistics.length - 1].exitPrice
      : false;

  let condBarsIgnore =
    arrayStatistics.length > 0 || isOpenedTrades
      ? bar_index >=
        arrayStatistics[arrayStatistics.length - 1].barIndex + barsIgnore
      : true;

  // SHORT
  //  inDateRange && condBarsIgnore
  if (bearish_TAR && condBarsIgnore) {
    let countEntryPrice =
      low[bar_index - 1] > open[bar_index]
        ? open[bar_index]
        : low[bar_index - 1];

    entryPriceShort.push(countEntryPrice);
    console.log(
      "ENTER_PRICE",
      bar_index,
      countEntryPrice,
      entryPriceShort[entryPriceShort.length - 1]
    );

    entryPriceDisplayShort.push(countEntryPrice);
    entryBarindexShort.push(bar_index);
    let addItem = {
      entrySignal: "BearTAR",
      barIndex: bar_index,
      exitPrice: null,
      timeEnter: time[bar_index],
      timeTransformed: new Date(+(time[bar_index] + "000")).toDateString(),
      initPrice: countEntryPrice,
      id: arrayStatistics.length + 1,
    };
    arrayStatistics.push(addItem);
    lastHigh = high[bar_index - 1];
    countOpened += 1;
  }

  //CLOSED BY SL
  // SHORT
  if (high[bar_index] > lastHigh && entryBarindexShort.length > 0) {
    closedBySL = true;
    if (
      entryPriceShort.length > 0 &&
      bar_index > entryBarindexShort[entryBarindexShort.length - 1]
    ) {
      entryPriceShort.forEach((el, index) => {
        countClosedBySLShort += 1;
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexShort[index]
        );
        if (elIndex != -1) {
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "SL",
            exitPrice: lastHigh,
            profit:
              countTakeProfitPerTrade(
                +arrayStatistics[elIndex].initPrice,
                +lastHigh,
                order
              ) * -1,
            barIndexExit: bar_index,
          };
        }
      });
      entryPriceShort = [];
      entryBarindexShort = [];
    }
  }

  // CLOSED BY REVERSAL
  // SHORT
  if (bullishReversal) {
    if (entryPriceShort.length > 0) {
      entryPriceShort.forEach((el, index) => {
        if (
          bar_index - entryBarindexShort[entryPriceShort.length - 1] >
          barsCloseReversal
        ) {
          closeByReversal = true;
          totalProfit +=
            countTakeProfitPerTrade(
              entryPriceShort[index],
              high[bar_index - 1],
              order
            ) * -1;
          countClosedByBearishReversal += 1;
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexShort[index]
          );
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "Reversal",
            exitPrice: high[bar_index - 1],
            profit:
              countTakeProfitPerTrade(
                entryPriceShort[index],
                high[bar_index - 1],
                order
              ) * -1,
            barIndexExit: bar_index,
          };
          entryPriceShort.splice(index, 1);
          entryBarindexShort.splice(index, 1);
        }
      });
    }
  }

  //CLOSED BY  TAKE PROFIT BY PERCENTAGE
  //SHORT
  if (entryPriceShort.length > 0) {
    for (let index = entryPriceShort.length - 1; index >= 0; index--) {
      let TP_price =
        (entryPriceShort[entryPriceShort.length - 1] *
          (100 - profitPercantage)) /
        100;

      //   console.log(
      //     "******",
      //     bar_index,
      //     "TP PRICE",
      //     TP_price,
      //     low[bar_index],
      //     "cond2",
      //     bar_index > entryBarindexShort[entryBarindexShort.length - 1]
      //   );

      if (
        TP_price >= low[bar_index] &&
        bar_index > entryBarindexShort[entryBarindexShort.length - 1]
      ) {
        console.log("TP_SHORT", bar_index);
        countClosedByProfitShort += 1;
        closedByTP = true;
        let elIndex = findIndexByBarIndex(
          arrayStatistics,
          entryBarindexShort[index]
        );
        if (elIndex != -1) {
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "TP",
            exitPrice: TP_price,
            profit:
              countTakeProfitPerTrade(
                arrayStatistics[elIndex].initPrice,
                TP_price,
                order
              ) * -1,
            barIndexExit: bar_index,
          };
          entryPriceShort.splice(index, 1);
          entryBarindexShort.splice(index, 1);
        }
      }
    }
  }

  // CLOSED BY BAR INDEX
  //SHORT
  if (entryBarindexShort.length > 0 && entryPriceShort.length > 0) {
    for (let index = entryBarindexShort.length - 1; index >= 0; index--) {
      if (entryPriceShort.length > 0) {
        // bar_index -   entryBarindexShort[entryBarindexShort.length - 1] < barsClose
        if (
          bar_index - barsClose >=
          entryBarindexShort[entryBarindexShort.length - 1]
        ) {
          console.log(
            "BAR_CLOSE",
            bar_index - barsClose,
            entryBarindexShort[entryBarindexShort.length - 1]
          );
          countClosedByBarCount += 1;
          closedByBars = true;
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexShort[index]
          );
          if (elIndex != -1) {
            arrayStatistics[elIndex] = {
              ...arrayStatistics[elIndex],
              timeExit: time[bar_index],
              signalExit: "Bars",
              exitPrice: open[bar_index],
              profit:
                countTakeProfitPerTrade(
                  arrayStatistics[elIndex].initPrice,
                  open[bar_index],
                  order
                ) * -1,
              barIndexExit: bar_index,
            };
            entryPriceShort.splice(index, 1);
            entryBarindexShort.splice(index, 1);
          }
        }
      }
    }
  }
});

// Profit calculate + info about orders
let profit = 0;
let unclosed_arr = [];
let closed = { unclosed: 0 };
arrayStatistics.forEach((el, index) => {
  console.log("ELEMENT", el);
  if ((el.profit || el.profit == 0) && el.profit !== null) {
    // console.log(`Profit Order ${index + 1} :::`, el.profit);
    profit += el.profit;
    if (!closed[el.signalExit]) {
      closed[el.signalExit] = 0;
    }
    closed[el.signalExit] += 1;
  } else {
    unclosed_arr.push(el);
    closed.unclosed += 1;
  }
});
console.log("All orders :", arrayStatistics.length);
console.log("PROFIT : ", profit);
console.log("Orders status: ", closed);
