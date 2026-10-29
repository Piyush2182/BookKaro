const Service = require("../models/Service");

const addService = async (req, res) => {
  try {
    const { name, price, durationInMinutes, businessId } = req.body;

    // 1. Validation check
    if (!name || !price || !durationInMinutes || !businessId) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 2. Create document using the Model
    const newService = await Service.create({
      name,
      price,
      durationInMinutes,
      businessId,
    });

    // 3. Response
    res.status(201).json({
      success: true,
      message: "Service added successfully!",
      data: {
        id: newService._id,
        businessId: newService.businessId,
        name: newService.name,
        price: newService.price,
        durationInMinutes: newService.durationInMinutes,
      },
    });
  } catch (error) {
    console.error("Error adding service:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error, could not add service",
      error: error.message,
    });
  }
};

module.exports = {
  addService,
};

