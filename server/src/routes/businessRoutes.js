const express = require("express");
const router = express.Router();
const {
  registerBusiness,
  loginBusiness,
  getSalonBySlug,
} = require("../controllers/businessController");

router.post("/", registerBusiness);
router.post("/login", loginBusiness);
router.get("/public/:slug", getSalonBySlug);

module.exports = router;
