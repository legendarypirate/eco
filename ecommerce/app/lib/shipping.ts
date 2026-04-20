/** MNT */
export const DELIVERY_FEE_MNT = 8800;

export function getTotalNonGiftItemQuantity(
  cartItems: { isGift?: boolean; quantity?: number }[]
): number {
  return cartItems
    .filter((item) => !item.isGift)
    .reduce((sum, item) => {
      const q =
        typeof item.quantity === "number"
          ? item.quantity
          : parseInt(String(item.quantity), 10) || 0;
      return sum + q;
    }, 0);
}

function lineQuantity(item: {
  quantity?: number;
}): number {
  return typeof item.quantity === "number"
    ? item.quantity
    : parseInt(String(item.quantity), 10) || 0;
}

function thresholdForProduct(product?: {
  deliveryFreeMinQuantity?: number | null;
}): number | null {
  if (!product) return null;
  const t = product.deliveryFreeMinQuantity;
  if (t == null) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/**
 * Delivery shipping for "хүргэлтээр" (not pickup / invoice).
 * Free if **any** non-gift line has `deliveryFreeMinQuantity` set (N) and quantity >= N.
 * If no line qualifies, charge 8800₮ (including when no product has a threshold).
 */
export function calculateDeliveryShippingMnt(opts: {
  deliveryMethod: string;
  cartItems: {
    isGift?: boolean;
    quantity?: number;
    product?: { deliveryFreeMinQuantity?: number | null };
  }[];
}): number {
  const { deliveryMethod, cartItems } = opts;
  if (deliveryMethod === "pickup" || deliveryMethod === "invoice") {
    return 0;
  }

  const nonGift = cartItems.filter((item) => !item.isGift && item.product);

  const anyLineQualifies = nonGift.some((item) => {
    const min = thresholdForProduct(item.product);
    if (min == null) return false;
    return lineQuantity(item) >= min;
  });

  return anyLineQualifies ? 0 : DELIVERY_FEE_MNT;
}
