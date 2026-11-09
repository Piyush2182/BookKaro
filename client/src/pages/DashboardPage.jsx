import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

function DashboardPage() {
  const navigate = useNavigate();
  const salonName = localStorage.getItem("businessName") || "Salon Owner";

  // State
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form input states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Services from Backend
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await API.get("/services");
      const data = res.data.data || res.data;
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Services load nahi ho paayi. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // 2. Add Service Handler
  const handleAddService = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await API.post("/services", {
        name,
        price: Number(price),
        durationInMinutes: Number(duration),
      });

      // Clear input fields
      setName("");
      setPrice("");
      setDuration("");

      // Refresh list
      fetchServices();
    } catch (err) {
      console.error("Add service error:", err);
      setError(err.response?.data?.message || "Service create nahi ho saki.");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete Service Handler with Confirmation
  const handleDeleteService = async (serviceId, serviceName) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${serviceName}"?`,
    );

    if (!isConfirmed) return; // User ne Cancel dabaya toh function exit ho jayega

    try {
      setError("");
      await API.delete(`/services/${serviceId}`);
      // Successful delete ke baad catalog refresh karo
      fetchServices();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Service delete nahi ho paayi.");
    }
  };

  // 4. Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("businessName");
    navigate("/login");
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "30px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "15px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#0f172a" }}>
            Welcome, {salonName}! 💈
          </h1>
          <p style={{ margin: "5px 0 0", color: "#64748b" }}>
            Manage your salon catalog and bookings
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#ef4444",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            padding: "10px",
            borderRadius: "6px",
            margin: "15px 0",
            border: "1px solid #f87171",
          }}
        >
          {error}
        </div>
      )}

      {/* Add New Service Form */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          padding: "20px",
          marginTop: "25px",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#334155" }}>
          + Nayi Service Jodo
        </h3>
        <form
          onSubmit={handleAddService}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "10px",
          }}
        >
          <input
            type="text"
            required
            placeholder="Service Name (e.g. Fade Cut)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #94a3b8",
            }}
          />
          <input
            type="number"
            required
            placeholder="Price (₹)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #94a3b8",
            }}
          />
          <input
            type="number"
            required
            placeholder="Mins (e.g. 30)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #94a3b8",
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: "#0f766e",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Adding..." : "Add Service"}
          </button>
        </form>
      </div>

      {/* Services List */}
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ color: "#334155" }}>
          Active Services ({services.length})
        </h3>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading services...</p>
        ) : services.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>
            Abhi koi service add nahi hui hai. Upar diye form se add karein!
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            {services.map((srv) => (
              <div
                key={srv._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 4px 0", color: "#0f172a" }}>
                    {srv.name}
                  </h4>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    ⏱ {srv.durationInMinutes} mins
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#0f766e",
                    }}
                  >
                    ₹{srv.price}
                  </span>

                  {/* Red Delete Button */}
                  <button
                    onClick={() => handleDeleteService(srv._id, srv.name)}
                    style={{
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fca5a5",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
