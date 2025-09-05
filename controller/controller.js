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

const show = (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM pc WHERE id=?";

  connection.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        err: err.message,
      });
    }
    res.json(results[0]);
  });
};
const bestSellers = (req, res) => {
  const venduto = req.params.tag;
  const sql = "SELECT * FROM pc WHERE tag = ?;";

  connection.query(sql, [venduto], (err, results) => {
    if (err) {
      return res.status(500).json({
        err: err.message,
      });
    }
    //console.log(results);
    res.json(results);
  });
};

const postOrder = (req, res) => {
  const prezzo_tot = req.body.prezzo_tot;
  const id_prodotto = req.params.id_prodotto;
  const nome = req.body.nome;
  const cognome = req.body.cognome;
  const email = req.body.email;
  const indirizzo = req.body.indirizzo;
  if (
    !prezzo_tot ||
    !id_prodotto ||
    !nome ||
    !cognome ||
    !email ||
    !indirizzo
  ) {
    return res.status(400).json({
      err: "dati mancanti",
    });
  }

  const sql =
    "INSERT INTO ordini ( prezzo_tot,id_prodotto,  nome, cognome, email, indirizzo) VALUES ( ?, ?, ?, ?, ?, ?);";

  connection.query(
    sql,
    [prezzo_tot, id_prodotto, nome, cognome, email, indirizzo],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          err: err.message,
        });
      }

      //console.log(results);
      res.json(results);
      console.log("ordine effettuato");
    }
  );
};

module.exports = { index, show, bestSellers, postOrder };
