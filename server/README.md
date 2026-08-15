# Smart Police Station — Backend MVP

Cohesive Node.js + Express + MongoDB + Socket.IO backend for the hackathon MVP prototype.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js (ES Modules)
- **Database:** MongoDB running locally
- **ODM:** Mongoose
- **Realtime:** Socket.IO
- **External API Fallbacks:** Google Maps, Google AI (Gemini), Twilio

## Project Folder Structure
- `src/config/` — MongoDB and environmental secrets loaders.
- `src/models/` — MongoDB schemas (`User`, `PoliceStation`, `PoliceOfficer`, `Complaint`, `FIR`, `SOS`, `Patrol`, `Notification`, `Announcement`, `DailyReport`).
- `src/middleware/` — Authorization, Authentication, Multer Upload, and Global Error handlers.
- `src/services/` — Business logic helpers (AI Patrol planning, maps routing, Twilio SMS fallbacks, and hotspot density calculation).
- `src/sockets/` — Socket.IO rooms, connection setups, and live event triggers.
- `src/controllers/` & `src/routes/` — API routing and controller actions.
- `src/seed/` — Seeding scripts for sandbox testing.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Local MongoDB running on `mongodb://127.0.0.1:27017/smart_police`

### Installation
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Initialize the development environmental variables:
   ```bash
   cp .env.example .env
   ```

### Running Seeding and Dev Server
1. **Seed Admin User:**
   ```bash
   npm run seed:admin
   ```
   Admin Credentials:
   - Email: `admin@smartpolice.local`
   - Password: `admin123`

2. **Seed Mock Pune Records:**
   ```bash
   npm run seed
   ```

3. **Start Server:**
   ```bash
   npm run dev
   ```
   Server runs on: `http://localhost:8000`.

## API Documentation
See detailed endpoints definition in [docs/API.md](file:///d:/engineering-coding/projects/smart-police-station/server/docs/API.md).
