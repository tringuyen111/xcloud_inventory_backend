
# Project Roadmap: WMS Inventory XCloud

## Phase 1: Foundation & Setup (COMPLETED)

- [x] **Setup Project Structure:** Initialize React project with TypeScript, Vite, and necessary folders.
- [x] **Integrate UI Framework:** Setup Ant Design and Tailwind CSS.
- [x] **Implement Core Layout:** Build `AppLayout` with `Sidebar`, `Topbar`, and `Breadcrumb`.
- [x] **Setup Routing:** Configure `react-router-dom` with public/private routes.
- [x] **State Management:** Integrate Zustand for global state (`authStore`, `uiStore`).
- [x] **Supabase Integration:**
    - [x] Configure Supabase client (`lib/supabase.ts`).
    - [x] Implement authentication flow (`LoginPage`, `authStore`).
    - [x] Generate and integrate TypeScript types from DB schema (`types/supabase.ts`).

## Phase 2: Core Module Implementation (IN PROGRESS)

- [x] **Implement All List Screens (Layout A):**
    - [x] Master Data: Organizations
    - [x] Master Data: Branches
    - [x] Master Data: Warehouses
    - [x] Master Data: Locations
    - [x] Master Data: Partners (Suppliers/Customers)
    - [x] Master Data: UoM Categories
    - [x] Master Data: Units of Measure (UoMs)
    - [x] Master Data: Goods Types
    - [x] Master Data: Goods Models
    - [x] Operations: Goods Receipt (GR) List
    - [x] Operations: Goods Issue (GI) List
    - [x] Inventory: Onhand Stock List

- [ ] **Implement Detail/View Screens (Layout B):**
    - [ ] Goods Receipt (GR) View
    - [ ] Goods Issue (GI) View

- [ ] **Implement Create/Edit Screens (Layout C):**
    - [ ] Goods Receipt (GR) Create/Edit Form
    - [ ] Goods Issue (GI) Create/Edit Form
    - [ ] Master Data CRUD Forms (Organizations, Warehouses, etc.)

## Phase 3: Advanced Features & Refinement

- [ ] **Dashboard Implementation:** Build dynamic widgets and charts for the dashboard.
- [ ] **Business Logic Integration (RPC):**
    - [ ] Implement `gr_confirm`, `gr_receive_line` logic in GR process.
    - [ ] Implement `gi_approve`, `gi_issue_line` logic in GI process.
- [ ] **Reporting Module:** Develop key inventory and operational reports.
- [ ] **User Roles & Permissions:** Implement UI logic based on user roles from `users` table.
- [ ] **Testing & QA:**
    - [ ] Unit tests for critical components and functions.
    - [ ] End-to-end testing for core user flows (GR, GI).
- [ ] **Deployment:** Prepare for production deployment.
