const Business = require('../models/Business');

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
        message: 'Please provide all required fields'
      });
    }

    const existingBusiness = await Business.findOne({
        $or: [{email : email.tolowerCase()},{slug:slug.tolowerCase()}]
    });

    if (existingBusiness){
        return res.status(400).json({
            success:false,
            message: 'Business with this email or slug already exists'
        });
    }

    const business = await Business.create({
        name,
        slug,
        ownerName,
        email,
        phone,
        password
    });

    res.status(201).json({
        success: true,
        message: 'Business registered Successfully!',
        data: {
            id: business._id,
            name: business.name,
            slug: business.slug,
            email: business.email
        }
    });
  }
  catch (error){
    console.error('error registering Business: ',error.message);
    res.status(500).json({
        success:false,
        message:'Server error, could not register business',
        error: error.message
    });
  }
};
module.exports={
    registerBusiness
};