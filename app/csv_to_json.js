// CSV work
const csv = require("csvtojson");
async function readCSV(data, file) {
  function parseToJson(json) {
    json.forEach((row) => {
      let row_obj = {};
      let keys = Object.keys(row)[0].split(",");
      let values = Object.values(row)[0].split(",");
      keys.forEach((key, index) => {
        row_obj[key] = values[index];
      });
      data.unshift(row_obj);
    });
  }
  let csv_obj = await csv({ delimiter: ";" }).fromFile(file);
  parseToJson(csv_obj);
}

let apple = {};
let amazon = {};
let google = {};
let miscrosoft = {};
let nvidia = {};
let tesla = {};

let timeframes = ["1H", "4H", "1D", "1W", "1M"];

timeframes.forEach((tf) => {
  apple[tf] = [];
  readCSV(apple[tf], `./assets/CSV/AAPL/AAPL, ${tf}.csv`);

  amazon[tf] = [];
  readCSV(amazon[tf], `./assets/CSV/AMZN/AMZN, ${tf}.csv`);

  google[tf] = [];
  readCSV(google[tf], `./assets/CSV/GOOGL/GOOGL, ${tf}.csv`);

  nvidia[tf] = [];
  readCSV(nvidia[tf], `./assets/CSV/NVDA/NVDA, ${tf}.csv`);

  miscrosoft[tf] = [];
  readCSV(miscrosoft[tf], `./assets/CSV/MSFT/MSFT, ${tf}.csv`);

  tesla[tf] = [];
  readCSV(tesla[tf], `./assets/CSV/TSLA/TSLA, ${tf}.csv`);
});

// const alert = require("alert");
// alert("howdy");
// const notifier = require("node-notifier");
// notifier.notify("Hello!");
var fs = require("fs");

setTimeout(() => {
  Object.keys(tesla).forEach((tf) => {
    fs.writeFile(
      `./assets/JSON/TSLA/TSLA, ${tf}.json`,
      JSON.stringify(tesla[tf]),
      function (err) {
        if (err) throw err;
        else {
          console.log("Saved!");
        }
      }
    );
  });
  Object.keys(miscrosoft).forEach((tf) => {
    fs.writeFile(
      `./assets/JSON/MSFT/MSFT, ${tf}.json`,
      JSON.stringify(miscrosoft[tf]),
      function (err) {
        if (err) throw err;
        else {
          console.log("Saved!");
        }
      }
    );
  });
  Object.keys(nvidia).forEach((tf) => {
    fs.writeFile(
      `./assets/JSON/NVDA/NVDA, ${tf}.json`,
      JSON.stringify(nvidia[tf]),
      function (err) {
        if (err) throw err;
        else {
          console.log("Saved!");
        }
      }
    );
  });
  Object.keys(google).forEach((tf) => {
    fs.writeFile(
      `./assets/JSON/GOOGL/GOOGL, ${tf}.json`,
      JSON.stringify(google[tf]),
      function (err) {
        if (err) throw err;
        else {
          console.log("Saved!");
        }
      }
    );
  });
  Object.keys(amazon).forEach((tf) => {
    fs.writeFile(
      `./assets/JSON/AMZN/AMZN, ${tf}.json`,
      JSON.stringify(amazon[tf]),
      function (err) {
        if (err) throw err;
        else {
          console.log("Saved!");
        }
      }
    );
  });
  Object.keys(apple).forEach((tf) => {
    fs.writeFile(
      `./assets/JSON/AAPL/AAPL, ${tf}.json`,
      JSON.stringify(apple[tf]),
      function (err) {
        if (err) throw err;
        else {
          console.log("Saved!");
        }
      }
    );
  });
}, 3000);
