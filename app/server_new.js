const calculateProfit = require("./calculateProfit");

const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("node:worker_threads");

const bodyParser = require("body-parser");
const path = require("path");
var express = require("express"),
  app = express(),
  port = 4020;
app.use(express.json());
app.use(bodyParser.json({ extended: true }));
app.listen(port);
app.use(express.static(__dirname));
app.use(express.static("assets"));
app.use(express.static("frontend"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/frontend/index.html");
});

app.post("/calculate", function (req, res) {
  let settings = req.body;
  //console.log("SETTINGS", settings);
  // GET BARS DATA

  let symbols = ["AAPL", "AMZN"]; //, "GOOGL", "MSFT", "NVDA", "TSLA"
  let allSymbolsBars = {};

  symbols.forEach((symbol) => {
    let path = `./assets/JSON/${symbol}/${symbol}, ${settings.dataSettings.timeframe}.json`;
    let bars_data = require(path);
    //FILTER DATE RANGE
    let date_from = new Date(settings.dataSettings.date.from).getTime();
    let date_to = new Date(settings.dataSettings.date.to).getTime();
    bars_data = bars_data.filter(
      (el) => +el.time + "000" >= date_from && +el.time + "000" < date_to
    );
    bars_data = bars_data.reverse();
    allSymbolsBars[symbol] = bars_data;
  });

  let configSettings = {
    barsClose: settings.configSettings.barsClose,
    barsCloseReversal: settings.configSettings.barsCloseReversal,
    barsIgnore: settings.configSettings.barsIgnore,
    profitPercantage: settings.configSettings.profitPercantage,
  };

  // BUILD ALL CASES PARAMS
  let fullResult = buildParams(configSettings);
  let arrParams = fullResult.resultModified;
  let alias = fullResult.alias;

  //let results = [];
  let results = {};
  // PREPARE OBJECT

  Object.keys(allSymbolsBars).forEach((symbol_bars) => {
    if (!results[symbol_bars]) {
      results[symbol_bars] = [];
    }
    arrParams.forEach((arr, indexOutter) => {
      if (true || indexOutter < 10) {
        let worker = new Worker("./exampleWorker.js", { workerData: "heloo" });
        let arrTranslated = arr.map((el) => alias[el]);

        let obj = {};
        Object.keys(configSettings).forEach((key, index) => {
          obj[key] = arrTranslated[index];
        });

        obj = {
          ...obj,
          orderCall: settings.configSettings.orderCall,
          bars: allSymbolsBars[symbol_bars],
        };
        results[symbol_bars].push(calculateProfit(obj));

        // TODO FINISH WITH WORKERS

        // worker.on("message", (msg) => {
        //   console.log(msg);
        // });

        // worker.once("message", (message) => {
        //   console.log(message); // Prints 'Hello, world!'.
        // });
        // worker.postMessage("Hello, world!");

        // worker.onmessage = function (event) {
        //   // console.log("RESULT WEB WORKER", event.data);
        // };
      }

      // call webworker  and set varaibles
    });
  });

  console.log("RESULTS__", results.length);

  res.json(results);

  //res.status(200).send(results.length);
  //res.sendStatus(200);
});

// TODO FINISH
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

// if (
//   Object.keys(settings.dataSettings).length > 0 &&
//   Object.keys(settings.configSettings).length > 0
// ) {
//   // TODO :::  forEach for all cases of ranges run calculateProfit
//   calculateProfit(settings.dataSettings, settings.configSettings);
// }

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

  console.time("answer time");

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
