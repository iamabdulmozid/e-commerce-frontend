import type { Metadata } from "next";
import { MyOrders } from "@/components/orders/my-orders";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

export default function AccountOrdersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Your orders</h1>
        <p className="text-muted-foreground text-sm">
          Everything you have bought from this shop.
        </p>
      </div>
      <MyOrders />
    </div>
  );
}
