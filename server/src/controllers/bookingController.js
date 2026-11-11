const Booking = require("../models/Booking");
const Service = require("../models/Service");

// Helper: "10:30 AM" ko numeric minutes me badalna (e.g. 630)
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper: numeric minutes ko "11:15 AM" format me badalna
const minutesToTime = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const modifier = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${hours}:${formattedMinutes} ${modifier}`;
};

// Helper: Date string (YYYY-MM-DD) ko local day-start aur day-end me badalna (Timezone-safe)
const getDateRange = (dateStr) => {
  // dateStr format: "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
};

// 1. CREATE BOOKING
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const {
      businessId,
      serviceIds,
      customerName,
      customerPhone,
      customerEmail,
      bookingDate, // format: "YYYY-MM-DD"
      startTime, // format: "10:30 AM"
    } = req.body;

    if (
      !businessId ||
      !serviceIds ||
      !Array.isArray(serviceIds) ||
      serviceIds.length === 0 ||
      !customerName ||
      !customerPhone ||
      !bookingDate ||
      !startTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields including services",
      });
    }

    // 1. Fetch services
    const services = await Service.find({ _id: { $in: serviceIds } });
    if (services.length !== serviceIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more selected services not found",
      });
    }

    // 2. Total duration & total price
    const totalDurationInMinutes = services.reduce(
      (sum, s) => sum + s.durationInMinutes,
      0,
    );
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    // 3. Start aur End minutes
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + totalDurationInMinutes;
    const endTime = minutesToTime(endMinutes);

    // 4. Timezone-Safe Date Range
    const { start: dayStart, end: dayEnd } = getDateRange(bookingDate);

    // 5. Overlap Conflict Check
    const existingConflict = await Booking.findOne({
      businessId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: "cancelled" },
      startMinutes: { $lt: endMinutes },
      endMinutes: { $gt: startMinutes },
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: `This slot conflicts with an existing booking (${existingConflict.startTime} to ${existingConflict.endTime}). Please select another time.`,
      });
    }

    // 6. Booking Save (dayStart save karte hain taaki normalized date rahe)
    const booking = await Booking.create({
      businessId,
      services: serviceIds,
      totalPrice,
      totalDurationInMinutes,
      customerName,
      customerPhone,
      customerEmail: customerEmail || "",
      bookingDate: dayStart, // ✅ normalizedDate bug fixed!
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      status: "confirmed",
      bookingSource: req.body.bookingSource || "online",
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully!",
      data: booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while creating booking",
      error: error.message,
    });
  }
};

// 2. GET BUSY SLOTS BY DATE
// @route   GET /api/bookings/busy-slots?businessId=...&date=...
const getBusySlotsByDate = async (req, res) => {
  try {
    const { businessId, date } = req.query;

    if (!businessId || !date) {
      return res.status(400).json({
        success: false,
        message: "businessId and date are required query parameters",
      });
    }

    const { start: dayStart, end: dayEnd } = getDateRange(date);

    const bookings = await Booking.find({
      businessId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: "cancelled" },
    }).select("startTime endTime startMinutes endMinutes");

    console.log(
      `[DEBUG BUSY SLOTS] Found ${bookings.length} slots for date ${date}`,
    );

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Fetch busy slots error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch busy slots",
      error: error.message,
    });
  }
};

// 3. GET MY BOOKINGS
const getMyBookings = async (req, res) => {
  try {
    const businessId = req.business._id;

    const bookings = await Booking.find({ businessId })
      .populate("services", "name price durationInMinutes")
      .sort({ bookingDate: -1, startMinutes: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Fetch my bookings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch salon bookings",
      error: error.message,
    });
  }
};

// 4. UPDATE BOOKING STATUS
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const businessId = req.business._id;

    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: id, businessId },
      { status },
      { returnDocument: "after" },
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking marked as ${status}`,
      data: booking,
    });
  } catch (error) {
    console.error("Update booking status error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not update booking status",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getBusySlotsByDate,
  getMyBookings,
  updateBookingStatus,
};
