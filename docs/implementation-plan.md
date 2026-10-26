# Project 1: B2B Order Management Platform - Implementation Plan & Checklist

## Milestone Roadmap

### Phase 1: Environment & Project Structure Setup
- [x] Create project documentation (`requirements.md`, `acceptance-criteria.md`, `architecture.md`, `database-schema.md`, `api-documentation.md`, `implementation-plan.md`).
- [ ] Initialize `backend/` directory with `package.json` and install dependencies (`express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `morgan`, `zod`).
- [ ] Initialize `frontend/` directory with Vite, React, TypeScript, and Tailwind CSS.
- [ ] Configure environment variables (`.env.example` and local `.env`).

### Phase 2: Database Layer & Versioned Migrations
- [ ] Create PostgreSQL connection pool manager in `backend/src/config/db.js`.
- [ ] Write migration `001_initial_schema.sql` (users, products, orders, order_items, invoices, audit_logs).
- [ ] Write migration runner script `backend/src/db/migrate.js`.
- [ ] Write seed script `backend/src/db/seed.js` with realistic wholesale products, admin account, and customer account.
- [ ] Verify migrations run idempotently and seeds execute cleanly.

### Phase 3: Backend Core & Security Services
- [ ] Implement JWT token generation and bcrypt password hashing utilities (`src/utils/`).
- [ ] Implement authentication & RBAC middleware (`authMiddleware`, `requireRole`).
- [ ] Implement audit logger helper (`src/services/auditService.js`).
- [ ] Build Authentication module:
  - Controller & Service (`register`, `login`, `getProfile`).
  - Input validation using Zod.
- [ ] Build Product Catalog module:
  - Public catalog browsing with search, category filtering, stock status calculation.
  - Admin product creation, updates, and active toggling.
  - Admin stock adjustment with audit logging.
- [ ] Build Order & Invoicing module:
  - Concurrency-safe checkout with `BEGIN`, `FOR UPDATE` lock, stock verification, deduction, price snapshotting, order record, invoice record, and audit log.
  - Order listing (filtered by role: customers see only own, admins see all).
  - Order details lookup with customer authorization check.
  - Order status advancement & cancellation with automatic stock replenishment.
  - Invoice retrieval for customer/admin.
- [ ] Build Admin Metrics module:
  - KPI calculation (total revenue from live orders, pending count, low-stock count, customer count).
  - Audit trail viewer.

### Phase 4: Frontend Development (React + Vite + TypeScript)
- [ ] Configure Tailwind CSS, Lucide icons, and Axios API client.
- [ ] Implement global state management:
  - `AuthContext`: login, logout, user session persistence in localStorage, role checks.
  - `CartContext`: add to cart, quantity change, removal, backend stock boundary check, subtotal/tax estimation.
- [ ] Build shared UI components:
  - Responsive Navbar with role-specific navigation, cart badge, and user dropdown.
  - Status badges (`In Stock`, `Low Stock`, `Out of Stock`, order status colors).
  - Loading spinners, empty state illustrations, error alerts, and confirmation modals.
- [ ] Build customer pages:
  - `CatalogPage`: Search bar, category pill filters, stock status filter, grid cards with real-time stock indicator.
  - `ProductDetailPage`: Comprehensive specifications, stock status, bulk quantity input, Add to Cart.
  - `CartPage`: Item breakdown, quantity modifiers, order summary (subtotal, tax, estimated total), checkout form.
  - `CheckoutPage`: Shipping address, PO reference, order confirmation.
  - `OrderHistoryPage`: List of customer's orders with status pills, order numbers, dates, and action links.
  - `OrderDetailPage`: Detailed order view with tracking timeline, item breakdown, and direct invoice link.
  - `InvoiceViewPage`: Printable, clean commercial invoice view formatted for browser printing/PDF saving.
- [ ] Build administrator pages:
  - `AdminDashboardPage`: KPI cards, low stock alerts, quick links.
  - `AdminProductManagementPage`: Table with search, edit product modal, add new product modal, direct stock adjust modal.
  - `AdminOrderManagementPage`: Comprehensive order table, status transition dropdown with confirmation.
  - `AdminAuditLogsPage`: Historical audit trail table.

### Phase 5: Verification & Automated Integration Testing
- [ ] Write automated integration test suite (`tests/`):
  - Test registration and authentication.
  - Test role authorization (customer denied access to admin routes).
  - Test customer data isolation (customer cannot fetch another customer's order).
  - Test concurrent order checkout (preventing overselling).
  - Test order status transitions and stock restoration on cancellation.
- [ ] Execute automated tests and document pass/fail results.

### Phase 6: Project 1 Documentation & Handover
- [ ] Create detailed `README.md` with prerequisites, step-by-step setup, credentials, and architecture overview.
- [ ] Document verified test results, decision log, and demonstration script.
