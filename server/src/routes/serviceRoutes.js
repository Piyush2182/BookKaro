const express = require("express");
const router = express.Router();
const { addService } = require("../controllers/serviceController");

router.post("/", addService);

module.exports = router;
