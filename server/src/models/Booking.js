const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    // Optional: Agar online user hai toh ID aayegi, offline hai toh null rahega
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Customer details dono case me rahengi (contact karne ke liye)
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone number is required"],
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      default: "",
    },
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    // AM/PM format (e.g., "10:30 AM")
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    // Querying aur conflict check ke liye numeric minutes (e.g., 630 for 10:30 AM)
    startMinutes: {
      type: Number,
      required: true,
    },
    endMinutes: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "confirmed", // Walk-in usually direct confirmed hota hai
    },
    bookingSource: {
      type: String,
      enum: ["online", "walk-in"],
      default: "online",
    },
  },
  {
    timestamps: true,
  },
);

// Performance index: Ek salon aur ek date par booking search fast karne ke liye
bookingSchema.index({ businessId: 1, bookingDate: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
