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

const calculateProfit = require("./pine_to_js_api");
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/frontend/index.html");
});

app.get("/hello", (req, res) => {
  console.log("HELLO");
});

app.post("/calculate", function (req, res) {
  console.log("REQQQQQQQQq", req.body);
  calculateProfit("a", "b");
  res.sendStatus(200);
});
