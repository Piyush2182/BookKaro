const Booking = require("../models/Booking");
const Service = require("../models/Service");
const {
  parseTimeToMinutes,
  formatMinutesToTime,
} = require("../utils/timeHelpers");

// 1. CREATE BOOKING (Lean & Direct)
const createBooking = async (req, res) => {
  try {
    const { serviceId, customerName, customerPhone, bookingDate, startTime } =
      req.body;

    if (
      !serviceId ||
      !customerName ||
      !customerPhone ||
      !bookingDate ||
      !startTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // A. Service dhoondo aur duration nikalo
    const service = await Service.findById(serviceId);
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const businessId = req.business._id;

    // B. Time calculations (AM/PM -> Minutes -> End Time)
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = startMinutes + service.durationInMinutes;
    const endTime = formatMinutesToTime(endMinutes);

    // C. Overlap Check (Direct number comparison)
    // Formula: existing.start < new.end AND existing.end > new.start
    const conflictingBooking = await Booking.findOne({
      businessId,
      bookingDate: new Date(bookingDate),
      status: { $ne: "cancelled" },
      startMinutes: { $lt: endMinutes },
      endMinutes: { $gt: startMinutes },
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: `Slot unavailable! Overlaps with an existing booking (${conflictingBooking.startTime} - ${conflictingBooking.endTime})`,
      });
    }

    // D. Save Booking
    const booking = await Booking.create({
      businessId,
      serviceId,
      customerName,
      customerPhone,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      bookingSource: "walk-in",
      status: "confirmed",
    });

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully!",
      data: booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error, could not create booking",
      error: error.message,
    });
  }
};

// 2. GET SALON BOOKINGS (Dashboard view)
const getSalonBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ businessId: req.business._id })
      .populate("serviceId", "name price durationInMinutes")
      .sort({ bookingDate: 1, startMinutes: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Fetch bookings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error, could not fetch bookings",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getSalonBookings,
};
