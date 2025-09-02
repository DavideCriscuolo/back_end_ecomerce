const mysql = require("mysql2");
const credentials = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  database: process.env.DB_NAME,
};

const connection = mysql.createConnection(credentials);

console.log(connection);

connection.connect((err) => {
  if (err) {
    console.log(err.message);
    console.log(
      process.env.DB_HOST,
      process.env.DB_USER,
      process.env.DB_PW,
      process.env.DB_NAME
    );
  } else {
    console.log("Connection Success");
  }
});

module.exports = connection;
