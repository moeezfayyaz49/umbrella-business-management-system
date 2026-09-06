import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { Login } from '../pages/auth/Login';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Clients } from '../pages/clients/Clients';
import { ClientDetails } from '../pages/clients/ClientDetails';
import { Vendors } from '../pages/vendors/Vendors';
import { VendorDetails } from '../pages/vendors/VendorDetails';
import { Invoices } from '../pages/invoices/Invoices';
import { CreateInvoice } from '../pages/invoices/CreateInvoice';
import { EditInvoice } from '../pages/invoices/EditInvoice';
import { InvoiceDetails } from '../pages/invoices/InvoiceDetails';
import { Purchases } from '../pages/purchases/Purchases';
import { CreatePurchase } from '../pages/purchases/CreatePurchase';
import { EditPurchase } from '../pages/purchases/EditPurchase';
import { PurchaseDetails } from '../pages/purchases/PurchaseDetails';
import { Expenses } from '../pages/expenses/Expenses';
import { Cashbook } from '../pages/cashbook/Cashbook';
import { DailyRecords } from '../pages/daily-records/DailyRecords';
import { Reports } from '../pages/reports/Reports';
import { Settings } from '../pages/settings/Settings';
import { Stock } from '../pages/stock/Stock';
import { CreateVendorReturn } from '../pages/returns/CreateVendorReturn';
import { CreateClientReturn } from '../pages/returns/CreateClientReturn';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'clients',
            element: <Clients />,
          },
          {
            path: 'clients/:id',
            element: <ClientDetails />,
          },
          {
            path: 'vendors',
            element: <Vendors />,
          },
          {
            path: 'vendors/:id',
            element: <VendorDetails />,
          },
          {
            path: 'invoices',
            element: <Invoices />,
          },
          {
            path: 'invoices/new',
            element: <CreateInvoice />,
          },
          {
            path: 'invoices/:id/edit',
            element: <EditInvoice />,
          },
          {
            path: 'invoices/:id',
            element: <InvoiceDetails />,
          },
          {
            path: 'purchases',
            element: <Purchases />,
          },
          {
            path: 'purchases/new',
            element: <CreatePurchase />,
          },
          {
            path: 'purchases/:id/edit',
            element: <EditPurchase />,
          },
          {
            path: 'purchases/:id',
            element: <PurchaseDetails />,
          },
          {
            path: 'stock',
            element: <Stock />,
          },
          {
            path: 'returns/vendor/new',
            element: <CreateVendorReturn />,
          },
          {
            path: 'returns/client/new',
            element: <CreateClientReturn />,
          },
          {
            path: 'expenses',
            element: <Expenses />,
          },
          {
            path: 'cashbook',
            element: <Cashbook />,
          },
          {
            path: 'daily-records',
            element: <DailyRecords />,
          },
          {
            path: 'reports',
            element: <Reports />,
          },
          {
            path: 'settings',
            element: <Settings />,
          },
          // Future protected routes go here
        ],
      },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      // Future auth routes (e.g., forgot password) go here
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
