const express = require("express");
const router = express.Router();
const ejs = require("ejs");
const fs = require("fs");
const homeController = require("../controllers/home");
let routes = (app) => {
  router.get("/", homeController.getHome);
  router.post("/build_strategy", homeController.setStrategy);
  router.get("/buildStrategy/:name", homeController.buildStrategyPage);
  return app.use("/", router);
};

module.exports = routes;
