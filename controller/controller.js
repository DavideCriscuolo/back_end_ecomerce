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

  if (!cliente.nome || cliente.nome.trim() === "") {
    return res.status(400).json({ err: "Nome mancante" });
  }
  if (!cliente.cognome || cliente.cognome.trim() === "") {
    return res.status(400).json({ err: "Cognome mancante" });
  }
  if (!cliente.email || cliente.email.trim() === "") {
    return res.status(400).json({ err: "Email mancante" });
  }
  if (!cliente.indirizzo || cliente.indirizzo.trim() === "") {
    return res.status(400).json({ err: "Indirizzo mancante" });
  }

  // Validazione prodotti
  if (!prodotti || prodotti.length === 0) {
    return res.status(400).json({ err: "Nessun prodotto nell'ordine" });
  }

  const productIds = prodotti.map((p) => p.id);
  console.log("Prodotti dal carrello:", prodotti);
  console.log("ID prodotti:", productIds);

  const placeholders = productIds.map(() => "?").join(",");
  connection.query(
    `SELECT id, prezzo FROM pc WHERE id IN (${placeholders})`,
    productIds,
    (err, rows) => {
      if (err) {
        console.error("Errore query prodotti:", err);
        return res.status(500).json({ err: err.message });
      }

      console.log("Risultati dal database:", rows);

      // Verifica che tutti i prodotti esistano
      if (rows.length === 0) {
        return res
          .status(400)
          .json({ err: "Nessun prodotto trovato nel database" });
      }

      let totale = 0;

      for (const p of prodotti) {
        const product = rows.find((r) => r.id == p.id);

        const quantita = parseInt(p.quantity) || 1;

        console.log(`\n--- Prodotto ID: ${p.id} ---`);
        console.log(`Prodotto trovato nel DB:`, product);
        console.log(`Quantità dal carrello: ${quantita}`);

        //  Controlla se il prodotto esiste prima di usarlo
        if (!product) {
          console.error(`Prodotto con ID ${p.id} non trovato nel database`);
          return res.status(400).json({ err: `Prodotto ${p.id} non trovato` });
        }

        //  Controlla che il prezzo sia valido
        const prezzo = parseFloat(product.prezzo);
        if (isNaN(prezzo) || prezzo <= 0) {
          console.error(
            `Prezzo non valido per prodotto ${p.id}:`,
            product.prezzo
          );
          return res
            .status(500)
            .json({ err: `Prezzo non valido per il prodotto ${p.id}` });
        }

        // Controlla che la quantità sia valida
        if (quantita <= 0 || isNaN(quantita)) {
          return res
            .status(400)
            .json({ err: `Quantità non valida per il prodotto ${p.id}` });
        }

        const subtotale = prezzo * quantita;
        console.log(`Prezzo unitario: €${prezzo}`);
        console.log(`Quantità: ${quantita}`);
        console.log(`Subtotale: €${subtotale}`);

        totale += subtotale;
      }

      // Arrotonda il totale a 2 decimali
      totale = Math.round(totale * 100) / 100;

      console.log(`=== TOTALE FINALE: €${totale} ===`);

      if (isNaN(totale) || totale <= 0) {
        return res.status(400).json({ err: "Totale ordine non valido" });
      }

      // Inserimento ordine
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
          if (err) {
            console.error("Errore inserimento ordine:", err);
            return res.status(500).json({ err: err.message });
          }

          const orderId = orderResult.insertId;
          console.log(`Ordine creato con ID: ${orderId}`);

          // Inserimento prodotti con controllo errori
          let inserimenti_completati = 0;
          let errore_inserimento = false;

          prodotti.forEach((p, index) => {
            const quantita = parseInt(p.quantity) || 1;

            connection.query(
              "INSERT INTO order_prodcut (id_product, id_order, quantita) VALUES (?, ?, ?)",
              [p.id, orderId, quantita],
              (err) => {
                if (err && !errore_inserimento) {
                  console.error("Errore inserimento prodotto:", err.message);
                  errore_inserimento = true;
                  return res
                    .status(500)
                    .json({ err: "Errore nell'inserimento dei prodotti" });
                }

                inserimenti_completati++;

                // Rispondi solo quando tutti i prodotti sono stati inseriti
                if (
                  inserimenti_completati === prodotti.length &&
                  !errore_inserimento
                ) {
                  console.log("Tutti i prodotti inseriti con successo");
                  res.status(201).json({
                    message: "Ordine effettuato con successo",
                    orderId,
                    totale,
                  });
                }
              }
            );
          });
        }
      );
    }
  );
};

module.exports = { index, show, bestSellers, postOrder };
