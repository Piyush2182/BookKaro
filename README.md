# BookKaro 💈

A production-ready full-stack salon operations and appointment booking platform engineered to eliminate double-booking race conditions, unify offline walk-ins with online reservations, and provide shop owners with live revenue metrics.

---

## 📌 Problem & Mathematical Scheduling Engine

Most lightweight booking applications store appointment slots as arbitrary strings (e.g. `"10:30 AM"`). This design pattern collapses when clients book multiple services with varying completion durations (e.g., a 20-minute haircut followed by a 45-minute skin treatment), creating scheduling gaps or conflicting overlaps.

BookKaro solves this by converting all calendar intervals into normalized integer minutes from midnight:

$$\text{Minutes} = (\text{Hours}_{24} \times 60) + \text{Minutes}$$

*Examples:*
- `10:30 AM` $\rightarrow (10 \times 60) + 30 = \mathbf{630}$
- `01:15 PM` $\rightarrow (13 \times 60) + 15 = \mathbf{795}$

### Conflict Detection (Mathematical Interval Intersection)
Before persisting an appointment or rendering available slots on the client, the system computes the requested span $[\text{newStart}, \text{newEnd}]$. A collision is mathematically detected if and only if:

$$\text{Conflict} \iff (\text{newStart} < \text{existingEnd}) \land (\text{newEnd} > \text{existingStart})$$

```javascript
// Timezone-safe local day-boundary lookup
const [year, month, day] = bookingDate.split("-").map(Number);
const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

const existingConflict = await Booking.findOne({
  businessId,
  bookingDate: { $gte: dayStart, $lte: dayEnd },
  status: { $ne: "cancelled" },
  startMinutes: { $lt: endMinutes },
  endMinutes: { $gt: startMinutes }
});
```

When an overlap occurs, the API returns an HTTP `409 Conflict`. On the frontend, occupied intervals are automatically styled with a visual strike-through and disabled (`🚫`) in real time.

---

## 📁 Repository Structure

```text
BookKaro/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosInstance.js       # Axios base instance with Bearer auth
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx      # Salon KPIs, Queue, Catalog, Walk-in
│   │   │   ├── LoginPage.jsx          # Business authentication
│   │   │   ├── RegisterPage.jsx       # Business registration & slug setup
│   │   │   └── SalonPublicPage.jsx    # Public customer booking & slot grid
│   │   ├── App.jsx                    # Routing configuration
│   │   └── main.jsx                   # Vite root entry
│   ├── vercel.json                    # Single Page Application rewrite rules
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── bookingController.js   # Interval logic, overlap engine, walk-in
│   │   │   ├── businessController.js  # Business profile & public slug routing
│   │   │   └── serviceController.js   # Catalog item CRUD operations
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js      # JWT protectBusiness verification guard
│   │   ├── models/
│   │   │   ├── Booking.js             # Booking Schema with numeric minutes
│   │   │   ├── Business.js            # Business Schema (store details, slugs)
│   │   │   └── Service.js             # Service Schema (duration in minutes)
│   │   └── routes/
│   │       ├── bookingRoutes.js       # /api/bookings routes
│   │       ├── businessRoutes.js      # /api/businesses routes
│   │       └── serviceRoutes.js       # /api/services routes
│   ├── server.js                      # Express configuration & DB connection
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🌟 Key Features

### 1. Customer Public Experience (`/salon/:slug`)
- **Direct Business Slugs:** Shareable, SEO-friendly custom URLs (`/salon/thakur-cutz`).
- **Dynamic Multi-Service Basket:** Customers can choose multiple grooming services at once. Cumulative price and runtime duration calculate instantaneously.
- **Dynamic Slot Availability:** Real-time day queries check busy intervals and disable conflicting start times based on total cart duration.

### 2. Salon Owner Dashboard (`/dashboard`)
- **Real-Time Financial & Operational KPIs:** Live tracking of Today's Bookings count, Today's Collected Revenue (filtered by fulfilled appointments), and Pending Schedules.
- **Timeline & Status Filtering:** Filter appointments by timeline (`Today`, `Upcoming`, `All`) and state (`Confirmed`, `Completed`, `Cancelled`).
- **One-Click Order Management:** Transition appointment statuses (`Mark Done ✓` or `Cancel ✕`) with immediate database persistence.
- **Service Catalog CRUD:** Add, update, and remove services with runtime minute configurations.

### 3. Integrated Walk-in Scheduler
- Record in-person customers directly from the owner console.
- Shares the same overlap conflict engine to lock chairs in real time, preventing concurrent bookings by online customers.

---

## 🛠️ Technology Stack

| Layer | Tools & Libraries |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas via Mongoose ODM |
| **Security** | JSON Web Tokens (JWT), bcryptjs password hashing, CORS |
| **Hosting Targets** | Vercel (Client SPA), Render (API Web Service), MongoDB Atlas (Cloud Database) |

---

## 🔌 API Endpoints Reference

### Public Routes
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/businesses/register` | Register new business account |
| `POST` | `/api/businesses/login` | Authenticate owner and issue JWT |
| `GET` | `/api/businesses/public/:slug` | Fetch salon public profile and services |
| `POST` | `/api/bookings` | Create an online or walk-in appointment |
| `GET` | `/api/bookings/busy-slots` | Fetch all occupied intervals for a given date |

### Protected Owner Routes (`Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/services` | Retrieve salon service catalog |
| `POST` | `/api/services` | Add new service item |
| `DELETE` | `/api/services/:id` | Remove service from catalog |
| `GET` | `/api/bookings/my-bookings` | Fetch all salon bookings |
| `PATCH` | `/api/bookings/:id/status` | Update booking status (`completed`, `cancelled`) |

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Piyush2182/BookKaro.git
cd BookKaro
```

### 2. Server Setup
```bash
cd server
npm install
```

Create a `.env` file in the `/server` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend:
```bash
npm run dev
```

### 3. Client Setup
```bash
cd ../client
npm install
```

Create a `.env` file in the `/client` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the client:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🚀 Production Deployment

1. **MongoDB Atlas:** Create a free cluster, whitelist all network IPs (`0.0.0.0/0`), and copy the connection string.
2. **Render (Backend):** Create a Web Service pointing to `/server`, set build command `npm install`, start command `node server.js`, and add the environment variables (`MONGO_URI`, `JWT_SECRET`, `PORT`).
3. **Vercel (Frontend):** Import the repository with root directory set to `client`, framework preset `Vite`, and configure the environment variable `VITE_API_URL` pointing to your deployed Render URL (e.g., `https://<render-url>/api`).

---

## 👨‍💻 Author
**Piyush Thakur**
- Full-Stack MERN Implementation