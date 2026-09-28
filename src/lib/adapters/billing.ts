export type BillingAdapter = {
  beginCheckout(input: { userId: string; tier: "free" | "plus" | "premium" }): { checkoutId: string; redirectUrl: string };
  label: string;
};

export const demoBillingAdapter: BillingAdapter = {
  label: "Demo mock checkout",
  beginCheckout({ userId, tier }) {
    const checkoutId = `${tier}-${Date.now()}`;
    return {
      checkoutId,
      redirectUrl: `/plans?checkout=success&tier=${tier}&checkoutId=${checkoutId}&uid=${userId}`,
    };
  },
};
