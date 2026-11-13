import { Outlet } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../hooks/useAuth";

export default function ManagerLayout() {
  const { user } = useAuth();
  const canManageProducts = Boolean(user?.can_manage_products);

  const navItems = [
    { to: "/manager", label: "Dashboard", end: true },
    { to: "/manager/material-stock", label: "Material Stock" },
    { to: "/manager/bulk-upload", label: "Bulk Upload" },
    { to: "/manager/reports", label: "Reports" },
    { to: "/manager/audit", label: "Audit Log" },
    ...(canManageProducts
      ? [
          { to: "/manager/products", label: "Products" },
          { to: "/manager/categories", label: "Categories" },
        ]
      : [{ label: "Products", soon: true }]),
    { to: "/manager/stock-in", label: "Stock In" },
    { label: "Distribute", soon: true },
    { to: "/manager/transfers", label: "Shop Transfers" },
    { to: "/manager/sales", label: "Sales Entry" },
    { to: "/manager/returns", label: "Returns" },
    { to: "/manager/adjustments", label: "Adjustments" },
  ];

  return (
    <AppLayout
      title="Manager Workspace"
      subtitle="Receive, distribute and keep stock accurate"
      badge="Manager"
      navItems={navItems}
    >
      <Outlet />
    </AppLayout>
  );
}
