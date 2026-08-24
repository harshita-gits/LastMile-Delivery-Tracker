# 🚚 Last-Mile Delivery Tracker --- System Design

> A full-stack delivery management platform for customers,
> administrators, and delivery agents, with synchronized order
> processing, delivery tracking, notifications, and persistent
> PostgreSQL storage.

## 1. System Architecture

``` mermaid
flowchart TB
    C[👤 Customer] --> FE[🌐 React + Vite Frontend]
    A[🛡️ Admin] --> FE
    D[🚚 Delivery Agent] --> FE

    FE --> AUTH[🔐 Authentication]
    FE --> ORD[📦 Order Management]
    FE --> ADM[🛡️ Admin Management]
    FE --> AGT[🚚 Agent Management]
    FE --> TRK[📍 Tracking & Status]
    FE --> NOT[🔔 Notifications]

    AUTH --> API[⚙️ Node.js + Express REST API]
    ORD --> API
    ADM --> API
    AGT --> API
    TRK --> API
    NOT --> API

    API --> MW[🔒 JWT • CORS • Error Middleware]
    MW --> RT[🎛️ Routes & Controllers]
    RT --> PR[🔗 Prisma ORM]
    PR --> DB[(🐘 Neon PostgreSQL)]
    RT --> SMTP[📧 Nodemailer / SMTP]
    SMTP --> EM[📨 Email Service]
```

## 2. Frontend Modules

### 👤 Customer Module

Customers can register, sign in, create delivery orders, view order
details, and monitor delivery progress. The React frontend communicates
with the backend through REST API requests.

### 🛡️ Admin Module

Administrators manage the delivery workflow and view operational order
information. Admin actions use the same backend and database as the
other roles, keeping the system synchronized.

### 🚚 Delivery Agent Module

Agents view assigned deliveries, manage availability, inspect
active/completed shipments, and update delivery progress. Their changes
are persisted through the backend.

### 🧭 Shared UI Module

Reusable React components provide navigation, status badges, order
tables, forms, cards, and consistent page layouts across customer,
admin, and agent screens.

## 3. Backend Modules

``` mermaid
flowchart LR
    REQ[HTTP Request] --> CORS[CORS]
    CORS --> JSON[JSON Parser]
    JSON --> JWT[JWT/Auth]
    JWT --> ROUTE[Express Routes]
    ROUTE --> CTRL[Controllers]
    CTRL --> LOGIC[Business Logic]
    LOGIC --> ORM[Prisma ORM]
    ORM --> DB[(Neon PostgreSQL)]
    CTRL --> SMTP[Nodemailer]
    SMTP --> EMAIL[Email Provider]
    CTRL --> RES[HTTP Response]
```

### 🔐 Authentication & Authorization

Registration and login are handled by the backend. JWT authentication
protects authenticated operations, while user roles separate customer,
admin, and delivery-agent access.

### 📦 Order Management

Handles order creation, retrieval, assignment, status changes,
addresses, and order-related information. It is the central workflow
connecting all three roles.

### 💰 Pricing Module

Applies the project's delivery-pricing logic to determine the cost
associated with an order.

### 🚚 Agent Assignment & Availability

Maintains delivery-agent information and availability. Administrators
can work with agents, while agents can update availability and view
assigned shipments.

### 📍 Tracking & Status

Represents the delivery lifecycle through order-status changes.
Customers can monitor progress while authorized staff update operational
states.

### 📧 Notification Module

Uses SMTP/Nodemailer to send application emails when configured. Gmail
SMTP with an App Password can be used for authenticated email delivery.

## 4. Database Layer

``` mermaid
flowchart TB
    ORM[Prisma ORM] --> USERS[Users]
    ORM --> ORDERS[Orders]
    ORM --> AGENTS[Agent Data]
    ORM --> STATUS[Order Status Data]
    USERS --> DB[(Neon PostgreSQL)]
    ORDERS --> DB
    AGENTS --> DB
    STATUS --> DB
```

Neon PostgreSQL provides persistent cloud storage. Prisma provides typed
database access and migration support between the Node.js backend and
PostgreSQL.

## 5. Deployment Architecture

``` mermaid
flowchart LR
    GH[GitHub Repository] --> V[Vercel]
    GH --> R[Render]
    V[React Frontend] -->|HTTPS REST API| R[Express Backend]
    R --> N[(Neon PostgreSQL)]
    R --> G[📧 Gmail SMTP]
```

-   **GitHub:** Source control and project repository.
-   **Vercel:** Production React/Vite frontend.
-   **Render:** Node.js/Express backend.
-   **Neon:** Cloud PostgreSQL database.
-   **Gmail SMTP:** Email delivery when configured.

## 6. End-to-End Workflow

**Customer → Frontend → API → Authentication → Controller → Prisma →
Neon → Response → Frontend**

For an order:

**Customer creates order → Backend validates it → Pricing/order logic
executes → Order is stored → Admin can manage it → Agent receives
assignment → Agent updates status → Customer sees progress → Configured
notifications are sent.**

The shared API and database keep customer, admin, and delivery-agent
workflows synchronized throughout the delivery lifecycle.
