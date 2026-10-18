import { getStore } from "@netlify/blobs";

export type PendingOrder = {
  orderNo: string;
  amount: number;
  mode: "initial" | "extend";
  createdAt: number;
  consumedAt?: number;
};

const TTL_MS = 60 * 60 * 1000;

export async function savePendingOrder(order: PendingOrder): Promise<void> {
  await getStore("payuni-orders").setJSON(order.orderNo, order);
}

export async function consumePendingOrder(
  orderNo: string,
  amount: number
): Promise<PendingOrder | null> {
  if (!orderNo) return null;

  const store = getStore("payuni-orders");
  const entry = await store.getWithMetadata(orderNo, {
    type: "json",
    consistency: "strong",
  });
  const order = entry?.data as PendingOrder | undefined;

  if (
    !order ||
    order.orderNo !== orderNo ||
    order.amount !== amount ||
    order.consumedAt ||
    Date.now() - order.createdAt > TTL_MS ||
    !entry?.etag
  ) {
    return null;
  }

  const write = await store.setJSON(
    orderNo,
    { ...order, consumedAt: Date.now() },
    { onlyIfMatch: entry.etag }
  );
  return write.modified ? order : null;
}
