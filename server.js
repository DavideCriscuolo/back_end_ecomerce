const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("./routes/route");
dotenv.config();
const port = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/ecomerce", router);
app.listen(port, () => {
  console.log(`sto ascoltando il server sulla porta ${port}`);
});
