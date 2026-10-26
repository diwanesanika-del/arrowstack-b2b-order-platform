# Project 1: B2B Order Management Platform - REST API Specification

## Base URL
`/api`

## Authentication Scheme
HTTP Header: `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new customer distributor account.
* **Access**: Public
* **Request Body**:
```json
{
  "email": "buyer@acmedistributors.com",
  "password": "SecurePassword123!",
  "fullName": "Sarah Jenkins",
  "companyName": "Acme Wholesale Corp",
  "phone": "+1-555-0199"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "c1f7a28e-...",
    "email": "buyer@acmedistributors.com",
    "fullName": "Sarah Jenkins",
    "companyName": "Acme Wholesale Corp",
    "role": "customer"
  }
}
```

### `POST /api/auth/login`
Authenticates a user and returns a JWT.
* **Access**: Public
* **Request Body**:
```json
{
  "email": "buyer@acmedistributors.com",
  "password": "SecurePassword123!"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "c1f7a28e-...",
    "email": "buyer@acmedistributors.com",
    "fullName": "Sarah Jenkins",
    "companyName": "Acme Wholesale Corp",
    "role": "customer"
  }
}
```

### `GET /api/auth/me`
Retrieves current authenticated session profile.
* **Access**: Authenticated (`customer` or `admin`)

---

## 2. Product Catalog Endpoints

### `GET /api/products`
Retrieves paginated products with filtering.
* **Access**: Public
* **Query Parameters**:
  * `search` (string)
  * `category` (string)
  * `stockStatus` (`all` | `in_stock` | `low_stock` | `out_of_stock`)
  * `page` (number, default: 1)
  * `limit` (number, default: 12)
  * `sort` (`name_asc` | `name_desc` | `price_asc` | `price_desc` | `stock_desc`)
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "3a70e88b-...",
      "sku": "IND-PWR-001",
      "title": "Industrial High-Torque Power Drill",
      "category": "Power Tools",
      "unitPrice": "249.99",
      "stock": 42,
      "lowStockThreshold": 10,
      "stockStatus": "in_stock",
      "imageUrl": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalItems": 48,
    "totalPages": 4
  }
}
```

### `GET /api/products/:id`
Retrieves detailed information for a single product.
* **Access**: Public

### `POST /api/products`
Creates a new product catalog entry.
* **Access**: Admin only (`requireRole('admin')`)
* **Request Body**:
```json
{
  "sku": "IND-WLD-102",
  "title": "ProArc Precision MIG Welder 250A",
  "description": "Commercial multi-process welder suitable for continuous duty.",
  "category": "Welding Equipment",
  "unitPrice": 899.50,
  "stock": 15,
  "lowStockThreshold": 5,
  "imageUrl": "https://..."
}
```

### `PUT /api/products/:id`
Updates existing product details.
* **Access**: Admin only

### `PATCH /api/products/:id/inventory`
Explicitly adjusts inventory with an audit log reason.
* **Access**: Admin only
* **Request Body**:
```json
{
  "stockAdjustment": 25,
  "reason": "Restocked from supplier container shipment #4092"
}
```

---

## 3. Order Management Endpoints

### `POST /api/orders`
Places a new order inside an atomic transaction.
* **Access**: Customer only (`requireRole('customer')`)
* **Request Body**:
```json
{
  "items": [
    { "productId": "3a70e88b-...", "quantity": 5 }
  ],
  "shipping": {
    "name": "Sarah Jenkins",
    "address": "742 Evergreen Industrial Parkway",
    "city": "Springfield",
    "postalCode": "97477",
    "country": "United States",
    "phone": "+1-555-0199"
  },
  "poReference": "PO-2026-0881",
  "notes": "Deliver to Dock 4, Monday morning."
}
```
* **Validation & Errors**:
  * If stock < quantity: Returns `400 Bad Request` with `{ "error": "Insufficient stock for product 'Industrial Power Drill'. Available: 2, Requested: 5" }`.
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Order placed successfully",
  "order": {
    "id": "e29c017d-...",
    "orderNumber": "ORD-2026-10023",
    "status": "PENDING",
    "subtotal": 1249.95,
    "taxRate": 0.08,
    "taxAmount": 100.00,
    "totalAmount": 1349.95,
    "invoice": {
      "id": "7f8b9e11-...",
      "invoiceNumber": "INV-2026-10023",
      "dueDate": "2026-11-25"
    }
  }
}
```

### `GET /api/orders`
List orders. If customer: returns only their orders. If admin: returns all orders with filtering.
* **Access**: Authenticated

### `GET /api/orders/:id`
Retrieves single order with item breakdown and invoice status.
* **Access**: Admin or owner of the order

### `PATCH /api/orders/:id/status`
Updates order status.
* **Access**: 
  * Admin: Can advance status (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  * Customer: Can only cancel if current status is `PENDING`.
* **Request Body**:
```json
{
  "status": "PROCESSING",
  "reason": "Order packed in facility bin A3"
}
```

---

## 4. Invoice Endpoints

### `GET /api/invoices/:id`
Retrieves printable invoice data.
* **Access**: Admin or owner of invoice

### `GET /api/invoices`
List invoices for current customer (or all for admin).
* **Access**: Authenticated

---

## 5. Admin Dashboard & Analytics Endpoints

### `GET /api/admin/metrics`
Retrieves dashboard summary statistics:
* Total revenue
* Total order count
* Pending orders count
* Out of stock & low stock counts
* Active customer count
* **Access**: Admin only

### `GET /api/admin/audit-logs`
Retrieves system-wide audit activity logs with pagination.
* **Access**: Admin only
