const dotenv = require("dotenv").config();
const connection = require("../db/connection");

const index = (req, res) => {
  const sql = "SELECT * FROM pc;";

  connection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        err: err.message,
      });
    }
    //console.log(results);
    res.json(results);
  });
};
module.exports = { index };
