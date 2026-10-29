const mongoose = require("mongoose");
const serviceSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business", // Batata hai ki yeh ID kis collection se aayi hai
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  durationInMinutes: {
    type: Number,
    required: true,
  },
});

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
