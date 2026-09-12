"use client";

import { Package } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { formatMoney } from "@/components/catalog/price";
import { OrderStatusChips } from "@/components/orders/order-timeline";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { orderService } from "@/services/orders";

export function MyOrders() {
  const { data, isLoading } = useSWR(
    "/orders",
    async () => (await orderService.mine()).items,
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you buy something it will show up here."
        action={<ButtonLink href="/products">Start shopping</ButtonLink>}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((order) => (
        <li key={order.number}>
          <Link href={`/account/orders/${order.number}`} className="block">
            <Card className="hover:border-border flex flex-wrap items-center gap-4 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold">
                  {order.number}
                </p>
                <p className="text-muted-foreground text-xs">
                  {new Date(order.placed_at).toLocaleDateString()} ·{" "}
                  {order.items?.length ?? 0} item
                  {(order.items?.length ?? 0) === 1 ? "" : "s"}
                </p>
              </div>

              <OrderStatusChips order={order} />

              <p className="font-semibold tabular-nums">
                {formatMoney(order.totals.grand_total, order.totals.currency)}
              </p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
