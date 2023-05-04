const bodyParser = require("body-parser");
var express = require("express"),
  app = express(),
  port = 5500;
app.use(express.json());
app.use(bodyParser.json({ extended: true }));
app.listen(port);

const calculateProfit = require("./pine_to_js_api");
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.post("/calculate", function (req, res) {
  console.log("REQQQQQQQQq", req.body);
  calculateProfit("a", "b");
  res.sendStatus(200);
});
