# Multivendor Marketplace Implementation

## Overview
This document describes the comprehensive multivendor marketplace system that has been implemented, including financial reporting, sales analytics, and real-time features.

## Database Models

### New Models Created

1. **vendors** - Vendor/Store information
   - Store details (name, slug, description, logo, banner)
   - Contact information
   - Commission rate configuration
   - Status and verification tracking
   - Financial statistics (total_sales, total_earnings, total_orders)
   - Rating and review count

2. **financial_transactions** - All financial transactions
   - Transaction types: sale, commission, payout, refund, adjustment, fee
   - Vendor and order associations
   - Amount, currency, status tracking
   - Reference numbers for external systems

3. **vendor_payouts** - Vendor payout requests and processing
   - Payout amount and method
   - Bank account information
   - Status tracking (pending, processing, completed, failed)
   - Period tracking for payout periods

4. **order_vendors** - Vendor-specific order tracking
   - Links orders to vendors
   - Calculates vendor-specific totals (subtotal, shipping, tax)
   - Commission calculation and vendor earnings
   - Fulfillment status per vendor
   - Tracking numbers

### Updated Models

1. **products** - Added `vendor_id` field
   - Products can now belong to vendors
   - NULL vendor_id indicates platform-owned products

2. **orders** - Enhanced for multivendor support
   - Orders can contain items from multiple vendors
   - Each vendor's portion is tracked separately

## Backend Controllers

### 1. Vendor Controller (`vendor.controller.js`)
- `create` - Create new vendor account
- `findAll` - List all vendors with filters and pagination
- `findOne` - Get vendor details
- `findByUserId` - Get vendor by user ID
- `update` - Update vendor information
- `delete` - Delete vendor (with safety checks)
- `getStats` - Get vendor statistics

### 2. Financial Controller (`financial.controller.js`)
- `getReports` - Comprehensive financial reports
  - Transaction summaries by type
  - Time series data (daily/weekly/monthly)
  - Top vendors by sales
  - Total calculations
- `getVendorDashboard` - Vendor-specific financial dashboard
  - Today, week, month, year statistics
  - Recent transactions
  - Pending payout amount
  - Monthly sales chart data
- `createPayout` - Create payout request
- `processPayout` - Process payout (admin only)
- `getPayouts` - List all payouts with filters

### 3. Analytics Controller (`analytics.controller.js`)
- `getSalesAnalytics` - Comprehensive sales analytics
  - Sales over time
  - Top selling products
  - Sales by category
  - Sales by vendor
  - Order status breakdown
  - Payment method breakdown
  - Summary statistics
- `getRealtimeSales` - Real-time sales data
  - Last 24 hours of orders
  - Hourly breakdown
  - Today's summary

### 4. Updated Order Controller
- Enhanced `create` function to:
  - Group order items by vendor
  - Create OrderVendor records for each vendor
  - Calculate commissions automatically
  - Create financial transactions
  - Update vendor statistics
  - Emit real-time notifications

## Real-Time Features (WebSocket)

### Socket Server (`socket/socketServer.js`)
- **Connection Management**
  - Vendor rooms (`vendor-{vendorId}`)
  - Admin room (`admin`)
  - User rooms (`user-{userId}`)
  - Sales subscription rooms
  - Financial subscription rooms

- **Event Emissions**
  - `new-order` - When new order is created
  - `order-update` - When order status changes
  - `payment-update` - When payment status changes
  - `financial-update` - When financial transaction occurs
  - `sales-update` - When sales data changes
  - `payout-update` - When payout status changes
  - `realtime-sales` - Periodic sales updates (every 30 seconds)

### Integration
- Integrated with order controller to emit events on:
  - Order creation
  - Order status updates
  - Payment status updates
  - Financial transaction creation

## Backoffice Dashboard Pages

### 1. Vendors Page (`/admin/vendors`)
- Vendor listing with search and filters
- Status and verification badges
- Statistics cards (total vendors, sales, orders, commission)
- Vendor details table
- Actions (view, edit)

### 2. Financial Reports Page (`/admin/financial`)
- Summary cards (total sales, commission, payouts, net revenue)
- Top vendors by sales
- Transaction type breakdown
- Time series chart
- Date range filters (week, month, year)

### 3. Analytics Page (`/admin/analytics`)
- Summary statistics (orders, sales, earnings, commission, average order value)
- Top products list
- Sales by category
- Sales over time chart
- Date range filters

## API Routes

### Vendor Routes (`/api/vendors`)
- `POST /api/vendors` - Create vendor
- `GET /api/vendors` - List vendors
- `GET /api/vendors/:id` - Get vendor
- `GET /api/vendors/user/:userId` - Get vendor by user
- `GET /api/vendors/:id/stats` - Get vendor stats
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Financial Routes (`/api/financial`)
- `GET /api/financial/reports` - Get financial reports
- `GET /api/financial/vendor/:vendorId/dashboard` - Vendor dashboard
- `POST /api/financial/payouts` - Create payout
- `GET /api/financial/payouts` - List payouts
- `PUT /api/financial/payouts/:payoutId/process` - Process payout

### Analytics Routes (`/api/analytics`)
- `GET /api/analytics/sales` - Get sales analytics
- `GET /api/analytics/realtime` - Get real-time sales

## Key Features

### 1. Automatic Commission Calculation
- When an order is created, the system:
  - Groups items by vendor
  - Calculates vendor-specific totals
  - Applies vendor's commission rate
  - Creates financial transactions
  - Updates vendor statistics

### 2. Financial Tracking
- All financial activities are tracked:
  - Sales transactions
  - Commission deductions
  - Payouts
  - Refunds
  - Adjustments

### 3. Real-Time Updates
- WebSocket integration for:
  - Live order notifications
  - Real-time sales updates
  - Financial transaction alerts
  - Payout status updates

### 4. Comprehensive Reporting
- Financial reports with multiple views
- Sales analytics with breakdowns
- Vendor performance tracking
- Time series analysis

## Installation & Setup

### Backend Dependencies
```bash
cd task
npm install socket.io
```

### Database Migration
The new models will be automatically created when the server starts (using Sequelize sync).

### Environment Variables
Ensure your `.env` file has:
- Database connection details
- API URL for frontend

### Frontend Configuration
Update `NEXT_PUBLIC_API_URL` in backoffice `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Usage

### Creating a Vendor
1. User must exist first
2. Create vendor via API: `POST /api/vendors`
3. Vendor status starts as 'pending'
4. Admin can approve by updating status to 'active'

### Processing Orders
- Orders automatically create OrderVendor records
- Commissions are calculated automatically
- Financial transactions are created
- Real-time notifications are sent

### Financial Reports
- Access via `/admin/financial`
- Filter by date range
- View top vendors
- Analyze transaction types

### Sales Analytics
- Access via `/admin/analytics`
- View top products
- Analyze by category
- Track sales over time

## Next Steps

1. **Vendor Dashboard** - Create vendor-facing dashboard
2. **Product Management** - Vendor product management interface
3. **Order Fulfillment** - Vendor order fulfillment interface
4. **Payout Management** - Enhanced payout processing
5. **Notifications** - Email/SMS notifications for vendors
6. **Advanced Analytics** - More detailed analytics and charts
7. **Multi-currency** - Support for multiple currencies
8. **Tax Management** - Advanced tax calculation

## Notes

- All financial calculations use MNT (Mongolian Tugrik) as default currency
- Commission rates are stored as percentages (e.g., 10.00 = 10%)
- Order vendor records are created even for platform-owned products (vendor_id = NULL)
- Real-time polling runs every 30 seconds by default
- Socket.IO CORS is configured for development and production domains

