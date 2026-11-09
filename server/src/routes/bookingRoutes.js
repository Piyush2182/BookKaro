const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBusySlotsByDate,
} = require("../controllers/bookingController");

// Public endpoints (Customer booking ke liye token ki zaroorat nahi)
router.post("/", createBooking);
router.get("/busy-slots", getBusySlotsByDate);

module.exports = router;
