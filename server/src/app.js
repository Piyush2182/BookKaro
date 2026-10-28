const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares: Bahar se aane wale data ke rules
app.use(cors()); // Doosre origins (React frontend) ko access dena
app.use(express.json()); // Aane wale body data ko JSON object banana

// System Health Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "BookKaro API Engine is running smoothly!",
  });
});

module.exports = app;
