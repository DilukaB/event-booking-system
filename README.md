# Event Booking System — SLIIT SE2020 Assignment

## 🗂️ Project Structure

```
Event booking/
├── backend/                   ← Node.js + Express API
│   ├── config/db.js           ← MongoDB Atlas connection
│   ├── controllers/
│   │   ├── authController.js  ← Register, Login, GetMe
│   │   ├── eventController.js ← Full CRUD + Image Upload
│   │   └── ticketController.js← Booking, Cancel, Business Logic
│   ├── middleware/
│   │   ├── authMiddleware.js  ← JWT protect + adminOnly
│   │   ├── uploadMiddleware.js← Multer image upload
│   │   └── errorMiddleware.js ← Global error handler
│   ├── models/
│   │   ├── User.js            ← bcrypt password hashing
│   │   ├── Event.js           ← Event schema
│   │   └── Ticket.js          ← Ticket schema with auto-populate
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── ticketRoutes.js
│   ├── uploads/               ← Local image storage (auto-created)
│   ├── .env                   ← ⚠️ Configure your MongoDB URI here!
│   ├── server.js              ← Entry point
│   └── package.json
│
└── EventBookingApp/           ← React Native Mobile App
    ├── src/
    │   ├── api/
    │   │   ├── axios.js       ← Axios instance + JWT interceptor
    │   │   └── index.js       ← API service functions
    │   ├── context/
    │   │   └── AuthContext.js ← Auth state management
    │   ├── navigation/
    │   │   └── AppNavigator.js← Auth/Main stack navigation
    │   ├── screens/
    │   │   ├── Auth/
    │   │   │   ├── LoginScreen.js
    │   │   │   └── RegisterScreen.js
    │   │   ├── Events/
    │   │   │   ├── EventListScreen.js
    │   │   │   ├── EventDetailScreen.js
    │   │   │   ├── CreateEventScreen.js
    │   │   │   └── EditEventScreen.js
    │   │   └── Tickets/
    │   │       ├── MyTicketsScreen.js
    │   │       └── TicketDetailScreen.js
    │   ├── components/index.js← Reusable UI components
    │   └── theme/index.js     ← Design tokens (colors, spacing...)
    ├── App.js
    └── package.json
```

---

## ⚙️ Backend Setup

### 1. Configure Environment Variables

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<your-user>:<your-password>@cluster0.mongodb.net/eventbooking?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRE=7d
```

### 2. Install, Seed & Run

```bash
cd "Event booking/backend"
npm install

# (Optional but Recommended) Populate sample users, events and bookings:
npm run seed

npm run dev        # Uses nodemon for hot-reload
# OR
npm start          # Production mode
```

The API will be running at: `http://localhost:5000/api`

### 3. Postman Collection
Import `backend/Event_Booking_API.postman_collection.json` into Postman or Thunder Client to test all 13 endpoints with automated JWT token handling!

---

 

---

## 📡 API Endpoints

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login & get JWT |
| GET | `/api/auth/me` | Protected | Get current user profile |

### Events
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/events` | Public | Get all events (supports `?search=&status=&page=&limit=`) |
| GET | `/api/events/:id` | Public | Get single event |
| POST | `/api/events` | Protected | Create event (with image upload via `multipart/form-data`) |
| PUT | `/api/events/:id` | Protected (Owner/Admin) | Update event |
| DELETE | `/api/events/:id` | Protected (Owner/Admin) | Delete event |

### Tickets
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/tickets` | Protected | Book ticket (enforces seat availability) |
| GET | `/api/tickets/my-tickets` | Protected | Get all my tickets |
| GET | `/api/tickets/:id` | Protected (Owner/Admin) | Get ticket details |
| PUT | `/api/tickets/:id/cancel` | Protected (Owner/Admin) | Cancel ticket & release seats |
| DELETE | `/api/tickets/:id` | Protected (Owner/Admin) | Delete cancelled ticket |

---

## 💼 Business Logic

### Booking Logic
1. Checks event exists and is **Active**
2. Validates `ticketQuantity <= event.availableSeats` → returns 400 if insufficient
3. Calculates `totalAmount = quantity × ticketPrice`
4. Deducts seats: `availableSeats -= ticketQuantity`
5. Auto-sets event status to **"Sold Out"** if `availableSeats === 0`

### Cancellation Logic
1. Marks ticket status as **"Cancelled"**
2. Restores seats: `availableSeats += ticketQuantity`
3. If event was **"Sold Out"** → status reverts to **"Active"**

---

## 📱 Mobile App Setup

### 1. Prerequisites
- Node.js ≥ 18
- Java JDK 17 (for Android)
- Android Studio + Emulator OR physical device
- React Native CLI: `npm install -g react-native-cli`

### 2. Configure API Base URL

Edit `EventBookingApp/src/api/axios.js`:
```js
// Android Emulator
export const BASE_URL = 'http://10.0.2.2:5000/api';

// iOS Simulator
export const BASE_URL = 'http://localhost:5000/api';

// Physical Device (replace with your machine's local IP)
export const BASE_URL = 'http://192.168.x.x:5000/api';
```

### 3. Install & Run

```bash
cd "Event booking/EventBookingApp"
npm install

# For Android
npx react-native run-android

# For iOS (Mac only)
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## 🔐 Authentication Flow

1. User registers/logs in → receives JWT token
2. Token stored in **AsyncStorage**
3. Axios interceptor automatically attaches `Authorization: Bearer <token>` to all requests
4. 401 responses auto-clear stored credentials and redirect to login
5. On app restart, token is loaded from storage to restore session

---

## 🎨 UI Features

| Screen | Features |
|--------|----------|
| **Login/Register** | Animated entrance, form validation, error banners, show/hide password |
| **Event List** | Search bar, status filter pills, occupancy bars, image cards, FAB |
| **Event Detail** | Parallax hero image, seat availability bar, booking modal, edit/delete for owners |
| **Create/Edit Event** | Image picker, inline validation, status selector, multiline description |
| **My Tickets** | Stats dashboard, ticket-style cards, cancel/delete actions |
| **Ticket Detail** | Realistic ticket design with barcode visual and tear line |

---

## 🛡️ Security Features

- **bcryptjs** (12 rounds) for password hashing
- **JWT** with configurable expiry (default 7 days)
- Bearer token validation middleware on all protected routes
- Authorization checks: only resource owners or admins can modify/delete
- Input validation via **express-validator** on all write endpoints
- Global error handler with proper HTTP status codes
- CORS configured for cross-origin requests

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native 0.73, React Navigation, Axios |
| State | React Context API + AsyncStorage |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas via Mongoose |
| Auth | bcryptjs, JSON Web Tokens |
| Image Upload | Multer (local disk storage → `/uploads`) |
| Validation | express-validator |
| Logging | Morgan |
