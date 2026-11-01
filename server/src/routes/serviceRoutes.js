const express = require("express");
const router = express.Router();

const { addService } = require("../controllers/serviceController");
// 1. Guard import karo
const { protectBusiness } = require("../middlewares/authMiddleware");

// 2. addService ke theek pehle protectBusiness bitha do
router.post("/", protectBusiness, addService);

module.exports = router;
