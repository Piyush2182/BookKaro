const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Unique slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, "Owner name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt
  },
);

businessSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: password match karne ke liye
businessSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method: JWT Token generate karne ke liye
businessSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id }, // Payload: Token ke andar salon ki _id pack kardi
    process.env.JWT_SECRET, // Secret key jo signature banayegi
    {
      expiresIn: process.env.JWT_EXPIRE || "30d", // Expiry time
    },
  );
};

// Mongoose ko bolte hain is schema se ek 'Business' collection create kare
const Business = mongoose.model("Business", businessSchema);

module.exports = Business;
