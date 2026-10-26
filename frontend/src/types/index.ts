export interface User {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  role: 'admin' | 'customer';
  phone?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  unitPrice: number | string;
  stock: number;
  lowStockThreshold: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  imageUrl?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  sku: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  contactPhone: string;
  poReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  companyName?: string;
  customerFullName?: string;
  customerEmail?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceDueDate?: string;
  invoiceStatus?: string;
  itemCount?: number;
  items?: OrderItem[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber?: string;
  customerId: string;
  companyName?: string;
  customerFullName?: string;
  customerEmail?: string;
  customerPhone?: string;
  issueDate: string;
  dueDate: string;
  status: 'ISSUED' | 'PAID' | 'CANCELLED';
  subtotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  poReference?: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress?: string;
  createdAt: string;
  userEmail?: string;
  companyName?: string;
  userRole?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  orderStats: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  productStats: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  totalCustomers: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number | string;
    createdAt: string;
    companyName: string;
  }>;
  lowStockAlerts: Array<{
    id: string;
    sku: string;
    title: string;
    category: string;
    stock: number;
    lowStockThreshold: number;
  }>;
}
