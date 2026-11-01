// "02:30 PM" -> 870
const parseTimeToMinutes = (timeString) => {
  const parts = timeString.trim().split(" ");
  if (parts.length !== 2) {
    throw new Error("Time must be in format 'HH:MM AM/PM' (e.g. '10:30 AM')");
  }

  const [time, modifier] = parts;
  let [hours, minutes] = time.split(":").map(Number);

  const upperModifier = modifier.toUpperCase();

  if (upperModifier === "PM" && hours !== 12) {
    hours += 12;
  }
  if (upperModifier === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

// 915 -> "03:15 PM"
const formatMinutesToTime = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const modifier = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour ko 12 banana

  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");

  return `${formattedHours}:${formattedMinutes} ${modifier}`;
};

module.exports = {
  parseTimeToMinutes,
  formatMinutesToTime,
};
