import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  if (!timeStr) return 0;
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

function SalonPublicPage() {
  const { slug } = useParams();

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedServices, setSelectedServices] = useState([]);

  // Modal & Booking form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [busySlots, setBusySlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [modalError, setModalError] = useState("");

  // 1. Fetch Salon Data
  useEffect(() => {
    const fetchSalonData = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/businesses/public/${slug}`);
        setSalon(res.data.data.business);
        setServices(res.data.data.services);
      } catch (err) {
        console.error("Public salon fetch error:", err);
        setError("Salon details load nahi ho saki. Please link check karein.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchSalonData();
  }, [slug]);

  // 2. Fetch Busy Slots jab bhi Customer date change kare
  const fetchBusySlots = async () => {
    if (!salon || !bookingDate) return;
    try {
      const res = await API.get(
        `/bookings/busy-slots?businessId=${salon._id}&date=${bookingDate}`,
      );
      console.log("Customer fetched busy slots:", res.data.data);
      setBusySlots(res.data.data || []);
    } catch (err) {
      console.error("Fetch busy slots error:", err);
    }
  };

  useEffect(() => {
    fetchBusySlots();
  }, [bookingDate, salon]);

  // Toggle Service selection
  const toggleSelectService = (service) => {
    const exists = selectedServices.some((s) => s._id === service._id);
    if (exists) {
      setSelectedServices(
        selectedServices.filter((s) => s._id !== service._id),
      );
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const totalPrice = selectedServices.reduce(
    (sum, item) => sum + item.price,
    0,
  );
  const totalDuration = selectedServices.reduce(
    (sum, item) => sum + item.durationInMinutes,
    0,
  );

  // Check if a specific time slot overlaps with any busy slot
  const isSlotDisabled = (slot) => {
    const slotStart = timeToMinutes(slot);
    // Agar duration 0 hai toh default 30 mins assume karo conflict check ke liye
    const durationToCheck = totalDuration > 0 ? totalDuration : 30;
    const slotEnd = slotStart + durationToCheck;

    return busySlots.some((busy) => {
      // Overlap condition: slotStart < busyEnd && slotEnd > busyStart
      return slotStart < busy.endMinutes && slotEnd > busy.startMinutes;
    });
  };

  // Submit Booking Form
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setModalError("Please select a time slot!");
      return;
    }

    setBookingLoading(true);
    setModalError("");

    try {
      const res = await API.post("/bookings", {
        businessId: salon._id,
        serviceIds: selectedServices.map((s) => s._id),
        customerName,
        customerPhone,
        bookingDate,
        startTime: selectedSlot,
        bookingSource: "online",
      });

      setBookingSuccess(res.data.data);
      // Success ke baad busy slots refresh karo taaki booked slot red ho jaye
      fetchBusySlots();
    } catch (err) {
      console.error("Booking error:", err);
      setModalError(
        err.response?.data?.message || "Booking failed. Try another slot.",
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBookingSuccess(null);
    setModalError("");
    setSelectedSlot("");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Loading salon...
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", color: "#dc2626" }}>
        <h2>{error || "Salon Not Found"}</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "30px auto",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Salon Header */}
      <div
        style={{
          backgroundColor: "#0f766e",
          color: "#fff",
          padding: "24px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>{salon.name}</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.9 }}>
          📍 {salon.address || "Mumbai, Maharashtra"}
        </p>
      </div>

      <h3 style={{ color: "#1e293b", marginBottom: "12px" }}>
        Choose Services
      </h3>

      {/* Services List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          paddingBottom: "100px",
        }}
      >
        {services.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            Abhi koi service available nahi hai.
          </p>
        ) : (
          services.map((srv) => {
            const isSelected = selectedServices.some((s) => s._id === srv._id);

            return (
              <div
                key={srv._id}
                onClick={() => toggleSelectService(srv)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  border: isSelected
                    ? "2px solid #0f766e"
                    : "1px solid #cbd5e1",
                  backgroundColor: isSelected ? "#f0fdfa" : "#fff",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: "#0f172a" }}>{srv.name}</h4>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    ⏱ {srv.durationInMinutes} mins
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: "#0f766e",
                    }}
                  >
                    ₹{srv.price}
                  </span>
                  <button
                    type="button"
                    style={{
                      border: "none",
                      backgroundColor: isSelected ? "#0f766e" : "#e2e8f0",
                      color: isSelected ? "#fff" : "#0f172a",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                    }}
                  >
                    {isSelected ? "Selected ✓" : "Add +"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Cart Bar */}
      {selectedServices.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            maxWidth: "660px",
            backgroundColor: "#0f172a",
            color: "#fff",
            padding: "16px 24px",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", color: "#94a3b8" }}>
              {selectedServices.length} service(s) | ~{totalDuration} mins
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              Total: ₹{totalPrice}
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: "#14b8a6",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Select Slot →
          </button>
        </div>
      )}

      {/* Booking Slot Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "15px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {bookingSuccess ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <h2 style={{ color: "#0f766e" }}>🎉 Booking Confirmed!</h2>
                <p>
                  Thanks <strong>{bookingSuccess.customerName}</strong>, your
                  appointment is scheduled for:
                </p>
                <div
                  style={{
                    backgroundColor: "#f0fdfa",
                    padding: "12px",
                    borderRadius: "8px",
                    margin: "15px 0",
                  }}
                >
                  <p style={{ margin: "4px 0", fontWeight: "bold" }}>
                    📅{" "}
                    {new Date(bookingSuccess.bookingDate).toLocaleDateString()}
                  </p>
                  <p style={{ margin: "4px 0", fontWeight: "bold" }}>
                    ⏰ {bookingSuccess.startTime} - {bookingSuccess.endTime}
                  </p>
                  <p style={{ margin: "4px 0", color: "#0f766e" }}>
                    💰 Total: ₹{bookingSuccess.totalPrice}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <h3 style={{ margin: 0, color: "#0f172a" }}>
                    Book Appointment
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "20px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>

                {modalError && (
                  <div
                    style={{
                      backgroundColor: "#fee2e2",
                      color: "#991b1b",
                      padding: "10px",
                      borderRadius: "6px",
                      marginBottom: "12px",
                      fontSize: "14px",
                    }}
                  >
                    {modalError}
                  </div>
                )}

                {/* Customer Details */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number (10 digits)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>

                {/* Slots Grid */}
                {bookingDate ? (
                  <div>
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#475569",
                      }}
                    >
                      Select Available Slot (~{totalDuration} mins):
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "8px",
                        marginTop: "8px",
                      }}
                    >
                      {TIME_SLOTS.map((slot) => {
                        const disabled = isSlotDisabled(slot);
                        const isChosen = selectedSlot === slot;

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={disabled}
                            onClick={() => setSelectedSlot(slot)}
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
                                  : "#f8fafc",
                              color: disabled
                                ? "#dc2626"
                                : isChosen
                                  ? "#fff"
                                  : "#1e293b",
                              textDecoration: disabled
                                ? "line-through"
                                : "none",
                              opacity: disabled ? 0.75 : 1,
                            }}
                          >
                            {slot} {disabled ? "🚫" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      margin: "10px 0",
                    }}
                  >
                    👉 Pehle date choose karein taaki available slots load ho
                    sakein.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={bookingLoading || !selectedSlot}
                  style={{
                    width: "100%",
                    backgroundColor: "#0f766e",
                    color: "#fff",
                    border: "none",
                    padding: "12px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    marginTop: "20px",
                    cursor:
                      bookingLoading || !selectedSlot
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {bookingLoading
                    ? "Booking Appointment..."
                    : `Confirm Booking (₹${totalPrice})`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SalonPublicPage;
