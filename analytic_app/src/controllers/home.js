const path = require("path");
const ejs = require("ejs");
const fs = require("fs");

let STRATEGIES_CONFIG = null;

fs.readFile("./src/config/configStrategies.json", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  data = JSON.parse(data);
  STRATEGIES_CONFIG = data;
});

const home = (req, res) => {
  //return res.sendFile(path.join(`${__dirname}/../views/index.html`));
  return ejs.renderFile(
    path.join(`${__dirname}/../views/home.ejs`),
    { strategy: STRATEGIES_CONFIG },
    {},
    function (err, template) {
      if (err) {
        throw err;
      } else {
        res.end(template);
      }
    }
  );
};

const buldStrategyPage = (req, res) => {
  let params = req.params;

  if (params) {
    return ejs.renderFile(
      path.join(`${__dirname}/../views/index.ejs`),
      { strategy: STRATEGIES_CONFIG[0] },
      {},
      function (err, template) {
        if (err) {
          console.log(err);
          throw err;
        } else {
          res.end(template);
        }
      }
    );
  }
};

const strategy = (req, res) => {
  console.log("req.body", req.body);
  let body = req.body;
  return ejs.renderFile(
    path.join(`${__dirname}/../views/index.ejs`),
    { test: body.name },
    {},
    function (err, template) {
      if (err) {
        console.log(err);
        throw err;
      } else {
        console.log(template);
        res.redirect("/buildStrategy");
        // res.end(template);
      }
    }
  );
};

module.exports = {
  getHome: home,
  buildStrategyPage: buldStrategyPage,
  setStrategy: strategy,
};
