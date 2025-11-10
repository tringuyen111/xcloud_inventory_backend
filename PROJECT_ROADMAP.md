# WMS Project Roadmap

This document outlines the development plan and current status of the Warehouse Management System (WMS) project.

---

## Phase 1: Core Module Implementation

### 1.1. Foundational Setup
- [X] Project Initialization (React, TypeScript, Vite)
- [X] UI Framework Integration (Ant Design)
- [X] Database Setup (Supabase) & Schema Definition
- [X] Authentication Flow (Login, Logout, Session Management)
- [X] Main Application Layout (Sidebar, Topbar, Breadcrumbs)
- [X] Routing Configuration

### 1.2. Implement Master Data Screens (Layout A & C)
- **Master Data List Screens (Layout A):**
  - [X] Organizations
  - [X] Branches
  - [X] Warehouses
  - [X] Locations
  - [X] Partners (Suppliers, Customers)
  - [X] UoM Categories
  - [X] Units of Measure (UoMs)
  - [X] Goods Types
  - [X] Goods Models
- **Master Data Create/Edit Forms (Layout C):**
  - [X] Organizations Form
  - [X] Branches Form
  - [X] Warehouses Form
  - [X] Locations Form
  - [X] Partners Form
  - [X] UoM Categories Form
  - [X] UoMs Form
  - [X] Goods Types Form
  - [X] Goods Models Form

### 1.3. Implement Operations Screens
- **List Screens (Layout A):**
  - [X] Goods Receipt (GR) List
  - [X] Goods Issue (GI) List
  - [X] Goods Transfer (GT) List
  - [X] Inventory Count (IC) List
  - [X] Putaway (PA) List
  - [X] Onhand (Tồn kho) - **Redesigned as Summary Report**
- **Create/Edit Screens (Layout C):**
  - [X] Goods Receipt (GR) Create Form
  - [IN PROGRESS] Goods Issue (GI) Create/Edit Form
  - [IN PROGRESS] Goods Transfer (GT) Create/Edit Form
  - [IN PROGRESS] Inventory Count (IC) Create/Edit Form
  - [IN PROGRESS] Putaway Create/Execute Form
- **Detail/View Screens (Layout B):**
  - [ ] GR Detail & Execution Screen
  - [ ] GI Detail & Approval/Execution Screen
  - [ ] GT Detail & Receiving Screen
  - [ ] IC Detail & Counting/Adjustment Screen
  - [X] Onhand Detail Screen (Drill-down from Summary)

### 1.4. Settings Module
- [DONE] User Management Form

---

## Phase 2: Advanced Features & Refinements

- [ ] **Dashboard Enhancements:**
  - [ ] Add interactive charts (e.g., GR/GI trends, stock levels).
  - [ ] Implement real-time activity feed.
- [ ] **Reporting Module:**
  - [ ] Develop Inventory Movement Report (In-Out-Stock).
  - [ ] Develop Warehouse Performance Report.
  - [ ] Add data export functionality (Excel/CSV) to all reports and list pages.
- [X] **User Roles & Permissions (RBAC):**
  - [X] Define roles (Admin, Manager, Staff).
  - [X] Implement UI restrictions based on user role.
  - [ ] Enforce backend security with Row-Level Security (RLS) in Supabase.
- [ ] **Barcode/QR Code Integration:**
  - [ ] Generate barcodes for locations, goods, and documents.
  - [ ] (Future) Implement scanning functionality for PDA/mobile devices.
- [ ] **Notifications:**
  - [ ] In-app notifications for key events (e.g., GI approval required, low stock).
  - [ ] (Optional) Email notifications.

---

## Phase 3: Optimization & Deployment

- [ ] Performance Optimization (code splitting, memoization).
- [ ] Final UI/UX Polish.
- [ ] Comprehensive Testing (Unit, Integration, E2E).
- [ ] Documentation (User Guide, Developer Guide).
- [ ] Deployment to Production Environment.

---

*Status Legend:*
- `[ ]`: To Do
- `[IN PROGRESS]`: Currently being worked on
- `[DONE]` / `[X]`: Completed