const express = require("express");
const router = express.Router();
const {
  createBooking,
  getSalonBookings,
} = require("../controllers/bookingController");
const { protectBusiness } = require("../middlewares/authMiddleware");

// Dono routes protectBusiness guard ke peeche
router.post("/", protectBusiness, createBooking);
router.get("/", protectBusiness, getSalonBookings);

module.exports = router;
