import type { Metadata } from "next";
import { MyOrderDetail } from "@/components/orders/my-order-detail";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;

  return <MyOrderDetail number={number} />;
}
