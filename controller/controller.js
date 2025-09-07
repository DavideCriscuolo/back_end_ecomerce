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
  const { cliente, prodotti } = req.body;

  if (
    !cliente ||
    !prodotti ||
    !cliente.nome ||
    !cliente.cognome ||
    !cliente.email ||
    !cliente.indirizzo
  ) {
    return res.status(400).json({ err: "Dati mancanti" });
  }

  // Recupero prezzi prodotti
  const productIds = prodotti.map((p) => p.id_prodotto);
  connection.query(
    "SELECT id, prezzo FROM pc WHERE id IN (?)",
    [productIds],
    (err, rows) => {
      if (err) return res.status(500).json({ err: err.message });

      // Calcolo totale
      let totale = 0;
      prodotti.forEach((p) => {
        const dbProd = rows.find((r) => r.id === p.id_prodotto);
        if (dbProd) totale += dbProd.prezzo * (p.quantita || 1);
      });

      // Inserisco ordine
      connection.query(
        "INSERT INTO ordini (prezzo_tot, nome, cognome, email, indirizzo) VALUES (?, ?, ?, ?, ?)",
        [
          totale,
          cliente.nome,
          cliente.cognome,
          cliente.email,
          cliente.indirizzo,
        ],
        (err, orderResult) => {
          if (err) return res.status(500).json({ err: err.message });

          const orderId = orderResult.insertId;

          // Inserisco prodotti nella tabella ponte
          prodotti.forEach((p) => {
            connection.query(
              "INSERT INTO order_prodcut (id_product, id_order, quantita) VALUES (?, ?, ?)",
              [p.id_prodotto, orderId, p.quantita || 1],
              (err) => {
                if (err)
                  console.error("Errore inserimento prodotto:", err.message);
              }
            );
          });

          // Rispondo al client dopo aver inserito l'ordine
          res.status(200).json({ message: "Ordine effettuato", orderId });
        }
      );
    }
  );
};

module.exports = { index, show, bestSellers, postOrder };
