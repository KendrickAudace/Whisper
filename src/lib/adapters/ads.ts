import { getStore } from "@/lib/store";

export type AdsAdapter = {
  trackImpression(adId: string): void;
  trackClick(adId: string): void;
  label: string;
};

export const demoAdsAdapter: AdsAdapter = {
  label: "Demo ad tracking adapter",
  trackImpression(adId) {
    getStore().trackAdImpression(adId);
  },
  trackClick(adId) {
    getStore().trackAdClick(adId);
  },
};
