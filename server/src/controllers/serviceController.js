const Service = require("../models/Service");

// 1. ADD SERVICE (Already exists)
// 1. ADD SERVICE (Duplicate check ke sath)
const addService = async (req, res) => {
  try {
    const { name, price, durationInMinutes } = req.body;

    if (!name || !price || !durationInMinutes) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields (name, price, durationInMinutes)",
      });
    }

    const businessId = req.business._id;
    const trimmedName = name.trim();

    // 🔍 DUPLICATE CHECK: Kya is salon me is naam ki service pehle se hai?
    // Case-insensitive regex: "haircut" aur "Haircut" dono match honge
    const existingService = await Service.findOne({
      businessId,
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: `Service "${trimmedName}" already exists in your salon catalog!`,
      });
    }

    const service = await Service.create({
      businessId,
      name: trimmedName,
      price,
      durationInMinutes,
    });

    res.status(201).json({
      success: true,
      message: "Service added successfully!",
      data: service,
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

// 2. GET ALL SERVICES (Sirf usi salon ki services jo logged-in hai)
// @route   GET /api/services
// @access  Private (Needs Token)
const getMyServices = async (req, res) => {
  try {
    // Database se sirf wahi services uthao jinki businessId token wali ID se match kare
    const services = await Service.find({ businessId: req.business._id });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error, could not fetch services",
      error: error.message,
    });
  }
};

// 3. UPDATE SERVICE
// @route   PUT /api/services/:id
// @access  Private (Needs Token & Ownership)
const updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { name, price, durationInMinutes } = req.body;

    // 1. Check karo service exist karti hai ya nahi
    let service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // 2. Ownership check: Kya yeh service isi salon ki hai?
    // Note: service.businessId MongoDB ObjectId hota hai, isliye .toString() karke compare karte hain
    if (service.businessId.toString() !== req.business._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this service",
      });
    }

    // 3. Update karo
    service = await Service.findByIdAndUpdate(
      serviceId,
      { name, price, durationInMinutes },
      { new: true, runValidators: true }, // new: true se updated document return hota hai
    );

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    console.error("Error updating service:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error, could not update service",
      error: error.message,
    });
  }
};

// 4. DELETE SERVICE
// @route   DELETE /api/services/:id
// @access  Private (Needs Token & Ownership)
const deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;

    // 1. Check karo service exist karti hai ya nahi
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // 2. Ownership check
    if (service.businessId.toString() !== req.business._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this service",
      });
    }

    // 3. Delete karo
    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error, could not delete service",
      error: error.message,
    });
  }
};

module.exports = {
  addService,
  getMyServices,
  updateService,
  deleteService,
};
