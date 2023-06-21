const path = require("path");
const ejs = require("ejs");
const fs = require("fs");

const strategy = (req, res) => {
  console.log("req.body", req.body);
  let body = req.body;
  //return res.sendFile(path.join(`${__dirname}/../views/index.html`));
  return ejs.renderFile(
    path.join(`${__dirname}/../views/index.ejs`),
    { test: body.name },
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

module.exports = {
  getStrategy: strategy,
};
