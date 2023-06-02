export default function calculateProfit(config) {
  // console.log("CONFIG", config);
  // TODO calculate CCI

  let len = config.cciLength; // parametr
  let valueCCI = config.valueCCI;

  // console.log("MA", ma, "DEV", dev, "CCI", cci);

  // Config settings
  let orderCall = config.orderCall || "Both";
  let barsCloseReversal = config.barsCloseReversal || 5;
  let barsClose = config.barsClose || 5;
  let barsIgnore = config.barsIgnore || 5;
  let profitPercantage = config.profitPercantage || 5;
  let order = 1000;

  // Bars Data
  let bars_data = config.bars;
  let low = bars_data.map((el) => el.low);
  let high = bars_data.map((el) => el.high);
  let close = bars_data.map((el) => el.close);
  let open = bars_data.map((el) => el.open);
  let time = bars_data.map((el) => el.time);

  // VARIABLES
  // main
  var arrayStatistics = [];
  var lastLow = 0.0;
  var lastHigh = 0.0;
  // long
  var lastReversalBarsLong = [];
  var entryPriceLong = [];
  var entryBarindexLong = [];
  // short
  var lastReversalBarsShort = [];
  var entryPriceShort = [];
  var entryBarindexShort = [];

  var bearishReversal = undefined;
  var bullishReversal = undefined;
  var bullish_TAR = undefined;
  var bearish_TAR = undefined;

  var isProfitPercantage = profitPercantage > 0.0;
  var isBarsClose = barsClose > 0;
  var isBarsCloseReversal = barsCloseReversal > 0;

  // UTILS FUNCTIONS
  function countTakeProfitPerTrade(initPrice, lastPrice, order) {
    return (order / initPrice) * (lastPrice - initPrice);
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

    // COUNT CCI
    let cci = undefined;
    let src = undefined;
    let isEnableCCICriteria =
      config.cciLength && config.cciValue && close > len;

    // console.log(
    //   "criteria",
    //   isEnableCCICriteria,
    //   config.cciLength,
    //   config.cciValue,
    //   bar_index > len
    // );
    if (isEnableCCICriteria) {
      // TODO HERE
      src = close.slice(bar_index - len, bar_index);

      let ma = src.reduce((a, b) => a + b, 0) / len;
      let dev =
        src.map((el) => Math.abs(el - ma)).reduce((a, b) => a + b, 0) / len;

      // cci = (close - ma) / (0.015 * ta.dev(close, 3))
      cci = (src[2] - ma) / (0.015 * dev);
      console.log("CCI", cci);
    }

    var conditionCloseLong = cci > valueCCI;
    let conditionCloseShort = cci < -1 * valueCCI;
    let conditionCCIEnterLong = isEnableCCICriteria
      ? !conditionCloseLong
      : true;
    let conditionCCIEnterShort = isEnableCCICriteria
      ? !conditionCloseShort
      : true;

    //cci

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
    if (lastReversalBarsLong.length > 0 && barsCloseReversal > 0) {
      let temp_el = lastReversalBarsLong[lastReversalBarsLong.length - 1];
      temp_el.isOutter = temp_el.barLow > low[bar_index];
      if (bar_index - temp_el.barIndex < barsCloseReversal) {
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
    if (lastReversalBarsShort.length > 0 && barsCloseReversal > 0) {
      let temp_el = lastReversalBarsShort[lastReversalBarsShort.length - 1];
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

    // LONG
    // inDateRange && condBarsIgnore
    if (bullish_TAR && condBarsIgnore && conditionCCIEnterLong) {
      let countEntryPrice =
        open[bar_index] > high[bar_index - 1]
          ? open[bar_index]
          : high[bar_index - 1];
      entryPriceLong.push(countEntryPrice);
      entryBarindexLong.push(bar_index);
      let addItem = {
        entrySignal: "BullTAR",
        barIndex: bar_index,
        exitPrice: null,
        timeEnter: time[bar_index],
        timeTransformed: new Date(+(time[bar_index] + "000")).toDateString(),
        initPrice: countEntryPrice,
        id: arrayStatistics.length + 1,
      };
      arrayStatistics.push(addItem);
      lastLow = low[bar_index - 1];
    }
    // SHORT
    //  inDateRange && condBarsIgnore
    if (bearish_TAR && condBarsIgnore && conditionCCIEnterShort) {
      let countEntryPrice =
        low[bar_index - 1] > open[bar_index]
          ? open[bar_index]
          : low[bar_index - 1];

      entryPriceShort.push(countEntryPrice);
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
    }

    //CLOSED BY SL
    //LONG
    if (low[bar_index] < lastLow && entryBarindexLong.length > 0) {
      if (
        entryPriceLong.length > 0 &&
        bar_index > entryBarindexLong[entryBarindexLong.length - 1]
      ) {
        entryPriceLong.forEach((el, index) => {
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexLong[index]
          );

          if (elIndex != -1) {
            arrayStatistics[elIndex] = {
              ...arrayStatistics[elIndex],
              timeExit: time[bar_index],
              signalExit: "SL",
              exitPrice: lastLow,
              profit: countTakeProfitPerTrade(
                arrayStatistics[elIndex].initPrice,
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
    }
    // SHORT
    if (high[bar_index] > lastHigh && entryBarindexShort.length > 0) {
      if (
        entryPriceShort.length > 0 &&
        bar_index > entryBarindexShort[entryBarindexShort.length - 1]
      ) {
        entryPriceShort.forEach((el, index) => {
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
    // LONG
    if (bearishReversal) {
      if (entryPriceLong.length > 0) {
        entryPriceLong.forEach((el, index) => {
          if (
            bar_index - entryBarindexLong[entryBarindexLong.length - 1] >
            barsCloseReversal
          ) {
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
                arrayStatistics[elIndex].initPrice,
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
        entryPriceShort.forEach((el, index) => {
          if (
            bar_index - entryBarindexShort[entryPriceShort.length - 1] >
            barsCloseReversal
          ) {
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
                  arrayStatistics[elIndex].initPrice,
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
    //LONG
    if (entryPriceLong.length > 0 && isProfitPercantage) {
      for (let index = entryPriceLong.length - 1; index >= 0; index--) {
        let TP_price =
          entryPriceLong[entryPriceLong.length - 1] *
          ((100 + profitPercantage) / 100);
        if (
          TP_price <= close[bar_index] &&
          bar_index > entryBarindexLong[entryBarindexLong.length - 1]
        ) {
          let elIndex = findIndexByBarIndex(
            arrayStatistics,
            entryBarindexLong[index]
          );
          arrayStatistics[elIndex] = {
            ...arrayStatistics[elIndex],
            timeExit: time[bar_index],
            signalExit: "TP",
            exitPrice: TP_price,
            profit: countTakeProfitPerTrade(
              arrayStatistics[elIndex].initPrice,
              TP_price,
              order
            ),
            barIndexExit: bar_index,
          };
          entryPriceLong.splice(index, 1);
          entryBarindexLong.splice(index, 1);
        }
      }
    }
    //SHORT
    if (entryPriceShort.length > 0 && isProfitPercantage) {
      for (let index = entryPriceShort.length - 1; index >= 0; index--) {
        let TP_price =
          (entryPriceShort[entryPriceShort.length - 1] *
            (100 - profitPercantage)) /
          100;
        if (
          TP_price >= low[bar_index] &&
          bar_index > entryBarindexShort[entryBarindexShort.length - 1]
        ) {
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
    //LONG
    if (entryBarindexLong.length > 0 && entryPriceLong.length > 0) {
      for (let index = entryBarindexLong.length - 1; index >= 0; index--) {
        if (entryPriceLong.length > 0) {
          if (
            bar_index - barsClose >=
              entryBarindexLong[entryBarindexLong.length - 1] &&
            isBarsClose
          ) {
            let elIndex = findIndexByBarIndex(
              arrayStatistics,
              entryBarindexLong[index]
            );
            arrayStatistics[elIndex] = {
              ...arrayStatistics[elIndex],
              timeExit: time[bar_index],
              signalExit: "Bars",
              exitPrice: open[bar_index],
              profit: countTakeProfitPerTrade(
                arrayStatistics[elIndex].initPrice,
                open[bar_index],
                order
              ),
              barIndexExit: bar_index,
            };
            entryPriceLong.splice(index, 1);
            entryBarindexLong.splice(index, 1);
          }
        }
      }
    }
    //SHORT
    if (entryBarindexShort.length > 0 && entryPriceShort.length > 0) {
      for (let index = entryBarindexShort.length - 1; index >= 0; index--) {
        if (entryPriceShort.length > 0) {
          if (
            bar_index - barsClose >=
              entryBarindexShort[entryBarindexShort.length - 1] &&
            isBarsClose
          ) {
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

    // START CCI

    if (
      conditionCloseLong &&
      isEnableCCICriteria &&
      entryBarindexLong.length > 0 &&
      entryPriceLong.length > 0
    ) {
      for (let i = entryPriceLong.length - 1; i >= 0; i--) {
        countClosedByCCICriteriaLong += 1;
        totalProfit += countTakeProfitPerTrade(
          array.get(entryPriceLong, i),
          close,
          order
        );
        elIndex = findIndexByBarIndex(
          arrayStatistics,
          array.get(entryBarindexLong, i)
        );
        el = array.get(arrayStatistics, elIndex);
        //str.format("{0,date,HH:mm:ss dd/MM/yyyy}", time)
        el.timeExit = time;
        el.signalExit = "CCI Long";
        el.exitPrice = close;
        el.profit = countTakeProfitPerTrade(
          array.get(entryPriceLong, i),
          close,
          order
        );
        el.barIndexExit = bar_index;
      }
    }

    //array.set(arrayStatistics , elIndex , el   )
    entryPriceLong = [];
    entryBarindexLong = [];

    // // SHORT
    if (
      conditionCloseShort &&
      isEnableCCICriteria &&
      entryBarindexShort.size() > 0 &&
      entryPriceShort.size() > 0
    ) {
      for (let i = entryPriceShort.length - 1; i >= 0; i--) {
        totalProfit += countTakeProfitPerTrade(
          array.get(entryPriceShort, i),
          close,
          order
        );
        elIndex = findIndexByBarIndex(
          arrayStatistics,
          array.get(entryBarindexShort, i)
        );
        el = array.get(arrayStatistics, elIndex);
        //str.format("{0,date,HH:mm:ss dd/MM/yyyy}", time)
        el.timeExit = time;
        el.signalExit = "CCI Short";
        el.exitPrice = close;
        el.profit = countTakeProfitPerTrade(
          array.get(entryPriceShort, i),
          close,
          order
        );
        el.barIndexExit = bar_index;
      }

      entryPriceShort = [];
      entryBarindexShort = [];
    }
  });
  // FINISH CCI

  // Profit calculate + info about orders
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
  // console.log("All orders :", arrayStatistics.length);
  // console.log("PROFIT : ", profit);
  // console.log("Orders status: ", closed);
  delete config["bars"];

  return { profit, orders: arrayStatistics.length, ...config };
}
