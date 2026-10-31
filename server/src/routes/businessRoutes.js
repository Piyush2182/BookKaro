const express = require("express");
const router = express.Router();
const {
  registerBusiness,
  loginBusiness,
} = require("../controllers/businessController");

router.post("/", registerBusiness);
router.post("/login", loginBusiness);

module.exports = router;
