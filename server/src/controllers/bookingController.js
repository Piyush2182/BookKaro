const Booking = require("../models/Booking");
const Service = require("../models/Service");

// Helper: "10:30 AM" ko minutes me convert karne ke liye
const timeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper: minutes ko "11:15 AM" format me convert karne ke liye
const minutesToTime = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const modifier = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${hours}:${formattedMinutes} ${modifier}`;
};

// 1. CREATE BOOKING (Multiple Services Support)
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const {
      businessId,
      serviceIds, // Array: ["id1", "id2"]
      customerName,
      customerPhone,
      customerEmail,
      bookingDate,
      startTime, // e.g. "10:30 AM"
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
        message:
          "Please provide all required fields including at least one service",
      });
    }

    // 1. Database se saari selected services uthao
    const services = await Service.find({ _id: { $in: serviceIds } });

    if (services.length !== serviceIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more selected services not found",
      });
    }

    // 2. Total duration aur total price calculate karo
    const totalDurationInMinutes = services.reduce(
      (sum, s) => sum + s.durationInMinutes,
      0,
    );
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    // 3. Start aur End minutes calculate karo
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + totalDurationInMinutes;
    const endTime = minutesToTime(endMinutes);

    // Date normalize karo (time component hatao)
    const normalizedDate = new Date(bookingDate);
    normalizedDate.setHours(0, 0, 0, 0);

    // 4. OVERLAP CONFLICT CHECK
    const existingConflict = await Booking.findOne({
      businessId,
      bookingDate: normalizedDate,
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

    // 5. Booking save karo
    const booking = await Booking.create({
      businessId,
      services: serviceIds,
      totalPrice,
      totalDurationInMinutes,
      customerName,
      customerPhone,
      customerEmail: customerEmail || "",
      bookingDate: normalizedDate,
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      status: "confirmed",
      bookingSource: "online",
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

    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    const bookings = await Booking.find({
      businessId,
      bookingDate: searchDate,
      status: { $ne: "cancelled" },
    }).select("startTime endTime startMinutes endMinutes");

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

module.exports = {
  createBooking,
  getBusySlotsByDate,
};
