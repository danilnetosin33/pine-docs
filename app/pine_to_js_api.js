module.exports = function calculateProfit(dataSettings, configSettings) {
  console.log("START_CALCULATE", dataSettings, configSettings);
  let symbol = "AAPL";
  let timeframe = "1W";

  let bars_data = require(`./assets/JSON/${symbol}/${symbol}, ${timeframe}.json`);
  bars_data = bars_data.reverse();

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

  //INPUTS
  let orderCall = "Both";
  let barsCloseReversal = 5;
  let barsClose = 5;
  let barsIgnore = 5;
  let profitPercantage = 5;
  let order = 10;
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
    let result = false;
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
    bearishReversal =
      (orderCall == "Both" || orderCall == "Long Only") &&
      high[bar_index] > high[bar_index - 1] &&
      close[bar_index] < close[bar_index - 1];
    bullishReversal =
      (orderCall == "Both" || orderCall == "Short Only") &&
      low[bar_index] < low[bar_index - 1] &&
      close[bar_index] > close[bar_index - 1];
    bullish_TAR =
      (orderCall == "Both" || orderCall == "Long Only") &&
      low[bar_index - 1] < low[bar_index - 2] &&
      close[bar_index - 1] > close[bar_index - 2] &&
      high[bar_index] > high[bar_index - 1];
    bearish_TAR =
      (orderCall == "Both" || orderCall == "Short Only") &&
      high[bar_index - 1] > high[bar_index - 2] &&
      close[bar_index - 1] < close[bar_index - 2] &&
      low[bar_index] < low[bar_index - 1];

    //LONG
    if (
      low[bar_index] < low[bar_index - 1] &&
      close[bar_index] > close[bar_index - 1]
    ) {
      let reversal_bar_long = {
        barIndex: bar_index,
        barLow: low[bar_index],
        barHigh: high[bar_index],
        isOutter: true,
      };
      lastReversalBarsLong.push(reversal_bar_long);
    }
    if (lastReversalBarsLong.length > 0) {
      temp_el = lastReversalBarsLong[lastReversalBarsLong.length - 1];
      temp_el.isOutter = temp_el.barLow > low[bar_index];
      if (last_bar_index - temp_el.barIndex > barsCloseReversal) {
        lastReversalBarsLong = [];
      } else if (temp_el.barHigh < high[bar_index]) {
        bullish_TAR = true;
        lastReversalBarsLong = [];
      }
    }

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
      if (last_bar_index - temp_el.barIndex > barsCloseReversal) {
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

    // LONG
    // inDateRange && condBarsIgnore
    if (bullish_TAR && condBarsIgnore) {
      entryPriceLong.push(high[bar_index - 1]);
      entryBarindexLong.push(bar_index);
      entryPriceDisplayLong.push(high[bar_index - 1]);
      let addItem = {
        entrySignal: "BullTAR",
        barIndex: bar_index,
        exitPrice: null,
        timeEnter: time[bar_index],
        initPrice: high[bar_index - 1],
        id: arrayStatistics.length + 1,
      };
      arrayStatistics.push(addItem);
      lastLow = low[bar_index - 1];
      countOpened += 1;
    }

    // SHORT
    //  inDateRange && condBarsIgnore
    if (bearish_TAR && condBarsIgnore) {
      entryPriceShort.push(low[bar_index - 1]);
      entryPriceDisplayShort.push(low[bar_index - 1]);
      entryBarindexShort.push(bar_index);
      let addItem = {
        entrySignal: "BearTAR",
        barIndex: bar_index,
        exitPrice: null,
        timeEnter: time[bar_index],
        initPrice: low[bar_index - 1],
        id: arrayStatistics.length + 1,
      };
      arrayStatistics.push(addItem);
      lastHigh = high[bar_index - 1];
      countOpened += 1;
    }

    //CLOSED BY SL
    //LONG
    if (low[bar_index] < lastLow && entryBarindexLong.length > 0) {
      closedBySL = true;
      if (
        entryPriceLong.length > 0 &&
        bar_index > entryBarindexLong[entryBarindexLong.length - 1]
      )
        entryPriceLong.forEach((el, index) => {
          countClosedBySLLong += 1;
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexLong[index]
          );

          if (elIndex) {
            totalProfit += countTakeProfitPerTrade(
              entryPriceLong[index],
              lastLow,
              order
            );
            arrayStatistics[elIndex] = {
              ...arrayStatistics[elIndex],
              timeExit: time[bar_index],
              signalExit: "SL",
              exitPrice: lastLow,
              profit: countTakeProfitPerTrade(
                entryPriceLong[index],
                lastLow,
                order
              ),
              barIndexExit: bar_index,
            };
          }
        });
      entryPriceLong = [];
      entryBarindexLong = [];
    }
    // SHORT
    if (high[bar_index] > lastHigh && entryBarindexShort.length > 0) {
      closedBySL = true;
      if (
        entryPriceShort.length > 0 &&
        bar_index > entryBarindexShort[entryBarindexShort.length - 1]
      )
        entryPriceShort.forEach((el, index) => {
          countClosedBySLShort += 1;
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexShort[index]
          );
          if (elIndex) {
            totalProfit +=
              countTakeProfitPerTrade(
                +entryPriceShort[index],
                +lastHigh,
                +order
              ) * -1;

            arrayStatistics[elIndex] = {
              ...arrayStatistics[elIndex],
              timeExit: time[bar_index],
              signalExit: "SL",
              exitPrice: lastHigh,
              profit:
                countTakeProfitPerTrade(
                  +entryPriceShort[index],
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

    // CLOSED BY REVERSAL
    // LONG
    if (bearishReversal) {
      if (entryPriceLong.length > 0) {
        closePriceLong.push(low[bar_index - 1]);
        closePriceDisplayLong.push(low[bar_index - 1]);
        entryPriceLong.forEach((el, index) => {
          if (
            bar_index - entryBarindexLong[entryBarindexLong.length - 1] >
            barsCloseReversal
          ) {
            closeByReversal = true;

            totalProfit += countTakeProfitPerTrade(
              entryPriceLong[index],
              low[bar_index - 1],
              order
            );
            countClosedByBearishReversal += 1;
            let elIndex = findIndexByBarIndex(
              arrayStatistics,
              entryBarindexLong[index]
            );
            arrayStatistics[elIndex] = {
              ...arrayStatistics[elIndex],
              timeExit: time[bar_index],
              signalExit: "Reversal",
              exitPrice: low[bar_index - 1],
              profit: countTakeProfitPerTrade(
                entryPriceLong[index],
                low[bar_index - 1],
                order
              ),
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
        entryPriceShort.push(low[bar_index - 1]);
        closePriceDisplayShort.push(low[bar_index - 1]);

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

    // CLOSED BY BAR INDEX
    //LONG
    if (entryBarindexLong.length > 0 && entryPriceLong.length > 0) {
      entryBarindexLong.forEach((el, index) => {
        if (entryPriceLong.length > 0) {
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
            let elIndex = findIndexByBarIndex(arrayStatistics, el);
            arrayStatistics[elIndex] = {
              ...arrayStatistics[elIndex],
              timeExit: time[bar_index],
              signalExit: "Bars",
              exitPrice: open[bar_index],
              profit: countTakeProfitPerTrade(
                entryPriceLong[index],
                open[bar_index],
                order
              ),
              barIndexExit: bar_index,
            };
            entryPriceLong.splice(index, 1);
            entryBarindexLong.splice(index, 1);
          }
        }
      });
    }

    //SHORT
    if (entryBarindexShort.length > 0 && entryPriceShort.length > 0) {
      entryBarindexShort.forEach((el, index) => {
        if (entryPriceShort.length > 0) {
          if (
            bar_index - barsClose >=
            entryBarindexShort[entryBarindexShort.length - 1]
          ) {
            countClosedByBarCount += 1;
            closedByBars = true;
            totalProfit +=
              countTakeProfitPerTrade(
                entryPriceShort[index],
                open[bar_index],
                order
              ) * -1;
            let elIndex = findIndexByBarIndex(
              arrayStatistics,
              entryBarindexShort[index]
            );
            arrayStatistics[elIndex] = {
              ...arrayStatistics[elIndex],
              timeExit: time[bar_index],
              signalExit: "Bars",
              exitPrice: open[bar_index],
              profit:
                countTakeProfitPerTrade(
                  entryPriceShort[index],
                  open[bar_index],
                  order
                ) * -1,
              barIndexExit: bar_index,
            };
            entryPriceShort.splice(index, 1);
            entryBarindexShort.splice(index, 1);
          }
        }
      });
    }

    //CLOSED BY  TAKE PROFIT BY PERCENTAGE
    //LONG
    if (entryPriceLong.length > 0) {
      entryPriceLong.forEach((el, index) => {
        if (
          entryPriceLong[entryPriceLong.length - 1] *
            ((100 + profitPercantage) / 100) <=
            close[bar_index] &&
          bar_index > entryBarindexLong[entryBarindexLong.length - 1]
        ) {
          countClosedByProfitLong += 1;
          closedByTP = true;
          totalProfit += countTakeProfitPerTrade(
            entryPriceLong[index],
            entryPriceLong[index] * ((100 + profitPercantage) / 100),
            order
          );
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexLong[index]
          );
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "TP",
            exitPrice: open[bar_index],
            profit: countTakeProfitPerTrade(
              entryPriceLong[index],
              open[bar_index],
              order
            ),
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
          entryPriceShort[entryPriceShort.length - 1] *
            ((100 + profitPercantage) / 100) <=
            close[bar_index] &&
          bar_index > entryBarindexShort[entryBarindexShort.length - 1]
        ) {
          countClosedByProfitShort += 1;
          closedByTP = true;
          totalProfit +=
            countTakeProfitPerTrade(
              entryPriceShort[index],
              entryPriceShort[index] * ((100 + profitPercantage) / 100),
              order
            ) * -1;
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexShort[index]
          );
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "TP",
            exitPrice: open[bar_index],
            profit:
              countTakeProfitPerTrade(
                entryPriceShort[index],
                open[bar_index],
                order
              ) * -1,
            barIndexExit: bar_index,
          };
          entryPriceShort.splice(index, 1);
          entryBarindexShort.splice(index, 1);
        }
      });
    }
  });

  let profit = 0;
  let unclosed_arr = [];
  let closed = { unclosed: 0 };
  arrayStatistics.forEach((el) => {
    if (el.profit && el.profit != null) {
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

  console.log("STATISTIC", arrayStatistics.length);
  console.log("PROFIT", profit);
  // console.log("UNCLOSED", unclosed_arr);
  console.log("CLOSED", closed);
};
