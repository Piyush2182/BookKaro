const dotenv = require("dotenv");

// .env file se secret data uthana
dotenv.config();

const app = require("./src/app");

// Port .env se lo, nahi toh 5000 fallback
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 BookKaro Backend running on http://localhost:${PORT}`);
});
