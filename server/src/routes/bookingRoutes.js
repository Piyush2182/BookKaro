const express = require("express");
const router = express.Router();

// 1. Controller functions import karo
const {
  createBooking,
  getBusySlotsByDate,
  getMyBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");

// 2. Auth Middleware import karo (sahi naam: protectBusiness)
const { protectBusiness } = require("../middlewares/authMiddleware");

// 3. Public Routes (Customer ke liye)
router.post("/", createBooking);
router.get("/busy-slots", getBusySlotsByDate);

// 4. Protected Routes (Salon Owner ke liye)
router.get("/my-bookings", protectBusiness, getMyBookings);
router.patch("/:id/status", protectBusiness, updateBookingStatus);

module.exports = router;
