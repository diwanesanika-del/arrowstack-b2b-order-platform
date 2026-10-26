# Project 1: B2B Order Management Platform - Acceptance Criteria & Verification Plan

## 1. Overview
This document defines the strict criteria used to verify that the B2B Order Management Platform meets all technical, architectural, and business specifications. Every scenario must be verified with automated and manual test cases.

---

## 2. Role-Based Permissions Matrix

| Feature / Action | Anonymous / Guest | Customer | Admin |
| :--- | :---: | :---: | :---: |
| Browse public catalog & search products | ✅ Yes | ✅ Yes | ✅ Yes |
| View product details & stock level | ✅ Yes | ✅ Yes | ✅ Yes |
| User Registration & Login | ✅ Yes | ✅ Yes | ✅ Yes |
| Manage personal cart | ❌ No (Redirect to login) | ✅ Yes | ✅ Yes |
| Place Order / Checkout | ❌ No | ✅ Yes | ❌ No (Customer only) |
| View personal order history & details | ❌ No | ✅ Yes (Own orders only) | ✅ Yes (All orders) |
| View invoices | ❌ No | ✅ Yes (Own invoices only) | ✅ Yes (All invoices) |
| Cancel own pending order | ❌ No | ✅ Yes (PENDING only) | ✅ Yes (Any non-delivered) |
| Update order status (Confirm, Ship, Deliver) | ❌ No | ❌ No (403 Forbidden) | ✅ Yes |
| Create / Edit / Archive Products | ❌ No | ❌ No (403 Forbidden) | ✅ Yes |
| Manual Inventory Adjustment | ❌ No | ❌ No (403 Forbidden) | ✅ Yes |
| View System Audit Logs | ❌ No | ❌ No (403 Forbidden) | ✅ Yes |
| View Admin KPI Dashboard | ❌ No | ❌ No (403 Forbidden) | ✅ Yes |

---

## 3. Measurable Acceptance Criteria by Module

### AC-1: Authentication & Authorization
* [ ] **AC-1.1**: Registering with an existing email returns `409 Conflict` with clear message: `"An account with this email already exists"`.
* [ ] **AC-1.2**: Registering with invalid email or short password (< 6 characters) returns `400 Bad Request` with field-level validation errors.
* [ ] **AC-1.3**: Valid login returns a signed JWT token and user profile object without returning the password hash.
* [ ] **AC-1.4**: Requests to protected routes without a token return `401 Unauthorized`.
* [ ] **AC-1.5**: Requests by a customer to admin-only routes (e.g., `POST /api/products`, `PATCH /api/inventory/adjust`) return `403 Forbidden`.

### AC-2: Catalog & Inventory Display
* [ ] **AC-2.1**: Catalog API supports query parameters: `search`, `category`, `minPrice`, `maxPrice`, `stockStatus`, `page`, and `limit`.
* [ ] **AC-2.2**: Items with `stock = 0` display as `"Out of Stock"` with disablement of the "Add to Cart" button.
* [ ] **AC-2.3**: Items with `stock <= 10` and `stock > 0` display a `"Low Stock: X units remaining"` badge.
* [ ] **AC-2.4**: Admin catalog view allows adding a new product with title, SKU, description, category, unit price, stock, and image URL.

### AC-3: Shopping Cart Logic
* [ ] **AC-3.1**: Adding quantity greater than available stock returns `400 Bad Request` with message: `"Requested quantity exceeds available stock (Available: X)"`.
* [ ] **AC-3.2**: Updating cart quantity to a valid number updates total pricing in real time on the server.
* [ ] **AC-3.3**: Setting quantity to 0 removes the item from the cart.

### AC-4: Concurrency-Safe Order Placement (Core Business Rules)
* [ ] **AC-4.1**: Backend recalculates line totals, subtotal, 8% tax, and grand total. Client-submitted prices are ignored.
* [ ] **AC-4.2**: Order checkout runs inside a database transaction with `FOR UPDATE` locking.
* [ ] **AC-4.3**: Stock is decremented immediately upon successful order creation.
* [ ] **AC-4.4**: If two concurrent orders compete for the last item in stock, exactly ONE order succeeds, and the other is safely rejected with insufficient stock error. No overselling or negative inventory is possible.
* [ ] **AC-4.5**: Order line items store the snapshot price (`unit_price`) at the moment of order placement.

### AC-5: Multi-Tenant Data Isolation
* [ ] **AC-5.1**: Customer A attempting to retrieve Customer B's order (`GET /api/orders/:id`) receives `404 Not Found` or `403 Forbidden`.
* [ ] **AC-5.2**: Customer A attempting to view Customer B's invoice receives `404 Not Found` or `403 Forbidden`.
* [ ] **AC-5.3**: Admin user can retrieve any customer's order and invoice.

### AC-6: Order Status Progression & Stock Replenishment
* [ ] **AC-6.1**: Status transitions follow valid state machine paths. Invalid transitions (e.g., `DELIVERED` → `PENDING`) return `400 Bad Request`.
* [ ] **AC-6.2**: When an order is cancelled (by customer or admin), stock is atomically restored for each item in the order, and an audit log entry is recorded.

### AC-7: Invoicing & Printing
* [ ] **AC-7.1**: Each order automatically generates an invoice with a sequential number `INV-YYYY-XXXXX`.
* [ ] **AC-7.2**: Invoices display business billing details, order date, due date, itemized rows, tax breakdown, and total.
* [ ] **AC-7.3**: Printable HTML/CSS stylesheet formats cleanly for printing / PDF export.

### AC-8: Audit Trail
* [ ] **AC-8.1**: Inventory adjustments, product price changes, and order status transitions create records in `audit_logs`.
* [ ] **AC-8.2**: Audit entries include `user_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, and timestamp.
