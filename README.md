# ⭐ Hotel Star View – Management System (PMS + Booking)

> *This site is created and maintained by Abhigya*

A full-stack, production-ready Hotel Property Management System (PMS) with public booking, role-based access, analytics, and financial tracking.

---

## 🗂️ Project Structure

```
hotel-star-view/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── auth.js             # JWT auth + role guard + log helper
│   ├── models/
│   │   ├── User.js             # Staff accounts (admin/manager/leaser)
│   │   ├── Room.js             # Dynamic room definitions
│   │   ├── Booking.js          # Reservation records (multi-guest)
│   │   ├── Expense.js          # Salary, advance, misc expenses
│   │   ├── SirPayment.js       # Owner payments (separate ledger)
│   │   ├── Log.js              # Full audit log
│   │   └── Pricing.js          # Public room pricing by type
│   ├── routes/
│   │   ├── auth.js             # Login, user CRUD
│   │   ├── rooms.js            # Room management & status
│   │   ├── bookings.js         # Full booking lifecycle
│   │   ├── expenses.js         # Expense tracking
│   │   ├── sirPayments.js      # Owner payment tracking
│   │   ├── reports.js          # Dashboard, analytics, range reports
│   │   ├── logs.js             # Audit log viewer (admin only)
│   │   ├── pricing.js          # Room type pricing
│   │   └── public.js           # Public booking portal (no auth)
│   ├── server.js               # Express app entry point
│   ├── seedAdmin.js            # Seed default users + rooms + pricing
│   ├── .env.example            # Environment variable template
│   └── package.json
│
└── frontend/                   # React 18 + Tailwind CSS
    ├── public/
    │   └── index.html          # HTML shell with Google Fonts
    ├── src/
    │   ├── api/
    │   │   └── axios.js        # Axios instance with JWT interceptor
    │   ├── context/
    │   │   └── AuthContext.js  # Global auth state (login/logout)
    │   ├── components/
    │   │   ├── Layout.js       # Sidebar + header shell
    │   │   ├── Modal.js        # Reusable modal dialog
    │   │   ├── StatCard.js     # KPI stat card
    │   │   ├── Spinner.js      # Loading indicator
    │   │   └── Alert.js        # Info/success/error/warning banners
    │   ├── pages/
    │   │   ├── Login.js        # Staff login page
    │   │   ├── Dashboard.js    # Live KPIs, web alerts, occupancy bar
    │   │   ├── Rooms.js        # Visual room grid with status management
    │   │   ├── Bookings.js     # Full booking table + multi-guest form
    │   │   ├── Expenses.js     # Expense + Sir Payment tracking tabs
    │   │   ├── Reports.js      # Charts, date-range reports, PDF/Excel export
    │   │   ├── Users.js        # User CRUD (admin only)
    │   │   ├── Logs.js         # Audit log viewer (admin only)
    │   │   └── PublicBooking.js # Guest-facing booking portal
    │   ├── utils/
    │   │   ├── helpers.js      # Date/currency formatters, badge styles
    │   │   └── exportUtils.js  # PDF (jsPDF) + Excel (SheetJS) exporters
    │   ├── App.js              # Router + protected route wrappers
    │   ├── index.js            # React DOM entry
    │   ├── index.css           # Tailwind + custom CSS variables
    │   └── tailwind.config.js  # Custom theme (saffron, peach, green)
    └── package.json
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET
npm install
npm run seed    # Creates admin/manager/leaser users + sample rooms
npm run dev     # Starts on port 5000
```

**Default credentials after seed:**
| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | Admin@123   |
| Manager | manager1  | Manager@123 |
| Leaser  | leaser1   | Leaser@123  |

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start       # Starts on port 3000 (proxied to backend)
```

### 3. Access the app
- **Staff Portal:** http://localhost:3000/login
- **Public Booking:** http://localhost:3000/book

---

## 👥 Role Permissions

| Feature              | Admin | Manager | Leaser |
|----------------------|-------|---------|--------|
| View all data        | ✅    | Today+Yesterday | ✅ |
| Create bookings      | ✅    | ✅      | ❌     |
| Edit bookings        | Any   | Same day only | ❌ |
| Manage room status   | ✅    | ✅      | ❌     |
| Add/remove rooms     | ✅    | ❌      | ❌     |
| Record expenses      | ✅    | ✅      | ❌     |
| View reports         | ✅    | ❌      | ✅     |
| Modify pricing       | ✅    | ❌      | ✅     |
| Manage users         | ✅    | ❌      | ❌     |
| View audit logs      | ✅    | ❌      | ❌     |

---

## 🌟 Key Features
- **Multi-guest bookings** with per-person country/phone tracking
- **Repeat customer detection** via phone number
- **Web booking alerts** highlighted in yellow on dashboard
- **Sir Payment ledger** completely separate from expenses
- **6-month data retention** supported by design
- **PDF + Excel export** for bookings and expenses
- **Real-time room grid** with color-coded status cards
- **Complete audit log** for every action in the system
