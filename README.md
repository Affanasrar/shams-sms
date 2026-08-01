# 🎓 Shams SMS — Full-Stack Enterprise School Management System

A production-grade, full-stack enterprise School Management & Billing System built with **Next.js 15 App Router**, **Prisma ORM**, **PostgreSQL**, **Clerk Authentication**, **Tailwind CSS v4**, and multi-channel messaging capabilities (**WhatsApp API & SMS**).

---

## 🌟 Architecture & Full-Stack Overview

Shams SMS is architected as an end-to-end full-stack web application with strict server-side integrity, atomic financial transactions, automated cron jobs, and interactive management dashboards.

```mermaid
graph TD
    Client[Next.js Client Components / UI] -->|Server Actions / REST| API[Next.js App Router API & Actions]
    API -->|Auth & Session| Auth[Clerk Authentication]
    API -->|ORM Transactions| DB[(PostgreSQL Database via Prisma)]
    API -->|Multi-Channel Messaging| Messaging[TextBee SMS & Evolution WhatsApp API]
    API -->|Background Tasks & Cron| Cron[Vercel / Next.js Cron Jobs]
    API -->|PDF Generation| PDF[React-PDF Engine]
```

---

## 🛠️ Full-Stack Technology Stack

### **Frontend & UI Layer**
- **Framework**: Next.js 15 (App Router, Server Components & Server Actions)
- **UI & Styling**: React 19, Tailwind CSS v4, OKLCH Color Palette, Dark & Light Mode Theme Support
- **Components**: Lucide React Icons, Sonner Toast Notifications, Recharts Data Visualization
- **Client Features**: Dynamic Bento Dashboards, Interactive Attendance Grid, PDF Voucher Previews, Global Command Palette (`Ctrl+K`)

### **Backend & API Layer**
- **Server Framework**: Node.js via Next.js Server Actions & API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma ORM with connection pooling & strict model constraints
- **Authentication & Security**: Clerk Auth with RBAC (Admin, Teacher, Receptionist roles)
- **Document Engine**: `@react-pdf/renderer` for dynamic PDF fee vouchers & student welcome packets

### **Integrations & Messaging Subsystems**
- **WhatsApp Integration**: Evolution API for instant WhatsApp payment receipts, automated reminders, and pdf vouchers
- **SMS Gateway**: TextBee API for outbound SMS notifications & delivery status tracking
- **Cron Engine**: Next.js Cron routes for daily fee generation, course completion checks, and overdue fee reminders
- **Audit Logging Engine**: Custom fire-and-forget `AuditLog` subsystem for full operations traceability

---

## 🚀 Key Modules & System Capabilities

### 1. 🎓 Student Admissions & Profile Management (360° View)
- Complete student lifecycle tracking: Enrolled, Active, Dropped, Completed, and Pending Completion.
- Tabbed student profile featuring General Info, Attendance Ledger, and Financial History.
- Automated generation & WhatsApp/SMS dispatch of Admission Packets and PDF Fee Vouchers upon registration.

### 2. 💳 Smart Fee & Financial Ledger System
- **Atomic Payment Collection**: Race-condition safe fee collections inside Prisma database transactions.
- **Historical Fee Locking**: `CourseFeeHistory` tracks base fee updates, ensuring existing students retain their original locked rate.
- **Automated Monthly Billing**: Background cron checks and creates cycle fees on schedule.
- **Dynamic Extensions**: Extending course durations automatically generates monthly fee entries for the extension period at the student's locked rate.

### 3. 📅 Interactive Scheduling & Room Capacity Guards
- Room capacity limits enforced with hard transaction guards (prevents overbooking).
- Schedule view with slot assignment updates, teacher assignments, and classroom transfers.

### 4. 📝 Daily Attendance Tracking
- Real-time attendance marking per course slot.
- Visual summary indicators for marked vs. unmarked slots.

### 5. 🔍 Audit Trails & System Logs
- Full event logging for all key mutations (`ENROLLMENT_CREATED`, `ENROLLMENT_DROPPED`, `FEE_COLLECTED`, `ENROLLMENT_EXTENDED`, `EXPENSE_CREATED`, etc.).
- Paginated, searchable activity timeline for system administrators.

---

## 🗄️ Database Schema Highlights

Defined in `prisma/schema.prisma`:

- **`User`**: Admin, Teacher, and Receptionist accounts linked to Clerk IDs.
- **`Student`**: Comprehensive profile details, parent contact numbers, emergency contacts, and SMS preference toggles.
- **`Course` & `CourseFeeHistory`**: Course definitions with audit logs for rate updates.
- **`Room`, `Slot`, & `CourseOnSlot`**: Physical rooms, time blocks, and teacher assignments with capacity tracking.
- **`Enrollment`**: Student course registrations with `joiningDate`, `endDate`, `extendedDays`, and `status`.
- **`Fee` & `Transaction`**: Monthly cycle billing, partial/full payment records, and payment logs.
- **`AuditLog`**: System audit log entries recording action, entity, user ID, and JSON details.

---

## 💻 Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/shams_sms?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# TextBee SMS API
TEXTBEE_API_KEY="your-textbee-api-key"
TEXTBEE_DEVICE_ID="your-textbee-device-id"

# Evolution WhatsApp API
EVOLUTION_API_URL="https://your-evolution-api-domain.com"
EVOLUTION_API_KEY="your-evolution-api-key"
EVOLUTION_INSTANCE_NAME="shams-instance"

# Cron Security
CRON_SECRET="your-cron-secret-key"
```

---

## 🛠️ Local Development & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Affanasrar/shams-sms.git
   cd shams-sms
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Migration & Prisma Setup**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run Type Checks**:
   ```bash
   npx tsc --noEmit
   ```

---

## 📜 Build & Production Deployment

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 📄 License & Attribution

Developed for **Shams Commercial Institute**. All rights reserved.
