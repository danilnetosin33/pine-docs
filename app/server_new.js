const calculateProfit = require("./pine_to_js_api");

const bodyParser = require("body-parser");
const path = require("path");
var express = require("express"),
  app = express(),
  port = 80;
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
  if (
    Object.keys(settings.dataSettings).length > 0 &&
    Object.keys(settings.configSettings).length > 0
  ) {
    // TODO :::  forEach for all cases of ranges run calculateProfit
    calculateProfit(settings.dataSettings, settings.configSettings);
  }
  res.sendStatus(200);
});
