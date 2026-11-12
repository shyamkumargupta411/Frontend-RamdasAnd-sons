import { createBrowserRouter, Navigate } from "react-router-dom";

import ManagerLayout from "../layouts/ManagerLayout";
import OwnerLayout from "../layouts/OwnerLayout";
import SellerLayout from "../layouts/SellerLayout";
import HealthCheckPage from "../pages/HealthCheckPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import ManagerCategoriesPage from "../pages/manager/CategoriesPage";
import ManagerDashboard from "../pages/manager/Dashboard";
import ManagerProductsPage from "../pages/manager/ProductsPage";
import ManagerStockInPage from "../pages/manager/StockInPage";
import ManagerTransfersPage from "../pages/manager/TransfersPage";
import OwnerCategoriesPage from "../pages/owner/CategoriesPage";
import OwnerDashboard from "../pages/owner/Dashboard";
import OwnerProductsPage from "../pages/owner/ProductsPage";
import OwnerShopsPage from "../pages/owner/ShopsPage";
import OwnerStockOverviewPage from "../pages/owner/StockOverviewPage";
import OwnerTransfersPage from "../pages/owner/TransfersPage";
import OwnerUsersPage from "../pages/owner/UsersPage";
import AdjustmentsPage from "../pages/AdjustmentsPage";
import AuditPage from "../pages/AuditPage";
import MaterialStockPage from "../pages/MaterialStockPage";
import ReturnsPage from "../pages/ReturnsPage";
import ReportsPage from "../pages/ReportsPage";
import SalesPage from "../pages/SalesPage";
import SellerDashboard from "../pages/seller/Dashboard";
import SellerIncomingTransfersPage from "../pages/seller/IncomingTransfersPage";
import SellerMySalesPage from "../pages/seller/MySalesPage";
import SellerMyShopStockPage from "../pages/seller/MyShopStockPage";
import SellerNewSalePage from "../pages/seller/NewSalePage";
import { RedirectIfAuthenticated, RequireAuth } from "./guards";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HealthCheckPage />,
  },
  {
    path: "/login",
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: "/owner",
    element: (
      <RequireAuth roles={["OWNER"]}>
        <OwnerLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OwnerDashboard /> },
      { path: "users", element: <OwnerUsersPage /> },
      { path: "shops", element: <OwnerShopsPage /> },
      { path: "products", element: <OwnerProductsPage /> },
      { path: "categories", element: <OwnerCategoriesPage /> },
      { path: "stock", element: <OwnerStockOverviewPage /> },
      { path: "transfers", element: <OwnerTransfersPage /> },
      { path: "sales", element: <SalesPage /> },
      { path: "returns", element: <ReturnsPage /> },
      { path: "adjustments", element: <AdjustmentsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "audit", element: <AuditPage /> },
      { path: "material-stock", element: <MaterialStockPage /> },
    ],
  },
  {
    path: "/manager",
    element: (
      <RequireAuth roles={["MANAGER"]}>
        <ManagerLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ManagerDashboard /> },
      { path: "products", element: <ManagerProductsPage /> },
      { path: "categories", element: <ManagerCategoriesPage /> },
      { path: "stock-in", element: <ManagerStockInPage /> },
      { path: "transfers", element: <ManagerTransfersPage /> },
      { path: "sales", element: <SalesPage /> },
      { path: "returns", element: <ReturnsPage /> },
      { path: "adjustments", element: <AdjustmentsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "audit", element: <AuditPage /> },
      { path: "material-stock", element: <MaterialStockPage /> },
    ],
  },
  {
    path: "/seller",
    element: (
      <RequireAuth roles={["SELLER"]}>
        <SellerLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <SellerDashboard /> },
      { path: "incoming", element: <SellerIncomingTransfersPage /> },
      { path: "stock", element: <SellerMyShopStockPage /> },
      { path: "new-sale", element: <SellerNewSalePage /> },
      { path: "my-sales", element: <SellerMySalesPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <Navigate to="/" replace />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
