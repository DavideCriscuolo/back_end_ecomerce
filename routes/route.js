const express = require("express");

const eComerceController = require("../controller/controller");

const router = express.Router();

router.get("/", eComerceController.index);
router.get("/pc/:id", eComerceController.show);
router.get("/tag/:tag", eComerceController.bestSellers);
router.post("/order", eComerceController.postOrder);
router.post("/pc_filter", eComerceController.productFilrt);
module.exports = router;
