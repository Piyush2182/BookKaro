const jwt = require("jsonwebtoken");
const Business = require("../models/Business");

const protectBusiness = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Guard Clause: Header ya Bearer missing hai toh turant bahar phek do
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }

  try {
    // 2. Token extract karo
    const token = authHeader.split(" ")[1];

    // 3. Verify signature using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Token ki ID se database se business dhoondo
    req.business = await Business.findById(decoded.id).select("-password");

    if (!req.business) {
      return res.status(401).json({
        success: false,
        message: "Business not found with this token",
      });
    }

    // 5. Entry pass: Controller ko control hand over karo
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed or expired",
    });
  }
};

module.exports = { protectBusiness };
