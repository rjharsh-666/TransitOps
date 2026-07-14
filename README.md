# TransitOps ⚡

TransitOps is a next-generation, premium **Fleet & Transport Operations Management Platform** built with **Next.js 16 (App Router)**, **TailwindCSS 4**, and **Prisma ORM**. 

It provides transit operators, fleet managers, drivers, and financial analysts with a unified, real-time workflow for role-based dispatches, vehicle status tracking, driver licensing compliance, maintenance scheduling, and fuel/expense auditing.

---

## 🏗️ Database Architecture & Relational Schema

TransitOps runs on a robust relational database schema designed to enforce strict operational constraints (e.g., ensuring a vehicle's cargo doesn't exceed its load capacity or that a driver's license hasn't expired).

Below is the database relationship diagram mapping out all modules:

```mermaid
erDiagram
    USER ||--o| DRIVER : "binds to"
    USER ||--o| DRIVER_APPLICATION : "submits"
    USER ||--o| ROLE_REQUEST : "submits"
    USER ||--o{ TRIP : "creates"
    
    VEHICLE ||--o{ TRIP : "assigned to"
    VEHICLE ||--o{ MAINTENANCE_LOG : "undergoes"
    VEHICLE ||--o{ FUEL_LOG : "fills up"
    VEHICLE ||--o{ EXPENSE : "incurs"
    
    DRIVER ||--o{ TRIP : "drives"
    
    TRIP ||--o{ FUEL_LOG : "logs during"
    TRIP ||--o{ EXPENSE : "logs during"

    USER {
        string id PK "Clerk User ID"
        string email UNIQUE
        string name
        string role "Admin | FleetManager | Driver | SafetyOfficer | FinancialAnalyst | Pending"
        string signupType "Driver | OtherUser"
        ApprovalStatus signupStatus "Pending | Approved | Denied"
        string requestedRole
        dateTime createdAt
        dateTime updatedAt
    }

    DRIVER_APPLICATION {
        int id PK
        string userId FK "Cascade"
        boolean hasHeavyVehiclePermit
        int yearsExperience
        string licenseNumber
        string licenseCategory
        dateTime licenseExpiryDate
        string contactNumber
        ApprovalStatus status
        string reviewedById FK "SetNull"
        dateTime reviewedAt
        string reviewNotes
    }

    ROLE_REQUEST {
        int id PK
        string userId FK "Cascade"
        string requestedRole
        ApprovalStatus status
        string reviewedById FK "SetNull"
        dateTime reviewedAt
        string reviewNotes
        string approvedRole
    }

    VEHICLE {
        int id PK
        string registrationNumber UNIQUE
        string nameModel
        string type "Mini Truck | Pickup | Light Truck | Heavy Truck"
        decimal maxLoadCapacity "kg"
        decimal odometer "km"
        decimal acquisitionCost
        string region "North | South | East | West"
        VehicleStatus status "Available | OnTrip | InShop | Retired"
    }

    DRIVER {
        int id PK
        string userId FK "SetNull"
        string name
        string licenseNumber UNIQUE
        string licenseCategory "LMV | HMV"
        dateTime licenseExpiryDate
        string contactNumber
        boolean hasHeavyVehiclePermit
        int yearsExperience
        DriverStatus status "Available | OnTrip | Suspended | OffDuty"
    }

    TRIP {
        int id PK
        string source
        string destination
        int vehicleId FK "Restrict"
        int driverId FK "Restrict"
        decimal cargoWeight
        decimal plannedDistance
        decimal actualDistance
        decimal fuelConsumed
        decimal revenue
        TripStatus status "Draft | Dispatched | Completed | Cancelled"
        dateTime dispatchedAt
        dateTime completedAt
        dateTime cancelledAt
        string createdById FK "SetNull"
    }

    MAINTENANCE_LOG {
        int id PK
        int vehicleId FK "Restrict"
        string maintenanceType
        string description
        decimal cost
        MaintenanceStatus status "Open | Closed"
        dateTime startDate
        dateTime endDate
    }

    FUEL_LOG {
        int id PK
        int vehicleId FK "Restrict"
        int tripId FK "SetNull"
        decimal liters
        decimal cost
        dateTime logDate
        decimal odometerReading
    }

    EXPENSE {
        int id PK
        int vehicleId FK "Restrict"
        int tripId FK "SetNull"
        string expenseType "Toll | Maintenance | Fuel | Other"
        decimal amount
        dateTime expenseDate
        string description
    }
```

---

## 🔐 Role-Based Access Control (RBAC)

TransitOps employs a strict Role-Based Access Control policy to segment operations and secure corporate financials. The table below lists page-level access permissions:

| Route Path | Description | Allowed Roles |
| :--- | :--- | :--- |
| `/admin` | Manage user roles & approve pending applications | `Admin` |
| `/dashboard` | View core operational stats, active dispatches & utilization histograms | `Admin`, `FleetManager`, `SafetyOfficer`, `FinancialAnalyst` |
| `/vehicles` | Add/view/edit vehicles & monitor fleet statuses | `Admin`, `FleetManager` |
| `/drivers` | View driver details, licenses, and experience stats | `Admin`, `FleetManager`, `SafetyOfficer` |
| `/trips` | Dispatch/cancel/complete trips (Drivers only see assigned trips) | `Admin`, `FleetManager`, `Driver` |
| `/maintenance` | Create/close maintenance logs and track vehicle downtime | `Admin`, `FleetManager` |
| `/fuels` | Log fuel fill-ups and view fuel-efficiency metrics | `Admin`, `FleetManager`, `FinancialAnalyst` |
| `/expenses` | Track toll costs, incidental fees, and overall trip ledger | `Admin`, `FinancialAnalyst` |
| `/reports` | Export custom financial, utilization, and maintenance reports | `Admin`, `FinancialAnalyst` |

---

## 🔄 Core Operational Lifecycles

### 1. User Onboarding Flow
* **Drivers**: Sign up choosing **Driver Application**, specifying their contact number, license code, vehicle permit, and driving experience. The application goes into a queue until an `Admin` approves it, which automatically registers a corresponding `Driver` record linked to their Clerk authentication.
* **Other Users**: Register standard credentials and are routed to the **Role Request** page. They specify their requested business role (e.g., `FinancialAnalyst`, `FleetManager`, `SafetyOfficer`), which must be reviewed and approved by an `Admin` before page permissions are granted.

### 2. Trip Dispatch Flow
* **Draft**: A dispatcher initializes a trip with source/destination coordinates, specifying load weight and selecting an **Available** vehicle and driver.
  * *Constraint check*: The system validates that the cargo weight does not exceed the vehicle's `maxLoadCapacity`.
  * *Constraint check*: Driver status must be `Available` and their license must not be expired.
* **Dispatched**: Dispatched trips mark the associated vehicle and driver statuses as `OnTrip`.
* **Completed**: Once the destination is reached, the driver completes the trip, inputting:
  * Actual distance traveled (which increments the vehicle's odometer).
  * Total liters of fuel consumed.
  * Incidental trip toll costs and revenues.
  * Restores the vehicle and driver status back to `Available`.
* **Cancelled**: Trips can be aborted if needed, immediately resetting vehicle/driver status to `Available`.

---

## 💻 Tech Stack

* **Frontend Framework**: Next.js 16 (App Router)
* **Styling**: TailwindCSS 4 (Vibrant dark/light theme, premium glassmorphism gradients)
* **Animations**: Framer Motion & CSS Transition effects
* **State Management**: Zustand
* **Database & ORM**: PostgreSQL, Prisma ORM
* **Authentication**: Clerk Next.js SDK (with syncing hooks)
* **UI Components**: Radix UI + Shadcn

---

## 📂 Project Directory Structure

```text
TransitOps/
├── prisma/
│   ├── schema.prisma       # Database design containing schema models
│   └── seed.ts             # Seeding script containing Indian commercial routes data
├── src/
│   ├── app/
│   │   ├── (app)/          # Main dashboard, vehicle registry, dispatches & financial pages
│   │   ├── api/            # API endpoints mapping db models to HTTP interfaces
│   │   ├── sign-in/        # Clerk Authentication Sign-in catch-all page
│   │   └── sign-up/        # Clerk Onboarding forms with customizable roles metadata
│   ├── components/
│   │   ├── ui/             # Core Radix-based UI components (buttons, badges, inputs)
│   │   ├── form-dialog.tsx # Base form dialog wrapper
│   │   ├── kpi-card.tsx    # High-impact dashboard metrics cards
│   │   └── nav-sidebar.tsx # Sidebar navigation layout checking permissions
│   └── lib/
│       ├── rbac.ts         # Authentication helper verifying role allowances
│       ├── prisma.ts       # Centralized Prisma Client connection
│       └── api-helpers.ts  # Standard error handling and Clerk session helpers
└── README.md
```

---

## ⚡ Quickstart Setup

Follow these steps to spin up the TransitOps project locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory by duplicating `.env.example`:
```env
# Database Connections (PostgreSQL / Neon connection string)
DATABASE_URL="postgresql://user:password@hostname/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@hostname/dbname?sslmode=require"

# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# (Optional) Admin Bootstrap List (Comma separated emails automatically granted Admin status)
ADMIN_BOOTSTRAP_EMAILS="rajharsh437@gmail.com,admin@transitops.in"
```

### 3. Initialize Database Schemas & Run Migrations
Push the database schema to your PostgreSQL server:
```bash
npx prisma db push
```

### 4. Seed the Database
Populate the database with historical operational data, commercial vehicles, drivers, and pending applications:
```bash
npm run db:seed
```

### 5. Spin Up the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧑‍💻 Seed Credentials Reference

Below are the mock accounts seeded into the system for local testing and developer sandbox validation:

| Name | Role | Email | Clerk Mock ID |
| :--- | :--- | :--- | :--- |
| **Anil Mehta** | Fleet Manager | `anil@transitops.in` | `user_fleet_manager_ind` |
| **Sandeep Sharma** | Driver | `sandeep@transitops.in` | `user_driver_sandeep` |
| **Rajesh Kumar** | Driver | `rajesh@transitops.in` | `user_driver_rajesh` |
| **Pooja Sharma** | Financial Analyst | `pooja@transitops.in` | `user_fin_pooja` |
| **Vikram Singh** | Pending Driver | `vikram@transitops.in` | `user_driver_vikram` |
