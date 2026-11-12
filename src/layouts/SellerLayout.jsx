import { Outlet } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

const navItems = [
  { to: "/seller", label: "Home", end: true },
  { to: "/seller/stock", label: "Stock" },
  { to: "/seller/new-sale", label: "New Sale" },
  { to: "/seller/my-sales", label: "My Sales" },
  { to: "/seller/incoming", label: "Incoming" },
];

export default function SellerLayout() {
  return (
    <AppLayout
      variant="seller"
      title="Seller"
      subtitle="Your shop stock and sales"
      navItems={navItems}
    >
      <Outlet />
    </AppLayout>
  );
}
