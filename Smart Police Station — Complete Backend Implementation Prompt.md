# Smart Police Station — Complete Backend

You are an expert full-stack backend engineer working on a hackathon project called **Smart Police Station**.

Build the **complete backend** for this project in one implementation.

The backend will serve three clients:

1. React Control Room/Admin dashboard
2. React Police dashboard
3. Expo Citizen mobile application

The goal is to create a functional hackathon MVP in a short time. Prioritize a working end-to-end system, clean architecture, simple implementation, and fast development.

Do not over-engineer the system.

---

# 1. TECHNOLOGY STACK

Use exactly:

### Backend

- Node.js
- Express.js
- MongoDB running locally
- Mongoose
- JavaScript
- ES Modules
- JWT
- bcryptjs
- cookie-parser
- cors
- multer
- Socket.IO
- dotenv
- morgan

### External services

- Google Maps Platform for map visualization/routing
- Twilio for optional SMS notifications
- AI API for patrol-plan recommendations

### File storage

For this hackathon, **DO NOT use Cloudinary, S3, Firebase Storage, MongoDB GridFS, or other cloud storage.**

Store uploaded files locally.

Use:

```text
server/uploads/
├── evidence/
├── complaints/
└── documents/
```

MongoDB stores the file metadata and local file path.

---

# 2. IMPORTANT HACKATHON CONSTRAINT

This is a 5–10 hour hackathon prototype.

Do NOT implement:

- microservices
- Redis
- PostgreSQL
- Prisma
- Docker
- Kubernetes
- complex event sourcing
- advanced ML training
- complicated legal FIR compliance
- complicated police hierarchy
- unnecessary abstractions
- production-grade infrastructure

Keep the backend modular but simple.

The entire system should run locally.

MongoDB should use:

```text
mongodb://127.0.0.1:27017/smart_police
```

---

# 3. PROJECT STRUCTURE

Create:

```text
server/
│
├── src/
│   │
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── station.controller.js
│   │   ├── officer.controller.js
│   │   ├── complaint.controller.js
│   │   ├── fir.controller.js
│   │   ├── sos.controller.js
│   │   ├── announcement.controller.js
│   │   ├── report.controller.js
│   │   ├── crime.controller.js
│   │   ├── patrol.controller.js
│   │   ├── notification.controller.js
│   │   └── dashboard.controller.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── PoliceStation.js
│   │   ├── PoliceOfficer.js
│   │   ├── Complaint.js
│   │   ├── FIR.js
│   │   ├── SOS.js
│   │   ├── Announcement.js
│   │   ├── DailyReport.js
│   │   ├── Patrol.js
│   │   └── Notification.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── station.routes.js
│   │   ├── officer.routes.js
│   │   ├── complaint.routes.js
│   │   ├── fir.routes.js
│   │   ├── sos.routes.js
│   │   ├── announcement.routes.js
│   │   ├── report.routes.js
│   │   ├── crime.routes.js
│   │   ├── patrol.routes.js
│   │   ├── notification.routes.js
│   │   └── dashboard.routes.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── station.service.js
│   │   ├── officer.service.js
│   │   ├── complaint.service.js
│   │   ├── fir.service.js
│   │   ├── sos.service.js
│   │   ├── notification.service.js
│   │   ├── hotspot.service.js
│   │   ├── patrol.service.js
│   │   ├── ai.service.js
│   │   ├── maps.service.js
│   │   └── twilio.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── error.middleware.js
│   │   ├── notFound.middleware.js
│   │   └── validation.middleware.js
│   │
│   ├── sockets/
│   │   ├── socket.js
│   │   ├── sos.socket.js
│   │   └── notification.socket.js
│   │
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── response.js
│   │   ├── generateToken.js
│   │   ├── generateId.js
│   │   ├── distance.js
│   │   └── constants.js
│   │
│   ├── seed/
│   │   ├── seed.js
│   │   └── seedAdmin.js
│   │
│   ├── app.js
│   └── server.js
│
├── uploads/
│   ├── evidence/
│   ├── complaints/
│   └── documents/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Do not create unnecessary files beyond what is required.

---

# 4. USER AND ROLE ARCHITECTURE

There are three primary categories:

```text
CITIZEN
POLICE
CONTROL ROOM ADMIN
```

Police has operational roles:

```text
STATION_HEAD
INVESTIGATING_OFFICER
FIELD_OFFICER
```

Therefore application roles are:

```text
CITIZEN
CONTROL_ROOM_ADMIN
STATION_HEAD
INVESTIGATING_OFFICER
FIELD_OFFICER
```

Do not create separate authentication systems for citizens and police.

All users use the same User model.

---

# 5. ORGANIZATIONAL HIERARCHY

The Control Room Admin is the highest authority.

```text
CONTROL ROOM ADMIN
        │
        ├── Police Station A
        │      ├── Station Head
        │      ├── Investigating Officers
        │      └── Field Officers
        │
        ├── Police Station B
        │      ├── Station Head
        │      ├── Investigating Officers
        │      └── Field Officers
        │
        └── Police Station C
               ├── Station Head
               ├── Investigating Officers
               └── Field Officers
```

### Critical rule

Police officers do NOT create police stations.

Police officers do NOT assign themselves to stations.

Only:

```text
CONTROL_ROOM_ADMIN
```

can:

- create police stations
- create police officers
- assign officers
- transfer officers
- assign station heads
- activate/deactivate stations

---

# 6. USER MODEL

Create `User`.

Fields:

```text
name
email
phone
password
role
status
avatar
lastLoginAt
createdAt
updatedAt
```

Roles:

```text
CITIZEN
CONTROL_ROOM_ADMIN
STATION_HEAD
INVESTIGATING_OFFICER
FIELD_OFFICER
```

Statuses:

```text
ACTIVE
INACTIVE
SUSPENDED
```

Requirements:

- unique email
- lowercase email
- bcrypt password hashing
- password excluded from normal queries/responses
- comparePassword() method
- timestamps

---

# 7. POLICE OFFICER MODEL

Create `PoliceOfficer`.

Fields:

```text
userId
stationId
badgeNumber
rank
role
dutyStatus
currentLocation
lastLocationUpdate
```

Rank values can include:

```text
COMMISSIONER
INSPECTOR
SUB_INSPECTOR
ASSISTANT_SUB_INSPECTOR
HEAD_CONSTABLE
CONSTABLE
```

System role is separate from rank.

Example:

```text
rank:
SUB_INSPECTOR

role:
INVESTIGATING_OFFICER
```

Duty status:

```text
ON_DUTY
OFF_DUTY
BUSY
AVAILABLE
```

Current location:

```js
{
  latitude,
  longitude
}
```

---

# 8. POLICE STATION MODEL

Create `PoliceStation`.

Fields:

```text
name
stationCode
address
phone
location
stationHeadId
status
createdAt
updatedAt
```

Location:

```js
{
  latitude,
  longitude
}
```

Statuses:

```text
ACTIVE
INACTIVE
```

Station codes must be unique.

---

# 9. STATION MANAGEMENT

Admin APIs:

```text
POST   /api/stations
GET    /api/stations
GET    /api/stations/:id
PATCH  /api/stations/:id
DELETE /api/stations/:id
PATCH  /api/stations/:id/status
```

Only `CONTROL_ROOM_ADMIN` can create/update/delete stations.

Deleting should preferably be a soft deactivate operation.

Do not physically delete a station if it has operational records.

---

# 10. OFFICER MANAGEMENT

Admin APIs:

```text
POST   /api/officers
GET    /api/officers
GET    /api/officers/:id
PATCH  /api/officers/:id
PATCH  /api/officers/:id/assign
PATCH  /api/officers/:id/transfer
PATCH  /api/officers/:id/status
PATCH  /api/officers/:id/location
```

Admin can:

- create officer
- assign officer to station
- transfer officer
- assign station head
- activate/deactivate officer
- view officer location

Station Head can:

- view officers belonging to their station
- update operational assignments where authorized

Officers cannot assign themselves.

---

# 11. AUTHENTICATION

Implement:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

Public registration must ALWAYS create:

```text
CITIZEN
```

Never trust a role supplied by the client during public registration.

Admin/police accounts are created through authorized admin functionality.

Use JWT:

```text
Access Token
Refresh Token
```

Access token contains:

```text
userId
role
```

Use HTTP-only cookie for refresh token.

Implement reusable:

```text
authenticate
authorizeRoles(...)
```

middleware.

---

# 12. COMPLAINT MODEL

Create `Complaint`.

Fields:

```text
complaintId
citizenId
crimeType
title
description
location
evidence
policeStationId
assignedOfficerId
status
priority
createdAt
updatedAt
```

Location:

```js
{
  latitude,
  longitude,
  address
}
```

Crime types:

```text
THEFT
ASSAULT
FRAUD
CYBER_CRIME
HARASSMENT
MISSING_PERSON
VANDALISM
TRAFFIC
OTHER
```

Priority:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Statuses:

```text
SUBMITTED
UNDER_REVIEW
ASSIGNED
INVESTIGATION
FIR_REGISTERED
RESOLVED
REJECTED
```

---

# 13. COMPLAINT ROUTING

When a citizen submits a complaint:

1. Receive complaint location.
2. Find the nearest active police station.
3. Assign `policeStationId`.
4. Create complaint.
5. Notify the station/control room through Socket.IO.

Use Haversine distance for nearest-station calculation.

Do NOT call Google Maps just to determine nearest station.

This reduces API usage.

---

# 14. EVIDENCE UPLOAD

Use Multer.

Support:

```text
IMAGE
VIDEO
DOCUMENT
```

Store files locally:

```text
uploads/evidence/
```

MongoDB stores:

```js
{
  type,
  originalName,
  filename,
  path,
  uploadedAt
}
```

Serve uploads using:

```text
GET /uploads/...
```

Validate:

- file size
- supported MIME type

Keep limits reasonable for a hackathon.

Do not store file binary data inside MongoDB.

---

# 15. COMPLAINT APIs

Implement:

```text
POST   /api/complaints
GET    /api/complaints
GET    /api/complaints/:id
PATCH  /api/complaints/:id/status
PATCH  /api/complaints/:id/assign
POST   /api/complaints/:id/evidence
```

Citizen:

- create complaint
- view own complaints
- view complaint details

Station Head:

- view station complaints
- assign officers
- update status

Investigating Officer:

- view assigned complaints
- update investigation
- add evidence

Admin:

- view all complaints
- assign/reassign
- monitor status

Citizens must never see another citizen's complaints.

---

# 16. FIR MODEL

Create `FIR`.

Fields:

```text
firNumber
complaintId
citizenId
policeStationId
investigatingOfficerId
crimeType
description
status
registeredAt
updatedAt
```

Status:

```text
REGISTERED
UNDER_INVESTIGATION
CLOSED
```

APIs:

```text
POST /api/firs
GET /api/firs
GET /api/firs/:id
PATCH /api/firs/:id/status
```

An FIR should normally be created from an existing complaint.

Generate a readable FIR number such as:

```text
FIR-2026-0001
```

Citizen can view only their FIRs.

Police can view authorized FIRs.

Admin can view all FIRs.

---

# 17. SOS MODEL

Create `SOS`.

Fields:

```text
sosId
citizenId
location
nearestStationId
assignedOfficerId
status
acknowledgedAt
dispatchedAt
resolvedAt
createdAt
```

Location:

```js
{
  latitude,
  longitude,
  address
}
```

Statuses:

```text
ACTIVE
ACKNOWLEDGED
DISPATCHED
RESOLVED
ESCALATED
```

---

# 18. SOS FLOW

Citizen:

```text
Press SOS
    ↓
Send GPS
    ↓
Backend
    ↓
Find nearest station
    ↓
Find available/on-duty field officer
    ↓
Create SOS
    ↓
Socket.IO alert
    ↓
Control Room
    ↓
Police Station
    ↓
Officer
```

APIs:

```text
POST  /api/sos
GET   /api/sos
GET   /api/sos/:id
PATCH /api/sos/:id/acknowledge
PATCH /api/sos/:id/dispatch
PATCH /api/sos/:id/resolve
PATCH /api/sos/:id/escalate
```

---

# 19. SOS ESCALATION

Primary behavior:

```text
Citizen
 ↓
Nearest station
 ↓
Available officer
```

If not acknowledged/responded to:

```text
Nearest Station
      ↓
Escalate
      ↓
Control Room
      ↓
Other nearby stations
```

For the prototype, do NOT build an actual background timer system.

Provide an explicit:

```text
ESCALATE SOS
```

operation.

When escalated, notify other relevant stations/control room via Socket.IO.

---

# 20. SOCKET.IO

Integrate Socket.IO with the Express HTTP server.

Create logical events:

```text
sos:new
sos:updated
complaint:new
complaint:updated
officer:location
announcement:new
notification:new
```

Use rooms where useful:

```text
control-room
station:<stationId>
officer:<officerId>
citizen:<citizenId>
```

Examples:

### New SOS

```text
Citizen
→ backend
→ station:<stationId>
→ control-room
```

### Complaint assignment

```text
Station Head
→ backend
→ officer:<officerId>
```

### Citizen complaint status

```text
Police
→ backend
→ citizen:<citizenId>
```

Do not build an unnecessarily complex event architecture.

---

# 21. OFFICER LOCATION

Provide:

```text
PATCH /api/officers/:id/location
```

Payload:

```json
{
  "latitude": 18.5098,
  "longitude": 73.8112
}
```

Update:

```text
currentLocation
lastLocationUpdate
```

Emit:

```text
officer:location
```

to the relevant control room/station room.

The frontend can use this data to render officer markers on the map.

For the hackathon, periodic foreground updates are sufficient.

Do not implement complicated continuous background tracking.

---

# 22. ANNOUNCEMENTS / PUBLIC SAFETY ALERTS

Create `Announcement`.

This represents messages sent by police to citizens.

Fields:

```text
title
message
type
severity
targetArea
stationId
createdBy
expiresAt
status
createdAt
```

Types:

```text
CRIME_ALERT
ROAD_ALERT
MISSING_PERSON
PUBLIC_SAFETY
GENERAL
```

Severity:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Status:

```text
ACTIVE
EXPIRED
ARCHIVED
```

---

# 23. AREA-BASED ALERTS

The prototype should support:

```text
targetArea.name
```

Example:

```text
Kothrud
Baner
Wakad
Aundh
```

Do not build complex geofencing initially.

Future-compatible structure can support:

```js
{
  name,
  latitude,
  longitude,
  radius
}
```

Citizens can retrieve active announcements.

APIs:

```text
POST   /api/announcements
GET    /api/announcements
GET    /api/announcements/:id
PATCH  /api/announcements/:id
DELETE /api/announcements/:id
```

Admin and Station Head can publish announcements according to authorization.

---

# 24. DAILY SAFETY REPORTS

Create `DailyReport`.

Fields:

```text
date
totalComplaints
crimeBreakdown
activeSOS
resolvedCases
highRiskAreas
summary
createdBy
createdAt
```

The report must be generated from actual MongoDB data.

Example:

```text
Total complaints: 27

Theft: 8
Fraud: 6
Traffic: 5
Cyber Crime: 4
Other: 4
```

AI may summarize the real statistics.

AI must NEVER invent statistics.

API:

```text
POST /api/reports/daily/generate
GET  /api/reports/daily
GET  /api/reports/daily/:id
```

---

# 25. CRIME HOTSPOT ANALYSIS

Create a crime intelligence service.

Do not train an ML model.

Use simple geographic clustering/grid logic.

Input:

```text
complaint locations
crime types
timestamps
```

Output:

```json
{
  "name": "Kothrud",
  "latitude": 18.5074,
  "longitude": 73.8077,
  "incidentCount": 32,
  "severity": "HIGH",
  "crimeTypes": [
    "THEFT",
    "ASSAULT"
  ]
}
```

Severity can be calculated simply:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

based on incident count.

Provide:

```text
GET /api/crime/hotspots
GET /api/crime/statistics
```

Do not persist calculated hotspots unless useful.

It is acceptable to calculate them dynamically for the prototype.

---

# 26. PATROL MODEL

Create `Patrol`.

Fields:

```text
patrolId
stationId
officerIds
route
priority
status
aiGenerated
reason
createdBy
createdAt
```

Route:

```js
{
  waypoints: [
    {
      name,
      latitude,
      longitude
    }
  ],
  distance,
  duration,
  encodedPolyline
}
```

Status:

```text
PLANNED
ACTIVE
COMPLETED
CANCELLED
```

---

# 27. AI PATROL PLANNING

Implement:

```text
POST /api/patrols/generate
```

Input can contain:

```json
{
  "stationId": "...",
  "hotspots": [],
  "availableOfficers": []
}
```

The AI service should recommend:

- priority hotspots
- patrol order
- suitable available officers
- reasoning

Example:

```json
{
  "priorityAreas": [
    "Kothrud",
    "Baner",
    "Aundh"
  ],
  "reason":
    "High incident density was detected in Kothrud and Baner. The route prioritizes these areas while minimizing unnecessary travel."
}
```

---

# 28. IMPORTANT AI ARCHITECTURE

Do NOT make the LLM responsible for actual road navigation.

Use:

```text
MongoDB crime data
       ↓
Hotspot service
       ↓
AI service
       ↓
Priority + waypoint order
       ↓
Maps service
       ↓
Actual road route
```

The AI service must be isolated in:

```text
src/services/ai.service.js
```

Use an environment variable for the AI API key.

If the AI API is unavailable, implement a deterministic fallback algorithm so the patrol planner still works.

The fallback should prioritize hotspots by severity and incident count.

---

# 29. GOOGLE MAPS

Create a `maps.service.js`.

Do not call Google Maps for every simple geographic calculation.

Use local Haversine calculations for:

- nearest station
- basic distance
- hotspot grouping

Use Google Maps only for:

- actual road route
- route distance/duration
- route visualization data where required

Use environment variables for Google Maps credentials/API key.

The backend should expose route information to the frontend.

Example:

```text
POST /api/patrols/route
```

Input:

```json
{
  "origin": {
    "latitude": 18.5074,
    "longitude": 73.8077
  },
  "waypoints": [
    {
      "latitude": 18.5100,
      "longitude": 73.8100
    }
  ]
}
```

Do not make Google Maps mandatory for the backend to start.

If the Maps API is unavailable, return a useful fallback response.

---

# 30. TWILIO

Create:

```text
src/services/twilio.service.js
```

Twilio should be optional.

Environment variables:

```text
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

Support SMS notifications for:

- complaint registration
- FIR registration
- SOS alerts
- public safety alerts

Do not make the entire API fail if Twilio is not configured.

If Twilio credentials are missing:

```text
log:
"Twilio not configured; SMS skipped."
```

The core application must continue working.

---

# 31. NOTIFICATION MODEL

Create `Notification`.

Fields:

```text
recipientId
type
title
message
referenceType
referenceId
isRead
createdAt
```

Types:

```text
COMPLAINT
FIR
SOS
ANNOUNCEMENT
PATROL
SYSTEM
```

APIs:

```text
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

Notifications should support both:

- persistent database notification
- realtime Socket.IO notification

---

# 32. DASHBOARD APIs

Create summary endpoints so frontend does not need to make dozens of requests.

### Admin dashboard

```text
GET /api/dashboard/admin
```

Return:

```text
totalStations
activeStations
totalOfficers
activeOfficers
totalComplaints
pendingComplaints
totalFIRs
activeSOS
activeHotspots
recentSOS
recentComplaints
```

### Station dashboard

```text
GET /api/dashboard/station
```

Return station-specific:

```text
complaints
FIRs
SOS
officers
activePatrols
statistics
```

### Officer dashboard

```text
GET /api/dashboard/officer
```

Return:

```text
assignedComplaints
assignedFIRs
SOSAssignments
patrolAssignments
dutyStatus
```

### Citizen dashboard

```text
GET /api/dashboard/citizen
```

Return:

```text
myComplaints
myFIRs
activeSOS
notifications
announcements
```

---

# 33. ROLE PERMISSIONS

Implement reusable role authorization.

### CONTROL_ROOM_ADMIN

Can:

- manage stations
- manage officers
- assign/transfer officers
- view all complaints
- view all FIRs
- view all SOS
- manage announcements
- generate reports
- view hotspots
- generate patrol plans
- view all dashboards

### STATION_HEAD

Can:

- view own station
- view station officers
- manage station complaints
- assign complaints
- view station FIRs
- manage station SOS
- create patrols
- publish station safety announcements

Cannot:

- create stations
- manage unrelated stations
- create Control Room Admins

### INVESTIGATING_OFFICER

Can:

- view assigned complaints
- update investigation
- upload evidence
- create/update FIRs where authorized
- view assigned cases

### FIELD_OFFICER

Can:

- view field assignments
- respond to SOS
- update patrol status
- update location

### CITIZEN

Can:

- manage own profile
- create complaints
- view own complaints
- upload evidence
- view own FIRs
- trigger SOS
- view own notifications
- view public safety announcements
- view daily reports

Never allow users to access another user's private data.

---

# 34. API RESPONSE FORMAT

Use consistent responses.

Success:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}
```

Use HTTP status codes correctly.

---

# 35. ERROR HANDLING

Implement:

```text
ApiError
asyncHandler
notFoundMiddleware
errorMiddleware
```

Handle:

- validation errors
- duplicate keys
- invalid ObjectIds
- JWT errors
- missing resources
- unauthorized access
- forbidden access
- file upload errors
- external service errors

Do not expose sensitive internal errors.

---

# 36. VALIDATION

Use lightweight validation.

Validate:

- email
- password
- required fields
- ObjectIds
- latitude/longitude
- enum values
- file types
- file sizes

Do not introduce a huge validation framework unless genuinely useful.

---

# 37. LOCAL FILE SERVING

Expose:

```text
/uploads
```

as a static directory.

Example:

```text
http://localhost:8000/uploads/evidence/file.jpg
```

The backend should construct usable file URLs based on the configured API base URL.

Do not assume production domain names.

---

# 38. SEED DATA

Create a development seed script:

```text
npm run seed
```

It should create:

### Admin

```text
Control Room Admin
```

### Police stations

At least:

```text
Kothrud Police Station
Baner Police Station
Wakad Police Station
Aundh Police Station
Shivajinagar Police Station
```

Use realistic Pune coordinates.

### Officers

Create several officers across the stations:

- Station Heads
- Investigating Officers
- Field Officers

### Citizens

Create a few demo citizens.

### Complaints

Create sample historical complaints with locations.

### FIRs

Create sample FIRs.

### Optional SOS

Create sample resolved SOS records.

The seed should be idempotent where practical and should not create unlimited duplicates every time it runs.

---

# 39. DEMO DATA IS IMPORTANT

The purpose of seed data is to make the dashboards immediately useful.

After:

```text
npm run seed
```

the admin dashboard should already have:

- multiple police stations
- multiple officers
- complaints
- FIRs
- crime locations
- hotspots
- public safety examples

This is a hackathon demo.

---

# 40. ENVIRONMENT VARIABLES

Create `.env.example` containing:

```env
NODE_ENV=development
PORT=8000

MONGODB_URI=mongodb://127.0.0.1:27017/smart_police

JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

API_BASE_URL=http://localhost:8000

GOOGLE_MAPS_API_KEY=

AI_API_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

ADMIN_NAME=Control Room Admin
ADMIN_EMAIL=admin@smartpolice.local
ADMIN_PASSWORD=admin123
```

Never commit the actual `.env`.

---

# 41. ROUTE PREFIX

Use:

```text
/api
```

Do not introduce unnecessary versioning for this hackathon.

Examples:

```text
/api/auth
/api/stations
/api/officers
/api/complaints
/api/firs
/api/sos
/api/announcements
/api/reports
/api/crime
/api/patrols
/api/notifications
/api/dashboard
```

---

# 42. SECURITY BASELINE

Implement:

- password hashing
- JWT
- HTTP-only refresh cookie
- CORS
- environment secrets
- authorization middleware
- ownership checks
- basic validation
- file validation

Do not implement:

- OAuth
- MFA
- Redis
- complex rate limiting
- production secret management
- advanced audit infrastructure

---

# 43. HEALTH CHECK

Implement:

```text
GET /api/health
```

Return:

```json
{
  "success": true,
  "message": "Smart Police backend is healthy",
  "data": {
    "status": "UP",
    "database": "connected",
    "timestamp": "..."
  }
}
```

---

# 44. COMPLETE DEMO FLOW

The backend must support this complete scenario:

## Citizen complaint

```text
Citizen
 ↓
POST /complaints
 ↓
GPS location
 ↓
Nearest Police Station
 ↓
Complaint created
 ↓
Socket notification
 ↓
Police dashboard
```

## Police investigation

```text
Station Head
 ↓
Assign officer
 ↓
Investigating Officer
 ↓
Update status
 ↓
Upload evidence
 ↓
Create FIR
```

## Citizen tracking

```text
Citizen
 ↓
GET /complaints
 ↓
See:
SUBMITTED
ASSIGNED
INVESTIGATION
FIR_REGISTERED
RESOLVED
```

## SOS

```text
Citizen
 ↓
SOS
 ↓
GPS
 ↓
Nearest Station
 ↓
Available Field Officer
 ↓
Socket.IO
 ↓
Control Room
 ↓
Police Station
 ↓
Dispatch
```

## Crime intelligence

```text
Complaints
 ↓
Locations
 ↓
Hotspot analysis
 ↓
HIGH/MEDIUM/LOW areas
```

## AI patrol

```text
Hotspots
 ↓
AI
 ↓
Priority order
 ↓
Google Maps
 ↓
Actual patrol route
```

## Public safety

```text
Police/Admin
 ↓
Announcement
 ↓
Citizen
 ↓
Expo notification/feed
```

---

# 45. API DOCUMENTATION

Create:

```text
docs/API.md
```

Document every API:

- method
- endpoint
- authentication
- allowed roles
- request body
- response
- important errors

Group documentation by:

```text
Authentication
Stations
Officers
Complaints
FIRs
SOS
Announcements
Reports
Crime Intelligence
Patrols
Notifications
Dashboards
```

The frontend developers will use this document as the API contract.

---

# 46. README

Create a useful README containing:

- project overview
- architecture
- prerequisites
- Node version
- local MongoDB setup
- installation
- environment variables
- seed commands
- development command
- API URL
- uploads URL
- frontend integration notes

Example:

```text
npm install
npm run seed
npm run dev
```

---

# 47. DEVELOPMENT COMMANDS

Package scripts should include:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node src/seed/seed.js",
    "seed:admin": "node src/seed/seedAdmin.js"
  }
}
```

---

# 48. IMPORTANT IMPLEMENTATION RULES

Before coding:

1. Inspect the current repository.
2. Preserve existing useful code.
3. Check existing package.json.
4. Do not blindly overwrite existing working files.
5. If the repository is empty, create the backend structure.
6. Use JavaScript ES Modules.
7. Keep controllers thin.
8. Put reusable business logic in services.
9. Keep Mongoose models focused.
10. Use middleware for authentication/authorization.
11. Use Socket.IO only where realtime behavior is actually required.

---

# 49. DO NOT OVER-ENGINEER

This project needs to be finished quickly.

Prefer:

```text
simple
clear
working
demo-ready
```

over:

```text
enterprise
complex
abstract
over-engineered
```

Do not create repositories, dependency injection frameworks, complex factories, CQRS, event sourcing, or microservices.

---

# 50. FALLBACK BEHAVIOR

External services are optional.

The backend must still work when:

- Google Maps API key is missing
- AI API key is missing
- Twilio credentials are missing

Implement graceful fallback behavior.

### AI fallback

Use deterministic hotspot prioritization.

### Maps fallback

Return waypoint coordinates and approximate Haversine distance.

### Twilio fallback

Log that SMS was skipped.

The core backend must remain functional.

---

# 51. VERIFICATION

After implementation, actually run:

```text
npm install
npm run seed
npm run dev
```

Verify:

### Infrastructure

- MongoDB connects
- Express starts
- Socket.IO starts
- uploads directory works

### Authentication

- citizen registration
- citizen login
- admin login
- protected endpoint
- role authorization
- logout
- refresh token

### Organization

- create station
- create officer
- assign officer
- transfer officer
- assign station head

### Complaints

- create complaint
- nearest station assignment
- evidence upload
- officer assignment
- status update

### FIR

- create FIR
- retrieve FIR
- citizen ownership

### SOS

- trigger SOS
- nearest station
- officer selection
- Socket.IO notification
- acknowledge
- dispatch
- resolve
- escalate

### Public safety

- create announcement
- retrieve announcement
- daily report

### Intelligence

- hotspot calculation
- statistics
- patrol plan fallback

### Dashboard

- admin dashboard
- station dashboard
- officer dashboard
- citizen dashboard

Fix runtime errors discovered during verification.

Do not claim an integration works unless it has been tested or the external credentials are unavailable.

---

# 52. FINAL OUTPUT FROM THE AGENT

When implementation is complete, provide a concise summary containing:

1. What was implemented
2. Folder structure
3. MongoDB collections/models
4. API route groups
5. Authentication/authorization design
6. Socket.IO events
7. File upload behavior
8. External integrations
9. Seed credentials
10. Commands to run the backend
11. What was actually tested
12. Any remaining limitations

Do not automatically start building React or Expo.

The backend should be considered complete when all backend workflows described above are implemented and verified.

# FINAL PRODUCT ARCHITECTURE

The resulting backend should support:

```text
                         SMART POLICE BACKEND
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              CONTROL ROOM                   USERS
                    │                           │
          ┌─────────┼─────────┐          ┌──────┴──────┐
          │         │         │          │             │
       Stations  Officers  Analytics   Citizens      Police
          │         │         │          │             │
          └─────────┼─────────┘          │             │
                    │                    │             │
                    └────────────┬───────┴─────────────┘
                                 │
                           Express API
                                 │
                     ┌───────────┼───────────┐
                     │           │           │
                  MongoDB     Socket.IO    Local Files
                     │                       │
                     │                    Evidence
                     │
             ┌───────┴────────┐
             │                │
        Crime Analytics    Operations
             │                │
             ▼                ▼
       Crime Hotspots     SOS / Patrol
             │                │
             └───────┬────────┘
                     │
             ┌───────┼────────┐
             │       │        │
            AI     Maps     Twilio
             │       │        │
             └───────┼────────┘
                     ▼
              Smart Police
               Operations
```

Build this as a **single cohesive backend**, not as independent disconnected CRUD modules.

After implementation, stop and wait for the next instruction.