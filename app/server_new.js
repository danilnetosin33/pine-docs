// import { parentPort, workerData } from "worker_threads";
import { Worker, workerData, parentPort } from "worker_threads";

import calculateProfit from "./calculateProfit.js";
import async from "async";
import open from "open";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import express from "express";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
var app = express();
var port = 4020;
app.use(express.json());
app.use(bodyParser.json({ extended: true }));
app.listen(port, (err) => {
  if (err) {
    console.log("ERROR", err);
  } else {
    open(`http://localhost:${port}/`);
  }
});
app.use(express.static(__dirname));
app.use(express.static("assets"));
app.use(express.static("frontend"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/frontend/index.html");
});

app.post("/calculate", function (req, res) {
  let settings = req.body;
  // GET BARS DATA
  let symbols = [...settings.dataSettings.symbols];
  let allSymbolsBars = {};

  symbols.forEach(async (symbol) => {
    let path = `./assets/JSON/${symbol}/${symbol}, ${settings.dataSettings.timeframe}.json`;
    let bars_data = require(path);

    //console.log("BARS_PATH" , path)
    // console.log("BARS_DATA", bars_data);

    //FILTER BARS BY DATE RANGE
    let date_from = new Date(settings.dataSettings.date.from).getTime();
    let date_to = new Date(settings.dataSettings.date.to).getTime();
    bars_data = bars_data.filter(
      (el) => +el.time + "000" >= date_from && +el.time + "000" < date_to
    );
    //FILTER BARS BY TRADING HOURS

    if (
      settings.dataSettings.timeframe != "1D" &&
      settings.dataSettings.timeframe != "1W" &&
      settings.dataSettings.timeframe != "1M"
    ) {
      bars_data = bars_data.filter((el) => {
        let date = new Date(Number(el.time + "000"));
        let hours = date.getHours();
        let day = date.getDay();
        hours = hours.toString();
        if (hours.length == 1) {
          hours = "0" + hours;
        }
        let minutes = date.getMinutes();
        minutes = minutes.toString();
        if (minutes.length == 1) {
          minutes += "0";
        }
        let session = `${hours}${minutes}`;
        let inSession = false;

        let th = settings.dataSettings.trading_hours;
        if (settings.dataSettings.isAdvancedTradingHours) {
          let tradingHoursDays = [
            settings.dataSettings.sunday_trading_hours,
            settings.dataSettings.monday_trading_hours,
            settings.dataSettings.tuesday_trading_hours,
            settings.dataSettings.wednesday_trading_hours,
            settings.dataSettings.thursday_trading_hours,
            settings.dataSettings.friday_trading_hours,
            settings.dataSettings.saturday_trading_hours,
          ];
          th = tradingHoursDays[day];
        }
        th.forEach((th_el) => {
          if (th_el.from <= session && th_el.to >= session) {
            inSession = true;
          }
        });
        if (inSession) {
          return el;
        }
      });
    }

    bars_data = bars_data.reverse();
    allSymbolsBars[symbol] = bars_data;
  });

  let configSettings = {};
  // let configSettings = {
  //   barsClose: settings.configSettings.barsClose,
  //   barsCloseReversal: settings.configSettings.barsCloseReversal,
  //   barsIgnore: settings.configSettings.barsIgnore,
  //   profitPercantage: settings.configSettings.profitPercantage,
  // };
  let disabledCriterias = [];

  let addParametr = (fullObj, key) => {
    if (!(fullObj[key].length == 1 && fullObj[key][0] == 0)) {
      configSettings[key] = fullObj[key];
    } else {
      disabledCriterias.push(key);
    }
  };

  // ADD PARAMETRS
  addParametr(settings.configSettings, "barsClose");
  addParametr(settings.configSettings, "barsCloseReversal");
  addParametr(settings.configSettings, "barsIgnore");
  addParametr(settings.configSettings, "profitPercantage");

  if (settings.configSettings.enableCCI) {
    configSettings.cciLength = settings.configSettings.cciLength;
    configSettings.cciValue = settings.configSettings.cciValue;
  }

  console.log("RESULT", configSettings);

  // CASE ADD CCI

  // CHECK profit => if profit == 0  => delete from params

  // BUILD ALL CASES PARAMS
  console.time("Build_params");
  let fullResult = buildParams(configSettings); // less options => add profit : 0 ,
  let arrParams = fullResult.resultModified;

  console.log("QQQQ", arrParams.length);

  // console.log(arrParams[0]);

  console.timeEnd("Build_params");
  let alias = fullResult.alias;
  //let results = [];
  let results = {};

  // PREPARE CASES
  let counter = 0;
  let temp = Math.floor(arrParams.length / 10);
  let workerNumber = temp < 200 ? 200 : temp;
  let workerCounter = 0;
  let arrWorkers = [];
  arrParams.forEach((el, index) => {
    if (index % workerNumber == 0) {
      arrWorkers.push(
        arrParams.slice(workerCounter, workerCounter + workerNumber)
      );
      workerCounter += workerNumber;
    }
  });

  console.time("Total_calc");

  Object.keys(allSymbolsBars).forEach((symbol_bars, index) => {
    let startPartNumber = index * arrParams.length;

    if (!results[symbol_bars]) {
      results[symbol_bars] = [];
    }

    // console.time(`CALC_${symbol_bars}`);

    console.log("DDDD", symbol_bars.length, allSymbolsBars[symbol_bars].length);

    // build arr [[]]
    // for each

    arrWorkers.forEach((arr, arrIndex) => {
      console.log(allSymbolsBars[symbol_bars].slice().length);
      let worker = new Worker("./webworker_calculate.js", {
        workerData: {
          arr,
          alias,
          configSettings,
          symbol_bars,
          symbol_bars_data: allSymbolsBars[symbol_bars],
          orderCall: settings.configSettings.orderCall,
          disabledCriterias,
        },
      });
      worker.once("message", (result) => {
        // push
        // if arr.length == arrParams => send
        counter++;
        results[symbol_bars].push(result.result);
        if (
          counter * workerNumber >=
          arrParams.length * Object.keys(allSymbolsBars).length
        ) {
          Object.keys(results).forEach((result) => {
            let result_temp = [];
            results[result].forEach((el) => {
              result_temp = result_temp.concat(el);
            });
            results[result] = result_temp;
          });
          res.json(results);
          console.timeEnd("Total_calc");
          console.log("RESULTS:", Object.keys(results));
          //       console.timeEnd(`CALC_${symbol_bars}`);
        }
        console.log(`Worker : `, counter);
      });
    });

    // async.eachOfLimit(arrParams, 100, (arr, arrIndex, cb) => {
    //   if (startPartNumber + arrIndex >= percentPart * countParts) {
    //     countParts += 1;
    //     console.log("OVER 5%", countParts * 5);
    //   }

    //   try {
    //     buildResult(
    //       results,
    //       arr,
    //       alias,
    //       configSettings,
    //       symbol_bars,
    //       allSymbolsBars[symbol_bars]
    //     );
    //     //cb();
    //   } catch (err) {
    //     //cb(err);
    //   }
    // });
    // .then(() => {
    //   res.json(results);
    // })
    // .catch((err) => {
    //   console.log("ERROR:", err);
    // });
  });
});

function buildParams(params) {
  let inputObj = params || {
    var1: [2, 3, 4, 5, 6, 7, 8],
    var2: [2, 3, 4, 5, 6, 7, 8],
    var3: [2, 3, 4, 5, 6, 7, 8],
    var4: [2, 3, 4, 5, 6, 7, 8],
  };

  // let var1 = [2,3,4,5,6,7,8]
  // let var2 = [2, 3, 4, 5, 6, 7, 8]
  // let var3 = [2, 3, 4, 5, 6, 7, 8]
  // let var4 = [2, 3, 4, 5, 6, 7, 8]
  let arrTotal = [];
  Object.keys(inputObj).forEach((key) => {
    arrTotal.push(inputObj[key]);
  });

  //console.log("ARR_TOTAL", arrTotal);

  let fillAlias = (arrOfArray) => {
    let resultArr = [];
    let alias = {};
    arrOfArray.forEach((arr, indexOutter) => {
      arr.forEach((el, indexInner) => {
        resultArr.push(`index${indexOutter}_${indexInner}`);
        alias[`index${indexOutter}_${indexInner}`] = el;
      });
    });
    return { resultArr, alias };
  };

  let arrFull = fillAlias(arrTotal);
  //console.log("ARRAY_FULL", arrFull);
  let arr = arrFull.resultArr;
  let alias = arrFull.alias;

  let modify = (originalArr, variables) => {
    let resultZboubNew = originalArr.map((el) =>
      el.slice(0, variables).join("AAA")
    );
    let resultNew = Array.from(new Set(resultZboubNew)).map((el) =>
      el.split("AAA")
    );
    resultNew = resultNew.filter((el, indexOutter) => {
      let isValid = 0;
      el.forEach((elInner, index) => {
        if (elInner.includes("index" + index)) {
          isValid++;
        }
      });
      return el.length == isValid;
    });
    return resultNew;
  };

  const permutator = (inputArr, variable) => {
    let result = [];
    const permute = (arr, m = []) => {
      if (arr.length === 0 || m.length == variable) {
        result.push(m);
      } else {
        for (let i = 0; i < arr.length; i++) {
          let curr = arr.slice();
          let next = curr.splice(i, 1);
          // TODO TEST
          let isValid = 0;
          m.forEach((elInner, index) => {
            if (elInner.includes("index" + index)) {
              isValid++;
            }
          });
          if (!m[0] || (isValid == m.length && m.length <= variable))
            permute(curr.slice(), m.concat(next));
        }
      }
    };

    permute(inputArr);
    return result;
  };

  let result = permutator(arr, arrTotal.length);
  // MODIFIED RESULT
  let resultModified = modify(result, arrTotal.length);
  // console.log("MODIFIED_RESULT", resultModified);

  // FINAL RESULT AND TRANSLATED
  // resultModified.forEach((arr, index) => {
  //   if (index < 10) {
  //     let worker = new Worker("exampleWorker.js", { type: "module" });
  //     let arrTranslated = arr.map((el) => alias[el]);
  //     console.log("ARR_TRANSLAED", arrTranslated);
  //     worker.postMessage(arrTranslated);

  //     worker.onmessage = function (event) {
  //       console.log("RESULT WEB WORKER", event.data);
  //     };
  //   }

  //   // call webworker  and set varaibles
  // });

  // ADD WEBWORKERS

  return { resultModified, alias };
}

function buildResult(
  results,
  arr,
  alias,
  configSettings,
  symbol_bars,
  symbol_bars_data
) {
  let arrTranslated = arr.map((el) => alias[el]);
  let obj = {};
  Object.keys(configSettings).forEach((key, index) => {
    obj[key] = arrTranslated[index];
  });

  console.log("OBJ", obj);
  obj = {
    ...obj,
    orderCall: "Both",
    bars: symbol_bars_data,
  };
  return calculateProfit(obj);

  results[symbol_bars].push(calculateProfit(obj));
}

// func async count ()
// delete first for eech
