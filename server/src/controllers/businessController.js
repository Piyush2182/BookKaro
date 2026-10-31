const Business = require("../models/Business");

// @desc    Register a new business
// @route   POST /api/businesses
// @access  Public
const registerBusiness = async (req, res) => {
  try {
    const { name, slug, ownerName, email, phone, password } = req.body;

    // 1. Basic validation: Kya user ne sab kuch bheja?
    if (!name || !slug || !ownerName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 2. Check if business already exists
    const existingBusiness = await Business.findOne({
      $or: [{ email: email.toLowerCase() }, { slug: slug.toLowerCase() }],
    });

    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        message: "Business with this email or slug already exists",
      });
    }

    // 3. Create business (Password model ke pre-save hook me hash ho jayega)
    const business = await Business.create({
      name,
      slug,
      ownerName,
      email,
      phone,
      password,
    });

    res.status(201).json({
      success: true,
      message: "Business registered Successfully!",
      data: {
        id: business._id,
        name: business.name,
        slug: business.slug,
        email: business.email,
      },
    });
  } catch (error) {
    console.error("error registering Business: ", error.message);
    res.status(500).json({
      success: false,
      message: "Server error, could not register business",
      error: error.message,
    });
  }
};

// @desc    Authenticate business & get token
// @route   POST /api/businesses/login
// @access  Public
const loginBusiness = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation check
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // 2. Find business & explicitly include password (kyunki schema me select: false hai)
    const business = await Business.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!business) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3. Verify password using Model Method (Fat Model Pattern)
    const isMatch = await business.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4. Send success response
    res.status(200).json({
      success: true,
      message: "Login successful!",
      data: {
        id: business._id,
        name: business.name,
        slug: business.slug,
        email: business.email,
      },
    });
  } catch (error) {
    console.error("error logging in Business: ", error.message);
    res.status(500).json({
      success: false,
      message: "Server error, could not log in",
      error: error.message,
    });
  }
};

module.exports = {
  registerBusiness,
  loginBusiness,
};
