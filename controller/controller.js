const dotenv = require("dotenv");
dotenv.config();

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

  const placeholders = productIds.map(() => "?").join(","); //
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

const productFilrt = (req, res) => {
  const { filtro1, filtro2, valore1, valore2 } = req.body;

  let sql = "SELECT * FROM pc";
  const params = [];

  if (filtro1 !== "" && valore1 !== "" && filtro2 !== "" && valore2 !== "") {
    sql += ` WHERE ${filtro1} LIKE ? AND ${filtro2} LIKE ?`;
    params.push(`%${valore1}%`);
    params.push(`%${valore2}%`);
    console.log(sql);
  }

  if (filtro1 === "" && valore1 === "" && filtro2 !== "" && valore2 !== "") {
    sql += ` WHERE ${filtro2} LIKE ?`;
    params.push(`%${valore2}%`);
    console.log(sql);
  }
  if (filtro1 !== "" && valore1 !== "" && filtro2 === "" && valore2 === "") {
    sql += ` WHERE ${filtro1} LIKE  ?`;
    params.push(`%${valore1}%`);
    console.log(sql);
  }

  console.log(req.body);
  connection.query(sql, params, (err, result) => {
    if (err) {
      console.error("Errore ricerca prodotti:", err);
      return res.status(500).json({ err: err.message });
    }

    res.status(200).json(result);
  });
};

const store = (req, res) => {
  const {
    nome,
    descrizione,
    casePc,
    formato_case,
    gb_ram,
    processore,
    dissipatore,
    ram,
    mobo,
    scheda_video,
    gb_vram,
    alimentatore,
    archiviazione,
    gb_archiviazione,
    ventole,
    img,
    tag,
    prezzo,
    slug,
  } = req.body;

  // Validazione stringhe
  if (!nome || typeof nome !== "string")
    return res.status(400).json({ err: "Nome mancante o non valido" });
  if (!descrizione || typeof descrizione !== "string")
    return res.status(400).json({ err: "Descrizione mancante o non valida" });
  if (!casePc || typeof casePc !== "string")
    return res.status(400).json({ err: "Case mancante o non valido" });
  if (!formato_case || typeof formato_case !== "string")
    return res.status(400).json({ err: "Formato_case mancante o non valido" });
  if (!processore || typeof processore !== "string")
    return res.status(400).json({ err: "Processore mancante o non valido" });
  if (!dissipatore || typeof dissipatore !== "string")
    return res.status(400).json({ err: "Dissipatore mancante o non valido" });
  if (!mobo || typeof mobo !== "string")
    return res.status(400).json({ err: "Mobo mancante o non valido" });
  if (!scheda_video || typeof scheda_video !== "string")
    return res.status(400).json({ err: "Scheda_video mancante o non valida" });
  if (!alimentatore || typeof alimentatore !== "string")
    return res.status(400).json({ err: "Alimentatore mancante o non valido" });
  if (!archiviazione || typeof archiviazione !== "string")
    return res.status(400).json({ err: "Archiviazione mancante o non valida" });
  if (!ventole || typeof ventole !== "string")
    return res.status(400).json({ err: "Ventole mancante o non valide" });
  if (!img || typeof img !== "string")
    return res.status(400).json({ err: "Img mancante o non valida" });
  if (!slug || typeof slug !== "string")
    return res.status(400).json({ err: "Slug mancante o non valido" });
  if (!ram || typeof ram !== "string") {
    return res.status(400).json({ err: "Ram mancante o non valido" });
  }
  // Validazione numeri
  if (isNaN(gb_ram) || gb_ram <= 0)
    return res.status(400).json({ err: "Gb_ram mancante o non valido" });
  if (isNaN(gb_vram) || gb_vram <= 0)
    return res.status(400).json({ err: "Gb_vram mancante o non valido" });
  if (isNaN(prezzo) || prezzo <= 0)
    return res.status(400).json({ err: "Prezzo mancante o non valido" });
  if (isNaN(gb_archiviazione) || gb_archiviazione <= 0)
    return res
      .status(400)
      .json({ err: "Gb_archiviazione mancante o non valida" });

  const sql =
    "INSERT INTO `pc` (`nome`, `descrizione`, `casePc`, `formato_case`, `gb_ram`, `processore`, `dissipatore`, `ram`, `mobo`, `scheda_video`, `gb_vram`, `alimentatore`, `archiviazione`, `gb_archiviazione`, `ventole`, `img`, `tag`, `prezzo`, `slug`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";

  connection.query(
    sql,
    [
      nome,
      descrizione,
      casePc,
      formato_case,
      gb_ram,
      processore,
      dissipatore,
      ram,
      mobo,
      scheda_video,
      gb_vram,
      alimentatore,
      archiviazione,
      gb_archiviazione,
      ventole,
      img,
      tag,
      prezzo,
      slug,
    ],
    (err, results) => {
      if (err) {
        return res.status(500).json({ err: err.message });
      }
      res
        .status(201)
        .json({ message: "Prodotto creato", id: results.insertId });
    }
  );
};

module.exports = { index, show, bestSellers, postOrder, productFilrt, store };
