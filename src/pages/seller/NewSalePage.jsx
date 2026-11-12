import { useQuery } from "@tanstack/react-query";

import { shopApi } from "../../api/authApi";
import PageHeader from "../../components/common/PageHeader";
import StageNotice from "../../components/common/StageNotice";
import SaleForm from "../../components/forms/SaleForm";

export default function NewSalePage() {
  const { data: shopsData } = useQuery({
    queryKey: ["shops", "all"],
    queryFn: () => shopApi.list(),
    staleTime: 60000,
  });
  const shops = (shopsData?.results || shopsData || []).filter(
    (s) => s.shop_type !== "IN_TRANSIT"
  );

  // Seller sells from their assigned shop — if exactly one, lock it in.
  const fixedShop = shops.length === 1 ? shops[0].id : null;

  return (
    <>
      <PageHeader
        title="New Sale"
        description="Record stock leaving your shop. No prices — quantity only."
      />

      <div className="card p-4 sm:p-5">
        <SaleForm fixedShop={fixedShop} mobile />
      </div>

      <div className="mt-4">
        <StageNotice>
          Recording a sale deducts stock immediately. If something is wrong
          afterwards, ask your manager to correct the sale.
        </StageNotice>
      </div>
    </>
  );
}
