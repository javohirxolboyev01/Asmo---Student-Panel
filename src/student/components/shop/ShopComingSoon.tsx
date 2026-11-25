// "Coming soon" screen shown on /shop and /wishlist while the shop is closed.
// Flip SHOP_OPEN in src/student/StudentRoutes.tsx to bring the shop back.
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { EmptyState, PageHeader } from "../ui";

export const ShopComingSoon = () => {
  const { t } = useTranslation();
  return (
    <div className="sp-page">
      <PageHeader title={t("nav.shop")} />
      <EmptyState
        icon={Store}
        title={t("space.shop.soonTitle")}
        text={t("space.shop.soonText")}
        action={
          <Link to="/coins" className="sp-cta inline-flex no-underline">
            {t("space.shop.soonCoins")}
          </Link>
        }
      />
    </div>
  );
};
