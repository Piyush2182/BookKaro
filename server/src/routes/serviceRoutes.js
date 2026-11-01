const express = require("express");
const router = express.Router();

const {
  addService,
  getMyServices,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const { protectBusiness } = require("../middlewares/authMiddleware");

// Sabhi service routes par token zaroori hai
router.post("/", protectBusiness, addService);
router.get("/", protectBusiness, getMyServices);
router.put("/:id", protectBusiness, updateService);
router.delete("/:id", protectBusiness, deleteService);

module.exports = router;
