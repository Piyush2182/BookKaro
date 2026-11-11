# BookKaro 💈

A full-stack salon management and appointment booking platform built to prevent chair double-bookings, automate walk-in/online slot synchronization, and track daily shop metrics.

---

## The Problem & Engineering Solution

Most basic scheduling applications store appointment times as strings (e.g. `"10:30 AM"`), leading to race conditions and broken logic when clients book multiple services with varied durations (such as a 20-minute haircut followed by a 45-minute facial).

BookKaro resolves this by converting all appointments into discrete numeric minutes from midnight:

$$\text{Minutes} = (\text{Hours} \times 60) + \text{Minutes}$$

### Conflict Detection (Mathematical Interval Intersection)
Before saving a new reservation or rendering available slots on the client, the backend verifies that the requested interval $[\text{newStart}, \text{newEnd}]$ does not overlap with any existing confirmed booking $[\text{start}, \text{end}]$ on that date:

$$\text{Conflict} \iff (\text{newStart} < \text{existingEnd}) \land (\text{newEnd} > \text{existingStart})$$

```javascript
// Timezone-safe whole-day interval query
const { start: dayStart, end: dayEnd } = getDateRange(bookingDate);

const existingConflict = await Booking.findOne({
  businessId,
  bookingDate: { $gte: dayStart, $lte: dayEnd },
  status: { $ne: "cancelled" },
  startMinutes: { $lt: endMinutes },
  endMinutes: { $gt: startMinutes }
});
