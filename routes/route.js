const express = require("express");

const eComerceController = require("../controller/controller");

const router = express.Router();

router.get("/", eComerceController.index);
router.get("/pc/:id", eComerceController.show);
router.get("/tag/:tag", eComerceController.bestSellers);
router.post("/order", eComerceController.postOrder);
router.post("/pc_filter", eComerceController.productFilrt);
router.post("/store", eComerceController.store);
router.put("/modify", eComerceController.modify);
module.exports = router;
