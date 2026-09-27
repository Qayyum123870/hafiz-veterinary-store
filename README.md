# Hafiz Veterinary Pharmacy & Pet Store Management ERP

A production-ready, full-stack enterprise management system (POS + ERP) designed specifically for veterinary pharmacies, veterinary clinics, livestock medicine retailers, and pet supply stores.

---

## 🌟 Key Features

### 1. High-Speed Point of Sale (POS)
* **Keyboard Hotkeys**: `F2` for instant barcode/product search, `F4` for customer selection, `F8` for payment options, `F10` for sale finalization, `ESC` to close.
* **Automatic FEFO (First-Expiry, First-Out)**: Automatically draws inventory from the closest non-expired batches to prevent pharmaceutical obsolescence.
* **Split Payments**: Cash, Bank Transfer, JazzCash, Easypaisa, Credit, and Card payments.
* **Thermal & A4 Receipts**: One-click printing formatted for 80mm thermal printers and standard A4 invoices.
* **Customer Credit Limits**: Prevents issuing unpaid credit sales if a customer's balance exceeds their configured credit limit.

### 2. Comprehensive Medicine & Batch Management
* **Veterinary Formulations**: Track drug strength, dosage form (Tablet, Injection, Syrup, Powder, Vaccine, Spray), composition, and official Drug Registration Numbers.
* **Livestock Withdrawal Safety Periods**: Track mandatory withdrawal periods for meat and milk (critical for livestock safety and consumer protection).
* **Multi-Species Associations**: Associate medicines and vaccines with relevant animal types (Dog, Cat, Cow, Buffalo, Goat, Sheep, Horse, Poultry, Birds, Rabbits).
* **Expiry Management**: Real-time surveillance of expired drugs and medicines expiring within 30, 60, and 90 days. Dispensing expired batches is strictly prohibited.

### 3. Customer Accounts & Pet Patient Records
* **Pet Profiles**: Track pets with species, breed, gender, date of birth, weight, microchip number, vaccination history, and medical allergies.
* **Double-Entry Ledgers**: Real-time statements tracking sales debits, payment credits, and running balance.
* **Dues Intake**: Fast recording of customer balance payments with instant receipt generation.

### 4. Procurement & Supplier Accounts
* **Batch Ingestion**: Receive supplier delivery invoices with manufacturer batch numbers, expiry dates, purchase costs, and proposed retail prices.
* **Supplier Statements**: Track supplier payables, purchase bills, payment disbursements, and credit terms.

### 5. Financial Operations & Shift Reconciliation
* **Cash Register Drawer**: Open shifts with cash float, track real-time drawer transactions, and reconcile end-of-day physical cash counts with automated discrepancy calculations.
* **Operating Overheads**: Record shop expenses (rent, electricity, generator fuel for cold-chain vaccine refrigeration, salaries, delivery).
* **Real-time Profit & Loss (P&L)**: Gross Revenue, Customer Discounts, Cost of Goods Sold (computed from exact batches), Operating Expenses, and Net Margin %.

### 6. Security, RBAC & Immutable Audits
* **8 Role Profiles**: Super Admin, Owner, Manager, Pharmacist, Cashier, Inventory Manager, Accountant, Viewer.
* **Non-Erasable Audit Trail**: JSON state diffs recording old vs new values, user ID, IP address, and timestamp for all critical financial and stock actions.

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js v18+ (tested on Node v24)
* SQLite (pre-configured) or PostgreSQL / Supabase

### Installation & Database Setup
```bash
# 1. Install dependencies
npm install

# 2. Push database schema
npx prisma db push

# 3. Seed real-world veterinary medicines, batches, and users
npx tsx prisma/seed.ts

# 4. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Default Demo Credentials

| Role | Username | Password | Key Permissions |
| :--- | :--- | :--- | :--- |
| **Store Owner / Super Admin** | `admin` | `admin123` | Complete master access over all modules, ledgers, voids, and settings |
| **Lead Pharmacist** | `pharmacist` | `staff123` | Medicine catalog, batch adjustments, drug dispensing, expiry monitoring |
| **POS Cashier** | `cashier` | `staff123` | POS checkout, customer intake, cash drawer shift reconciliation |

*A 1-click role switcher is provided directly on the login screen for testing convenience.*

---

## 🧪 Acceptance Test Verification

Run the automated acceptance test verifying the end-to-end business lifecycle from Section #67 of the master specification:
```bash
npx tsx scripts/acceptance-test.ts
```
