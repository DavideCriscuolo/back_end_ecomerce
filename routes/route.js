const express = require("express");

const eComerceController = require("../controller/controller");

const router = express.Router();

router.get("/", eComerceController.index);

module.exports = router;
