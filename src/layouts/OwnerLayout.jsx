import { Outlet } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

const navItems = [
  { to: "/owner", label: "Dashboard", end: true },
  { to: "/owner/material-stock", label: "Material Stock" },
  { to: "/owner/bulk-upload", label: "Bulk Upload" },
  { to: "/owner/reports", label: "Reports" },
  { to: "/owner/audit", label: "Audit Log" },
  { to: "/owner/products", label: "Products" },
  { to: "/owner/categories", label: "Categories" },
  { to: "/owner/stock", label: "Stock Overview" },
  { to: "/owner/transfers", label: "Transfers" },
  { to: "/owner/sales", label: "Sales" },
  { to: "/owner/returns", label: "Returns" },
  { to: "/owner/adjustments", label: "Adjustments" },
  { to: "/owner/users", label: "Users" },
  { to: "/owner/shops", label: "Shops" },
];

export default function OwnerLayout() {
  return (
    <AppLayout
      title="Owner Console"
      subtitle="Full control across the warehouse and every shop"
      badge="Owner"
      navItems={navItems}
    >
      <Outlet />
    </AppLayout>
  );
}
