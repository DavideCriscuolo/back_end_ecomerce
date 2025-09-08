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

  if (cliente.name === "") {
    return res.status(400).json({ err: "Nome mancante" });
  }

  if (cliente.cognome === "") {
    return res.status(400).json({ err: "Cognome mancante" });
  }

  if (cliente.email === "") {
    return res.status(400).json({ err: "Email mancante" });
  }

  if (cliente.indirizzo === "") {
    return res.status(400).json({ err: "Indirizzo mancante" });
  }

  // Recupero prezzi prodotti
  const productIds = prodotti.map((p) => p.id_product);
  connection.query(
    "SELECT id, prezzo FROM pc WHERE id IN (?)",
    [productIds],
    (err, rows) => {
      if (err) return res.status(500).json({ err: err.message });

      // Calcolo totale
      let totale = 0;
      prodotti.forEach((p) => {
        //cerca nel db il prodotto corrispondente al prodotto dell'ordine e moltiplica per la quantita se presente
        const prod = rows.find((r) => r.id === p.id_product);
        if (prod) totale += prod.prezzo * (p.quantita || 1); // se non c'è quantità, metti 1
      });
      console.log(totale); // stampa il totale
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
              [p.id_product, orderId, p.quantita || 1],
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
