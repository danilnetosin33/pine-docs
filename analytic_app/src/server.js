const cors = require("cors");
const express = require("express");
const app = express();
const ejs = require("ejs");
const fs = require("fs");
let port = 8080;
const initRoutes = require("./routes");
const bodyParser = require("body-parser");
app.use(express.json());
app.use(bodyParser.json({ extended: true }));

app.use(express.static("src"));

app.use(express.static("config"));

// var corsOptions = {
//   origin: "http://localhost:8081"
// };

// app.use(cors(corsOptions));
// app.use(express.urlencoded({ extended: true }));
initRoutes(app);

app.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});
