import { parentPort, workerData } from "worker_threads";
import calculateProfit from "./calculateProfit.js";

function buildResult(
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
  obj = {
    ...obj,
    orderCall: "Both",
    bars: symbol_bars_data,
  };
  return calculateProfit(obj);

  results[symbol_bars].push(calculateProfit(obj));
}

// console.log("workerData", JSON.stringify(workerData));

let result_arr = [];
workerData.arr.forEach((arr, arrIndex) => {
  result_arr.push(
    buildResult(
      arr,
      workerData.alias,
      workerData.configSettings,
      workerData.symbol_bars,
      workerData.symbol_bars_data
    )
  );
});

parentPort.postMessage({
  result: result_arr,
});
