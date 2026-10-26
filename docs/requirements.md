# Project 1: B2B Order Management Platform - Requirements Specification

## 1. Executive Summary
The **B2B Order Management Platform** is a web-based enterprise ordering system designed for wholesale distributors and business customers. The platform streamlines the complete wholesale lifecycle: browsing wholesale catalog pricing and live inventory, managing shopping carts, placing bulk purchase orders with strict concurrency guarantees, generating commercial tax invoices, and administering product catalogs and fulfillment workflows.

---

## 2. Stakeholders & User Roles

### 2.1 Customer / Distributor Representative (`customer`)
* **Profile**: Verified business buyer purchasing products in bulk.
* **Key Needs**:
  * Browse wholesale products with accurate stock availability and tier pricing.
  * Search and filter by category, SKU, name, and stock status.
  * Maintain a persistent shopping cart with live stock validation.
  * Submit bulk orders safely without risks of double-billing or overselling.
  * Track historical orders and status progression (Pending → Confirmed → Processing → Shipped → Delivered).
  * View and print commercial invoices for accounting records.
  * Strictly restricted from viewing other businesses' orders, carts, or invoices.

### 2.2 System Administrator (`admin`)
* **Profile**: Wholesale distributor operations manager and fulfillment staff.
* **Key Needs**:
  * Comprehensive dashboard showing revenue, order volume, low-stock warnings, and customer growth.
  * Full catalog management: Add, edit, archive products, and upload/manage product specifications.
  * Inventory adjustments: Update stock levels with mandatory audit notes to track shrinkage or replenishment.
  * Order fulfillment: Review customer orders, update delivery status, and handle order cancellations (with automatic stock replenishment).
  * System-wide audit logs: Full historical traceability of pricing changes, inventory adjustments, and status transitions.

---

## 3. Functional Requirements

### 3.1 Authentication & User Management
* **FR-AUTH-1**: User registration with business name, contact person, email, password, and phone number.
* **FR-AUTH-2**: Password hashing using `bcrypt` (minimum 10 salt rounds). No plaintext passwords stored.
* **FR-AUTH-3**: Secure session issuance using signed JSON Web Tokens (JWT) containing user ID, role, and email.
* **FR-AUTH-4**: Role-Based Access Control (RBAC) middleware verifying token authenticity and role permissions on every protected endpoint.
* **FR-AUTH-5**: Profile endpoint returning current authenticated user context and role.

### 3.2 Product Catalog & Inventory
* **FR-PROD-1**: Product catalog display with pagination, keyword search (title, SKU, description), category filtering, and sorting (price, name, stock).
* **FR-PROD-2**: Stock status indicators:
  * `In Stock` (Stock > 10)
  * `Low Stock` (0 < Stock <= 10)
  * `Out of Stock` (Stock == 0)
* **FR-PROD-3**: Product detail view displaying SKU, title, detailed description, category, unit wholesale price, available inventory, specifications, and timestamps.
* **FR-PROD-4**: Admin product management: Create new products, update pricing and details, and toggle product active/inactive status.
* **FR-PROD-5**: Admin inventory adjustment: Dedicated endpoint to update stock with audit reason logging (e.g., "Received shipment PO #441", "Damaged goods deduction").

### 3.3 Shopping Cart
* **FR-CART-1**: Add items to cart with specified quantities.
* **FR-CART-2**: Reject adding quantities exceeding available stock at time of addition.
* **FR-CART-3**: Update item quantities and remove items from cart.
* **FR-CART-4**: Cart summary calculation: Backend-enforced item subtotals, tax rate (e.g., 8%), and estimated grand total.

### 3.4 Order Placement & Concurrency Safety
* **FR-ORD-1**: Checkout process requiring shipping address, contact phone, and optional purchase order (PO) reference number.
* **FR-ORD-2**: **Atomic Transaction Isolation**:
  * Execute checkout within a database transaction (`BEGIN ... COMMIT`).
  * Acquire row-level locks on affected products (`FOR UPDATE`).
  * Verify that requested quantity <= current available stock.
  * Immediately deduct purchased quantity from product inventory.
  * Snapshot unit price at purchase time into `order_items` (ensuring subsequent catalog price changes never alter past order records).
  * Create order header and line items.
  * Clear customer's cart.
  * Write audit log entry.
* **FR-ORD-3**: If any item in the order has insufficient stock, the transaction immediately rolls back (`ROLLBACK`) and returns a clear, actionable error message (identifying which item is out of stock).

### 3.5 Order Management & Tracking
* **FR-ORD-4**: Supported order statuses:
  * `PENDING` (Order submitted, awaiting distributor review)
  * `CONFIRMED` (Reviewed and accepted by distributor)
  * `PROCESSING` (Packaged and prepared in warehouse)
  * `SHIPPED` (Dispatched with tracking information)
  * `DELIVERED` (Successfully received by customer)
  * `CANCELLED` (Cancelled by customer before processing, or cancelled by admin)
* **FR-ORD-5**: Validated status transitions:
  * `PENDING` → `CONFIRMED` or `CANCELLED`
  * `CONFIRMED` → `PROCESSING` or `CANCELLED`
  * `PROCESSING` → `SHIPPED`
  * `SHIPPED` → `DELIVERED`
* **FR-ORD-6**: **Stock Replenishment on Cancellation**: If an order is marked `CANCELLED`, the reserved stock is automatically returned to the product inventory inside an atomic transaction.

### 3.6 Invoicing
* **FR-INV-1**: Automatic generation of invoice record upon order placement with unique formatted sequence: `INV-YYYY-XXXXX`.
* **FR-INV-2**: Invoice records: Invoice number, issue date, due date, customer business name, shipping address, line items (quantity, unit price, line total), subtotal, tax amount, and total payable amount.
* **FR-INV-3**: Clean printable/PDF-ready web view for accounting and export.

### 3.7 Admin Dashboard & Analytics
* **FR-DASH-1**: Real-time KPI summary cards:
  * Total Revenue (calculated from non-cancelled orders)
  * Total Orders & Pending Orders Count
  * Total Products Cataloged
  * Low Stock / Out of Stock Alert Count
* **FR-DASH-2**: Recent orders feed with quick status update controls.
* **FR-DASH-3**: Low stock alerts table highlighting items requiring reorder.
* **FR-DASH-4**: Audit trail table displaying date, user, action, target entity, and change details.

---

## 4. Non-Functional Requirements

### 4.1 Security & Data Isolation
* **NFR-SEC-1**: Tenant isolation: All customer queries MUST filter by `customer_id = req.user.id`. Customers accessing another customer's order ID must receive `403 Forbidden` or `404 Not Found`.
* **NFR-SEC-2**: Administrative endpoints protected by `requireRole('admin')` middleware.
* **NFR-SEC-3**: Input sanitation and validation using schema validators (rejecting malformed payloads, negative numbers, SQL injections, and XSS).
* **NFR-SEC-4**: CORS configured to accept authorized origins only. Security headers enforced via `helmet`.

### 4.2 Performance & Reliability
* **NFR-PERF-1**: Database indexes on frequently filtered/joined columns: `orders(customer_id)`, `orders(status)`, `order_items(order_id)`, `products(category)`, `products(sku)`.
* **NFR-PERF-2**: Sub-200ms response time for catalog browsing and cart updates under normal local development loads.

### 4.3 Maintainability & Code Quality
* **NFR-CODE-1**: Clear layered architecture: Routes → Controllers → Services → Data Access / Database.
* **NFR-CODE-2**: Strict separation of frontend and backend applications.
* **NFR-CODE-3**: Complete environment variable configuration via `.env` files with `.env.example` templates.
