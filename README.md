# 🚚 Last-Mile Delivery Tracker

```{=html}
<p align="center">
```
`<strong>`{=html}A full-stack delivery management platform for
intelligent order processing, dynamic pricing, agent assignment,
delivery tracking, and customer notifications.`</strong>`{=html}
```{=html}
</p>
```
```{=html}
<p align="center">
```
`<img src="https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">`{=html}
`<img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">`{=html}
`<img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">`{=html}
`<img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">`{=html}
`<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">`{=html}
```{=html}
</p>
```

------------------------------------------------------------------------

## 📌 Overview

**Last-Mile Delivery Tracker** is a full-stack logistics management
platform designed to simplify and automate the last-mile delivery
lifecycle.

The system supports three role-based users:

-   👤 **Customer**
-   🚚 **Delivery Agent**
-   🛡️ **Administrator**

Customers can create and track orders, while administrators configure
delivery zones, rate cards, COD charges, and agents. Delivery agents
manage assigned deliveries and update shipment statuses throughout the
delivery journey.

The platform automatically detects pickup and drop zones, calculates
volumetric and billable weight, applies the appropriate B2B/B2C rate
card, adds COD surcharges when applicable, and maintains an order
tracking history.

------------------------------------------------------------------------

# ✨ Key Features

## 👤 Customer

-   Secure registration and login
-   Create delivery orders
-   Enter pickup and drop addresses
-   Enter package dimensions and actual weight
-   Select B2B/B2C order type
-   Select Prepaid/COD payment type
-   Preview delivery charge before confirmation
-   View all personal orders
-   View complete order details
-   Track order status
-   View chronological tracking history
-   Reschedule failed deliveries
-   Receive delivery status email notifications

------------------------------------------------------------------------

## 🚚 Delivery Agent

-   Secure agent login
-   View agent profile
-   Manage availability
    -   Available
    -   Busy
    -   Offline
-   View assigned deliveries
-   View order details
-   Update delivery status

Delivery lifecycle:

``` text
ASSIGNED
    ↓
PICKED_UP
    ↓
IN_TRANSIT
    ↓
OUT_FOR_DELIVERY
    ↓
DELIVERED
```

Failed delivery flow:

``` text
OUT_FOR_DELIVERY
        ↓
      FAILED
        ↓
Customer Reschedules
        ↓
New Delivery Attempt
        ↓
Agent Reassigned
```

------------------------------------------------------------------------

## 🛡️ Administrator

### Order Management

-   View all orders
-   View order details
-   Filter and manage delivery orders
-   Manually assign agents
-   Trigger automatic agent assignment
-   Override order status

### Zone Management

-   Create zones
-   View zones
-   Add individual pincodes to zones
-   Bulk-add pincodes to zones

### Rate Card Management

-   Configure B2B rates
-   Configure B2C rates
-   Configure intra-zone rates
-   Configure inter-zone rates
-   Configure minimum charges

### COD Configuration

-   Configure flat COD fee
-   Configure COD percentage
-   Configure separate COD rules for B2B and B2C

### Agent Management

-   Create delivery agents
-   View agents
-   Update agent availability/profile information

### Customer Management

-   View registered customers

------------------------------------------------------------------------

# 🏗️ System Architecture

``` text
                         ┌──────────────────────┐
                         │       Customer       │
                         │      Web Browser     │
                         └──────────┬───────────┘
                                    │
                                    │ REST API
                                    ▼
┌──────────────────────────────────────────────────────────┐
│                    React Frontend                         │
│                                                          │
│  Customer UI │ Agent Dashboard │ Admin Dashboard         │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ HTTP / JSON
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Node.js + Express Backend                    │
│                                                          │
│  Authentication       Order Management                   │
│  Rate Engine          Agent Assignment                   │
│  Notifications        Role-Based Authorization            │
└───────────────┬──────────────────────┬───────────────────┘
                │                      │
                │ Prisma ORM           │ SMTP
                ▼                      ▼
      ┌──────────────────┐    ┌──────────────────┐
      │   PostgreSQL     │    │  Email Provider  │
      │     Database     │    │     (SMTP)       │
      └──────────────────┘    └──────────────────┘
```

------------------------------------------------------------------------

# 🧰 Technology Stack

## Frontend

-   React 18
-   TypeScript
-   React Router
-   Axios
-   Tailwind CSS
-   Vite

## Backend

-   Node.js
-   Express.js
-   TypeScript
-   JWT Authentication
-   bcrypt
-   Zod
-   Nodemailer

## Database

-   PostgreSQL
-   Prisma ORM

## Development Tools

-   VS Code
-   Git
-   GitHub
-   npm

------------------------------------------------------------------------

# 📁 Project Structure

``` text
lastmile-delivery-tracker/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── agent/
│   │   │   ├── auth/
│   │   │   └── customer/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docs/
│   └── system-design.md
│
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

# ⚙️ Prerequisites

Make sure the following are installed:

-   Node.js 18+
-   npm
-   Git
-   PostgreSQL / Neon PostgreSQL
-   GitHub account

Check Node.js:

``` bash
node --version
```

Check npm:

``` bash
npm --version
```

------------------------------------------------------------------------

# 🚀 Installation & Setup

## 1. Clone the repository

``` bash
git clone https://github.com/harshita-gits/LastMile-Delivery-Tracker.git
cd LastMile-Delivery-Tracker
```

------------------------------------------------------------------------

# 🗄️ Backend Setup

Move into the backend:

``` bash
cd backend
```

Install dependencies:

``` bash
npm install
```

------------------------------------------------------------------------

## 🔐 Backend Environment Variables

Create:

``` text
backend/.env
```

Use `.env.example` as the template.

``` env
DATABASE_URL="your-postgresql-connection-string"

JWT_SECRET="your-long-random-secret"
JWT_EXPIRES_IN="7d"

PORT=4000
CORS_ORIGIN="http://localhost:5173"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-google-app-password"
SMTP_FROM="Last-Mile Delivery <your-email@gmail.com>"

ADMIN_EMAIL="admin@lastmile.com"
ADMIN_PASSWORD="your-admin-password"
```

### ⚠️ Security

Never commit the real `.env` file.

Never expose:

-   PostgreSQL password
-   Neon connection string
-   Gmail App Password
-   JWT secret
-   Production credentials

------------------------------------------------------------------------

# 🔄 Database Setup

Generate Prisma Client:

``` bash
npm run prisma:generate
```

Run migrations:

``` bash
npm run prisma:migrate
```

Seed initial data:

``` bash
npm run seed
```

Initial seed data can include:

-   Admin account
-   Delivery agents
-   Delivery zones
-   Zone/pincode mappings
-   B2B rate cards
-   B2C rate cards
-   COD configurations

------------------------------------------------------------------------

# ▶️ Run Backend

Start the backend:

``` bash
npm run dev
```

Backend API:

``` text
http://localhost:4000
```

------------------------------------------------------------------------

# 🎨 Frontend Setup

Open another terminal.

``` bash
cd frontend
```

Install dependencies:

``` bash
npm install
```

Create:

``` text
frontend/.env
```

Add:

``` env
VITE_API_BASE_URL=http://localhost:4000/api
```

Start the frontend:

``` bash
npm run dev
```

The application will normally be available at:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

# 🔑 Authentication & Role-Based Access

The platform uses JWT-based authentication.

Supported roles:

``` text
CUSTOMER
AGENT
ADMIN
```

Role-based middleware restricts access to protected API routes.

### Customer

-   Create and manage orders
-   Track deliveries
-   View tracking history
-   Reschedule failed deliveries

### Delivery Agent

-   View assigned deliveries
-   Manage availability
-   Update delivery status

### Administrator

-   Manage orders
-   Manage zones
-   Manage rate cards
-   Manage COD configuration
-   Manage agents
-   Manage customers

------------------------------------------------------------------------

# 📡 API Documentation

Base URL:

``` text
/api
```

## Authentication APIs

### Register Customer

``` http
POST /api/auth/register
```

Registers a new customer account.

### Login

``` http
POST /api/auth/login
```

Authenticates a user and returns JWT authentication data.

### Current User

``` http
GET /api/auth/me
```

Returns the currently authenticated user.

------------------------------------------------------------------------

# 📦 Order APIs

### Preview Delivery Charge

``` http
POST /api/orders/preview
```

Calculates the estimated charge before order confirmation.

Inputs include:

-   Pickup pincode
-   Drop pincode
-   Package dimensions
-   Actual weight
-   Order type
-   Payment type

### Create Order

``` http
POST /api/orders
```

Creates a delivery order.

Allowed roles:

``` text
CUSTOMER
ADMIN
```

### List Orders

``` http
GET /api/orders
```

Returns orders according to the authenticated user's role.

### Get Order Details

``` http
GET /api/orders/:id
```

Returns complete order information including tracking history.

### Assign Agent

``` http
POST /api/orders/:id/assign
```

Allows an administrator to manually assign a delivery agent.

### Update Order Status

``` http
PATCH /api/orders/:id/status
```

Allows a delivery agent to update the delivery status.

### Override Order Status

``` http
PATCH /api/orders/:id/override
```

Allows an administrator to override the current order status.

### Reschedule Failed Delivery

``` http
POST /api/orders/:id/reschedule
```

Allows a customer to reschedule a failed delivery.

------------------------------------------------------------------------

# 🛡️ Admin APIs

All admin routes require administrator authentication.

### Zones

``` http
POST /api/admin/zones
GET  /api/admin/zones
```

### Zone Areas / Pincodes

``` http
POST /api/admin/zone-areas
POST /api/admin/zone-areas/bulk
```

### Rate Cards

``` http
POST /api/admin/rate-cards
GET  /api/admin/rate-cards
```

### COD Configuration

``` http
POST /api/admin/cod-config
GET  /api/admin/cod-config
```

### Agents

``` http
POST  /api/admin/agents
GET   /api/admin/agents
PATCH /api/admin/agents/:id
```

### Customers

``` http
GET /api/admin/customers
```

------------------------------------------------------------------------

# 🚚 Delivery Agent APIs

### Agent Profile

``` http
GET /api/agents/me
```

### Update Agent Availability/Profile

``` http
PATCH /api/agents/me
```

### Assigned Orders

``` http
GET /api/agents/my-orders
```

------------------------------------------------------------------------

# 💰 Rate Calculation Engine

The delivery charge is calculated through a centralized rate calculation
engine.

## Step 1 --- Zone Detection

The pickup and drop pincodes are mapped to zones through the `ZoneArea`
table.

``` text
Pickup Pincode
      ↓
ZoneArea
      ↓
Pickup Zone
```

and:

``` text
Drop Pincode
      ↓
ZoneArea
      ↓
Drop Zone
```

If a pincode is not mapped to a zone, the system returns an error
instead of silently assigning an incorrect zone.

------------------------------------------------------------------------

## Step 2 --- Volumetric Weight

``` text
Volumetric Weight =
(L × B × H) / 5000
```

where dimensions are measured in centimeters.

Example:

``` text
Length  = 50 cm
Breadth = 40 cm
Height  = 30 cm

Volumetric Weight
= (50 × 40 × 30) / 5000
= 12 kg
```

------------------------------------------------------------------------

## Step 3 --- Billable Weight

The system uses the higher of actual and volumetric weight.

``` text
Billable Weight =
MAX(Actual Weight, Volumetric Weight)
```

Example:

``` text
Actual Weight     = 8 kg
Volumetric Weight = 12 kg

Billable Weight   = 12 kg
```

------------------------------------------------------------------------

## Step 4 --- Rate Card Selection

The system selects the rate card using:

``` text
Pickup Zone
+
Drop Zone
+
Order Type
```

Order types:

``` text
B2B
B2C
```

------------------------------------------------------------------------

## Step 5 --- Base Charge

``` text
Calculated Charge =
Billable Weight × Base Rate Per Kg
```

Minimum charge is then applied:

``` text
Base Charge =
MAX(Calculated Charge, Minimum Charge)
```

------------------------------------------------------------------------

## Step 6 --- COD Surcharge

For Prepaid orders:

``` text
COD Surcharge = ₹0
```

For COD orders:

``` text
COD Surcharge =
Flat Fee + (Base Charge × COD Percentage / 100)
```

------------------------------------------------------------------------

## Step 7 --- Final Charge

``` text
Total Charge =
Base Charge + COD Surcharge
```

The calculated charge is displayed before order confirmation.

------------------------------------------------------------------------

# 🤖 Automatic Agent Assignment

The platform supports automatic agent assignment.

The general strategy is:

``` text
New Order
    ↓
Identify Pickup Zone
    ↓
Find AVAILABLE agents
    ↓
Prefer agents in the pickup zone
    ↓
Compare active-order load
    ↓
Select suitable agent
    ↓
Assign order
```

The assignment logic considers agent availability and location/zone
information.

Administrators can also manually assign an agent.

------------------------------------------------------------------------

# 📦 Order Status Lifecycle

Normal delivery lifecycle:

``` text
CREATED
   ↓
ASSIGNED
   ↓
PICKED_UP
   ↓
IN_TRANSIT
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED
```

Failed delivery:

``` text
OUT_FOR_DELIVERY
        ↓
      FAILED
        ↓
Customer Reschedules
        ↓
New Delivery Attempt
        ↓
Agent Reassigned
```

------------------------------------------------------------------------

# 🧾 Tracking History

Every order status change creates a tracking-history record containing
information such as:

``` text
Order ID
Status
Actor
Actor Role
Note
Timestamp
```

This provides a chronological audit trail of the delivery lifecycle.

------------------------------------------------------------------------

# 📧 Email Notifications

Email notifications are integrated using SMTP/Nodemailer.

Customers can receive notifications for status changes such as:

  Status             Notification
  ------------------ -------------------------
  CREATED            Order placed
  ASSIGNED           Agent assigned
  PICKED_UP          Package picked up
  IN_TRANSIT         Package in transit
  OUT_FOR_DELIVERY   Out for delivery
  DELIVERED          Package delivered
  FAILED             Delivery attempt failed
  RESCHEDULED        Delivery rescheduled

For Gmail SMTP, use a Google App Password instead of the normal Gmail
password.

------------------------------------------------------------------------

# 📊 Database Schema

The major database entities include:

``` text
User
 │
 ├── Customer
 ├── Delivery Agent
 └── Admin

Order
 │
 ├── Customer
 ├── Agent
 ├── Pickup Zone
 ├── Drop Zone
 └── Tracking History

Zone
 └── Zone Areas

ZoneArea
 └── Pincode → Zone

RateCard
 ├── From Zone
 ├── To Zone
 ├── Order Type
 ├── Base Rate / Kg
 └── Minimum Charge

CodSurchargeConfig
 ├── Order Type
 ├── Flat Fee
 └── Percentage

OrderStatusHistory
 ├── Status
 ├── Actor
 ├── Actor Role
 └── Timestamp
```

------------------------------------------------------------------------

# 🧪 Demo Accounts

> Replace these placeholders with the actual credentials you intend to
> provide to the evaluator.

### 👑 Admin

``` text
Email: admin@lastmile.com
Password: YOUR_ADMIN_PASSWORD
```

### 🚚 Delivery Agent

``` text
Email: agent1@lastmile.com
Password: YOUR_AGENT_PASSWORD
```

### 👤 Customer

Register a new customer account through:

``` text
http://localhost:5173/register
```

------------------------------------------------------------------------

# 🌐 Live Application

### Frontend

🔗 [Open Live Application](YOUR-FRONTEND-URL)

### Backend API

🔗 [Backend API](YOUR-BACKEND-URL)

### Health Check

``` text
YOUR-BACKEND-URL/api/health
```

> Replace the placeholder URLs after deployment.

------------------------------------------------------------------------

# 📱 Application Screens

## Customer

-   Login
-   Registration
-   New Order
-   Order List
-   Order Details
-   Tracking Timeline

## Delivery Agent

-   Agent Dashboard
-   Availability Management
-   Assigned Deliveries
-   Delivery Status Updates

## Administrator

-   Orders Dashboard
-   Zone Management
-   Rate Card Management
-   COD Configuration
-   Agent Management
-   Customer Management

------------------------------------------------------------------------

# 🔒 Security

The application implements:

-   JWT-based authentication
-   Password hashing using bcrypt
-   Role-based authorization
-   Protected API routes
-   Environment-based secrets
-   CORS configuration
-   Input validation
-   Database constraints
-   No production credentials in source control

------------------------------------------------------------------------

# 🧑‍💻 Development Commands

## Backend

Install:

``` bash
npm install
```

Generate Prisma Client:

``` bash
npm run prisma:generate
```

Create/apply migration:

``` bash
npm run prisma:migrate
```

Deploy migrations:

``` bash
npm run prisma:deploy
```

Seed database:

``` bash
npm run seed
```

Development:

``` bash
npm run dev
```

Production build:

``` bash
npm run build
```

Production start:

``` bash
npm start
```

------------------------------------------------------------------------

## Frontend

Install:

``` bash
npm install
```

Development:

``` bash
npm run dev
```

Production build:

``` bash
npm run build
```

Preview production build:

``` bash
npm run preview
```

------------------------------------------------------------------------

# 🐛 Troubleshooting

## Port 4000 already in use

If the backend shows:

``` text
EADDRINUSE: address already in use :::4000
```

check the process using port 4000:

``` powershell
netstat -ano | findstr :4000
```

Stop the existing Node.js process if necessary.

## Database connection error

Check the `DATABASE_URL` inside:

``` text
backend/.env
```

## Frontend cannot connect to backend

Check:

``` env
VITE_API_BASE_URL=http://localhost:4000/api
```

Then restart the frontend.

## Email notification failure

Check:

``` env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-google-app-password
SMTP_FROM=your-email@gmail.com
```

For Gmail, `SMTP_PASS` must be a Google App Password.

------------------------------------------------------------------------

# 📚 System Design

The complete system-design explanation covering:

-   Rate calculation engine
-   Zone detection
-   Automatic agent assignment
-   Failed delivery handling

is available in:

``` text
docs/system-design.md
```

------------------------------------------------------------------------

# 🎯 Evaluation Alignment

  Evaluation Area     Implementation
  ------------------- ---------------------------------------
  Rate calculation    Centralized rate engine
  Zone detection      Pincode → zone mapping
  Volumetric weight   L × B × H / 5000
  Billable weight     MAX(actual, volumetric)
  B2B/B2C pricing     Configurable rate cards
  COD                 Flat + percentage surcharge
  Agent assignment    Availability + zone/load logic
  Status lifecycle    Defined order status transitions
  Tracking history    Status history with actor/timestamp
  Database design     PostgreSQL + Prisma
  Authentication      JWT + bcrypt
  Authorization       Role-based middleware
  API design          RESTful Express routes
  Notifications       SMTP/Nodemailer
  Failed delivery     Failure + rescheduling + reassignment

------------------------------------------------------------------------

# 🚀 Future Improvements

Potential enhancements include:

-   🌍 Complete national pincode dataset
-   📍 GPS-based real-time agent tracking
-   🗺️ Interactive delivery maps
-   📱 SMS/WhatsApp notifications
-   📊 Advanced delivery analytics
-   🔔 Push notifications
-   🤖 ML-based delivery-time prediction
-   🚦 Traffic-aware route optimization
-   📦 Batch shipment management
-   ☁️ Scalable cloud deployment

------------------------------------------------------------------------

# 👩‍💻 Project

**Last-Mile Delivery Tracker**

A full-stack logistics management solution combining:

``` text
React
+
Node.js / Express
+
PostgreSQL
+
Prisma
+
JWT Authentication
+
Role-Based Access
+
Dynamic Pricing
+
Agent Assignment
+
Delivery Tracking
+
Email Notifications
```

------------------------------------------------------------------------

## 📄 License

This project was developed as an academic/technical project.

No open-source license is currently specified.
