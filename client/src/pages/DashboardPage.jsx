import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

const TIME_SLOTS = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
];

const timeToMinutes = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

function DashboardPage() {
  const navigate = useNavigate();

  const salonName = localStorage.getItem("businessName") || "Salon Owner";
  const salonSlug = localStorage.getItem("businessSlug");

  // Tab State: "bookings" | "services" | "walkin"
  const [activeTab, setActiveTab] = useState("bookings");

  // Filter State: "all" | "today" | "upcoming"
  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");

  // Services States
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bookings States
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Walk-in Offline Booking States
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinDate, setWalkinDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [walkinSlot, setWalkinSlot] = useState("");
  const [walkinSelectedServices, setWalkinSelectedServices] = useState([]);
  const [walkinBusySlots, setWalkinBusySlots] = useState([]);
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);
  const [walkinError, setWalkinError] = useState("");
  const [walkinSuccess, setWalkinSuccess] = useState("");

  // 1. Fetch Services
  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const res = await API.get("/services");
      const data = res.data.data || res.data;
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch services error:", err);
      setServiceError("Services load nahi ho saki.");
    } finally {
      setServicesLoading(false);
    }
  };

  // 2. Fetch Bookings
  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const res = await API.get("/bookings/my-bookings");
      setBookings(res.data.data || []);
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setBookingError("Bookings load nahi ho saki.");
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

  // 3. Fetch Busy Slots for Walkin Date (Taaki offline add karte waqt bhi red slot dikhe!)
  const salonBusinessId = bookings[0]?.businessId || services[0]?.businessId;
  useEffect(() => {
    const fetchWalkinBusy = async () => {
      if (!salonBusinessId || !walkinDate) return;
      try {
        const res = await API.get(
          `/bookings/busy-slots?businessId=${salonBusinessId}&date=${walkinDate}`,
        );
        setWalkinBusySlots(res.data.data || []);
      } catch (err) {
        console.error("Fetch walkin busy slots error:", err);
      }
    };
    fetchWalkinBusy();
  }, [walkinDate, salonBusinessId]);

  // Service Management Handlers
  const handleAddService = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setServiceError("");

    try {
      await API.post("/services", {
        name: name.trim(),
        price: Number(price),
        durationInMinutes: Number(duration),
      });

      setName("");
      setPrice("");
      setDuration("");
      fetchServices();
    } catch (err) {
      console.error("Add service error:", err);
      setServiceError(
        err.response?.data?.message || "Service add nahi ho saki.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${serviceName}"?`,
    );
    if (!isConfirmed) return;

    try {
      setServiceError("");
      await API.delete(`/services/${serviceId}`);
      fetchServices();
    } catch (err) {
      console.error("Delete error:", err);
      setServiceError(err.response?.data?.message || "Delete fail ho gaya.");
    }
  };

  // Booking Status Handler
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings();
    } catch (err) {
      console.error("Status update error:", err);
      alert("Status update nahi ho saka.");
    }
  };

  // Walkin duration calculate
  const walkinTotalDuration = useMemo(() => {
    return services
      .filter((s) => walkinSelectedServices.includes(s._id))
      .reduce((sum, s) => sum + s.durationInMinutes, 0);
  }, [services, walkinSelectedServices]);

  // Check if slot overlaps in Walkin Form
  const isWalkinSlotDisabled = (slot) => {
    const slotStart = timeToMinutes(slot);
    const durationToUse = walkinTotalDuration > 0 ? walkinTotalDuration : 30;
    const slotEnd = slotStart + durationToUse;

    return walkinBusySlots.some((busy) => {
      return slotStart < busy.endMinutes && slotEnd > busy.startMinutes;
    });
  };

  // Walk-in Offline Booking Submission
  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    if (walkinSelectedServices.length === 0) {
      setWalkinError("At least ek service select karein.");
      return;
    }
    if (!walkinSlot) {
      setWalkinError("Kripya ek available time slot choose karein.");
      return;
    }

    setWalkinSubmitting(true);
    setWalkinError("");
    setWalkinSuccess("");

    try {
      await API.post("/bookings", {
        businessId: salonBusinessId,
        serviceIds: walkinSelectedServices,
        customerName: walkinName.trim(),
        customerPhone: walkinPhone.trim(),
        bookingDate: walkinDate,
        startTime: walkinSlot,
      });

      setWalkinSuccess(`Booking done for ${walkinName} at ${walkinSlot}!`);
      setWalkinName("");
      setWalkinPhone("");
      setWalkinSlot("");
      setWalkinSelectedServices([]);
      fetchBookings();
    } catch (err) {
      console.error("Walkin booking error:", err);
      setWalkinError(
        err.response?.data?.message || "Slot conflict ya booking error.",
      );
    } finally {
      setWalkinSubmitting(false);
    }
  };

  const toggleWalkinService = (id) => {
    if (walkinSelectedServices.includes(id)) {
      setWalkinSelectedServices(
        walkinSelectedServices.filter((sId) => sId !== id),
      );
    } else {
      setWalkinSelectedServices([...walkinSelectedServices, id]);
    }
  };

  // Real-Time Analytics Calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    let todayCount = 0;
    let todayRevenue = 0;
    let upcomingPending = 0;

    bookings.forEach((b) => {
      const bDateStr = new Date(b.bookingDate).toISOString().split("T")[0];

      if (bDateStr === todayStr) {
        todayCount += 1;
        if (b.status === "completed") {
          todayRevenue += b.totalPrice || 0;
        }
      }

      if (b.status === "confirmed") {
        upcomingPending += 1;
      }
    });

    return { todayCount, todayRevenue, upcomingPending };
  }, [bookings]);

  // Filter Bookings logic
  const filteredBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return bookings.filter((b) => {
      const bDateStr = new Date(b.bookingDate).toISOString().split("T")[0];

      let dateMatch = true;
      if (dateFilter === "today") {
        dateMatch = bDateStr === todayStr;
      } else if (dateFilter === "upcoming") {
        dateMatch = bDateStr >= todayStr && b.status === "confirmed";
      }

      let statusMatch = true;
      if (statusFilter !== "all") {
        statusMatch = b.status === statusFilter;
      }

      return dateMatch && statusMatch;
    });
  }, [bookings, dateFilter, statusFilter]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("businessName");
    localStorage.removeItem("businessSlug");
    navigate("/login");
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "confirmed":
        return { backgroundColor: "#dbeafe", color: "#1e40af" };
      case "completed":
        return { backgroundColor: "#dcfce7", color: "#166534" };
      case "cancelled":
        return { backgroundColor: "#fee2e2", color: "#991b1b" };
      default:
        return { backgroundColor: "#f1f5f9", color: "#475569" };
    }
  };

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "25px auto",
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
            Salon Management & Operations
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {salonSlug && (
            <a
              href={`/salon/${salonSlug}`}
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: "#0f766e",
                color: "#fff",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              🔗 View Public Page
            </a>
          )}
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
      </div>

      {/* Top Analytics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "15px",
          margin: "20px 0",
        }}
      >
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <span
            style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}
          >
            📅 TODAY'S APPOINTMENTS
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#0f172a",
              marginTop: "4px",
            }}
          >
            {stats.todayCount}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <span
            style={{ fontSize: "13px", color: "#166534", fontWeight: "600" }}
          >
            💰 TODAY'S REVENUE
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#15803d",
              marginTop: "4px",
            }}
          >
            ₹{stats.todayRevenue}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            padding: "16px",
          }}
        >
          <span
            style={{ fontSize: "13px", color: "#1e40af", fontWeight: "600" }}
          >
            ⏳ PENDING / SCHEDULED
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#2563eb",
              marginTop: "4px",
            }}
          >
            {stats.upcomingPending}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "12px",
        }}
      >
        <button
          onClick={() => setActiveTab("bookings")}
          style={{
            padding: "8px 18px",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            backgroundColor: activeTab === "bookings" ? "#0f766e" : "#e2e8f0",
            color: activeTab === "bookings" ? "#fff" : "#334155",
          }}
        >
          📅 Appointments ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("services")}
          style={{
            padding: "8px 18px",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            backgroundColor: activeTab === "services" ? "#0f766e" : "#e2e8f0",
            color: activeTab === "services" ? "#fff" : "#334155",
          }}
        >
          ✂️ Services Catalog ({services.length})
        </button>
        <button
          onClick={() => setActiveTab("walkin")}
          style={{
            padding: "8px 18px",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            backgroundColor: activeTab === "walkin" ? "#0f766e" : "#e2e8f0",
            color: activeTab === "walkin" ? "#fff" : "#334155",
          }}
        >
          🚶 Walk-in Entry
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === "bookings" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <div style={{ display: "flex", gap: "6px" }}>
              {["today", "upcoming", "all"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: dateFilter === filter ? "#0f172a" : "#fff",
                    color: dateFilter === filter ? "#fff" : "#475569",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                }}
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {bookingError && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "15px",
              }}
            >
              {bookingError}
            </div>
          )}

          {bookingsLoading ? (
            <p style={{ color: "#64748b" }}>Loading appointments...</p>
          ) : filteredBookings.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
                borderRadius: "8px",
                color: "#64748b",
              }}
            >
              Is filter ke under koi appointment nahi mila.
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {filteredBookings.map((b) => (
                <div
                  key={b._id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px",
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <h3 style={{ margin: 0, color: "#0f172a" }}>
                        {b.customerName}
                      </h3>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          ...getStatusBadgeStyle(b.status),
                        }}
                      >
                        {b.status}
                      </span>
                      {b.bookingSource === "walk-in" && (
                        <span
                          style={{
                            fontSize: "11px",
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                          }}
                        >
                          Walk-in
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#475569",
                        fontSize: "14px",
                      }}
                    >
                      📞 {b.customerPhone}
                    </p>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#0f766e",
                        fontWeight: "600",
                        marginTop: "6px",
                      }}
                    >
                      📅 {new Date(b.bookingDate).toLocaleDateString()} | ⏰{" "}
                      {b.startTime} - {b.endTime} ({b.totalDurationInMinutes}{" "}
                      mins)
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        marginTop: "4px",
                      }}
                    >
                      Services:{" "}
                      {b.services?.map((s) => s.name).join(", ") ||
                        "Custom Service"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#0f172a",
                      }}
                    >
                      ₹{b.totalPrice}
                    </span>

                    {b.status === "confirmed" && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleStatusChange(b._id, "completed")}
                          style={{
                            backgroundColor: "#10b981",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Mark Done ✓
                        </button>
                        <button
                          onClick={() => handleStatusChange(b._id, "cancelled")}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Cancel ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERVICES MANAGEMENT */}
      {activeTab === "services" && (
        <div>
          {serviceError && (
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
              {serviceError}
            </div>
          )}

          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
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
                placeholder="Service Name"
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

          {servicesLoading ? (
            <p style={{ color: "#64748b" }}>Loading services...</p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
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
      )}

      {/* TAB 3: WALK-IN BOOKING ENTRY (WITH LIVE VISUAL SLOTS) */}
      {activeTab === "walkin" && (
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>
            Offline Walk-in Customer Add Karein
          </h3>
          <p
            style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "14px" }}
          >
            Date aur services select karte hi booked slots{" "}
            <strong>Red (Strikethrough)</strong> ho jayenge.
          </p>

          {walkinSuccess && (
            <div
              style={{
                backgroundColor: "#dcfce7",
                color: "#166534",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "15px",
                fontWeight: "bold",
              }}
            >
              ✓ {walkinSuccess}
            </div>
          )}

          {walkinError && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "15px",
              }}
            >
              {walkinError}
            </div>
          )}

          <form onSubmit={handleCreateWalkin}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <input
                type="text"
                required
                placeholder="Customer Name"
                value={walkinName}
                onChange={(e) => setWalkinName(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #94a3b8",
                }}
              />
              <input
                type="tel"
                required
                placeholder="Phone Number (10 digits)"
                value={walkinPhone}
                onChange={(e) => setWalkinPhone(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #94a3b8",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Booking Date:
              </label>
              <input
                type="date"
                required
                value={walkinDate}
                onChange={(e) => setWalkinDate(e.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #94a3b8",
                  width: "100%",
                  maxWidth: "300px",
                }}
              />
            </div>

            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#334155",
                marginBottom: "8px",
              }}
            >
              Select Services:
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              {services.map((s) => {
                const checked = walkinSelectedServices.includes(s._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggleWalkinService(s._id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: checked
                        ? "2px solid #0f766e"
                        : "1px solid #cbd5e1",
                      backgroundColor: checked ? "#f0fdfa" : "#fff",
                      color: checked ? "#0f766e" : "#334155",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    {s.name} (₹{s.price} | {s.durationInMinutes}m){" "}
                    {checked ? "✓" : "+"}
                  </button>
                );
              })}
            </div>

            {/* VISUAL SLOTS GRID FOR WALKIN */}
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#334155",
                marginBottom: "8px",
              }}
            >
              Available Slots (
              {walkinTotalDuration > 0
                ? `~${walkinTotalDuration} mins`
                : "Select services first"}
              ):
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              {TIME_SLOTS.map((slot) => {
                const disabled = isWalkinSlotDisabled(slot);
                const isChosen = walkinSlot === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    onClick={() => setWalkinSlot(slot)}
                    style={{
                      padding: "10px 4px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: disabled ? "not-allowed" : "pointer",
                      border: isChosen
                        ? "2px solid #0f766e"
                        : "1px solid #cbd5e1",
                      backgroundColor: disabled
                        ? "#fee2e2"
                        : isChosen
                          ? "#0f766e"
                          : "#ffffff",
                      color: disabled
                        ? "#991b1b"
                        : isChosen
                          ? "#fff"
                          : "#1e293b",
                      textDecoration: disabled ? "line-through" : "none",
                    }}
                  >
                    {slot} {disabled ? "(Booked)" : ""}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={walkinSubmitting || !walkinSlot}
              style={{
                backgroundColor: "#0f766e",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "15px",
                cursor:
                  walkinSubmitting || !walkinSlot ? "not-allowed" : "pointer",
              }}
            >
              {walkinSubmitting
                ? "Saving Entry..."
                : `Book Walk-in Slot (${walkinSlot || "Select Slot"})`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
