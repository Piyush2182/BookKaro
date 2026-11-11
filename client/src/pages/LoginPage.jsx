import { useState } from "react";
import API from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  // 1. Form inputs ke liye state banayi
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 2. UI feedback ke liye state (loading spinner aur error message)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 3. Submit handler
  const handleLogin = async (e) => {
    e.preventDefault(); // Default page refresh ko roko
    setError("");
    setLoading(true);

    try {
      // Backend API call: POST http://localhost:5000/api/businesses/login
      const response = await API.post("/businesses/login", {
        email,
        password,
      });

      console.log("Full Server Response:", response.data);

      // Dono formats handle karega (chahe response.data.token ho ya response.data.data.token)
      const token = response.data.data.token;
      const name = response.data.data.name;
      const slug = response.data.data.slug;
      if (!token) {
        throw new Error("Token not found in server response");
      }

      // Token aur salon details ko localStorage me save karo
      localStorage.setItem("token", token);
      localStorage.setItem("businessName", name);
      localStorage.setItem("businessSlug", slug);
      alert(`Welcome back, ${name || "Salon"}!`);
      navigate("/dashboard");
      console.log("Logged in successfully. Token saved:", token);
    } catch (err) {
      console.error("Login Error details:", err);
      // Backend se aane wala error message ya default message dikhao
      const message =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Salon Login</h2>
      <p style={{ color: "#666" }}>
        BookKaro Business Dashboard me login karein
      </p>

      {/* Agar error aaye toh red color me dikhao */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffebee",
            color: "#c62828",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Email Address:
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="salon@example.com"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Password:
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: loading ? "#999" : "#0f766e",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Logging in..." : "Login to Salon"}
        </button>
      </form>
      <p
        style={{
          textAlign: "center",
          fontSize: "14px",
          color: "#64748b",
          marginTop: "16px",
        }}
      >
        New salon owner?{" "}
        <Link to="/register" style={{ color: "#0f766e", fontWeight: "600" }}>
          Register your salon
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
