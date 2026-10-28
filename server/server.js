const dotenv = require("dotenv");

// 1. Environment variables load karna
dotenv.config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// 2. Pehle database connect karo, fir server start karo
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 BookKaro Backend running on http://localhost:${PORT}`);
  });
});
