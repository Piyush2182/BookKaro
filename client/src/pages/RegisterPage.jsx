import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axiosInstance";

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-slug generator from salon name
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, "-"),
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/businesses/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        address: address.trim(),
        slug: slug.trim().toLowerCase(),
      });

      // Save token and info
      const data = res.data.data || res.data;
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("businessName", data.business?.name || name);
        localStorage.setItem("businessSlug", data.business?.slug || slug);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || "Registration failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "440px",
        margin: "60px auto",
        padding: "24px",
        fontFamily: "sans-serif",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{ textAlign: "center", color: "#0f172a", marginBottom: "6px" }}
      >
        Register Your Salon 💈
      </h2>
      <p
        style={{
          textAlign: "center",
          color: "#64748b",
          fontSize: "14px",
          marginTop: 0,
          marginBottom: "20px",
        }}
      >
        Join BookKaro and manage bookings effortlessly
      </p>

      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleRegister}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Salon Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Royal Barber Shop"
            value={name}
            onChange={handleNameChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Public URL Slug
          </label>
          <input
            type="text"
            required
            placeholder="royal-barber-shop"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
              backgroundColor: "#f8fafc",
            }}
          />
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            Your link: /salon/{slug || "your-slug"}
          </span>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Email
          </label>
          <input
            type="email"
            required
            placeholder="owner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Shop Address
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Shop 4, Borivali West, Mumbai"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#0f766e",
            color: "#fff",
            padding: "12px",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "15px",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "10px",
          }}
        >
          {loading ? "Creating Salon..." : "Create Account & Go to Dashboard"}
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
        Already have a salon?{" "}
        <Link to="/login" style={{ color: "#0f766e", fontWeight: "600" }}>
          Login here
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
