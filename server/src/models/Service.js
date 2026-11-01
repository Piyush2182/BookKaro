const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    durationInMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: 5,
    },
  },
  {
    timestamps: true,
  },
);

// Dhyan se dekho: Direct mongoose.model export hona chahiye
const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
