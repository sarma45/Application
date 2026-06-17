export type Region = "US" | "EU" | "GB" | "IN" | "BR" | "JP" | "AU";

export interface RegionConfig {
  currency: string;
  locale: string;
  multiplier: number;
  paymentMethods: string[];
}

export const REGION_CONFIGS: Record<Region, RegionConfig> = {
  US: { currency: "usd", locale: "en-US", multiplier: 1.0, paymentMethods: ["card", "link"] },
  EU: { currency: "eur", locale: "en-EU", multiplier: 0.85, paymentMethods: ["card", "ideal", "bancontact", "sofort"] },
  GB: { currency: "gbp", locale: "en-GB", multiplier: 0.8, paymentMethods: ["card"] },
  IN: { currency: "inr", locale: "en-IN", multiplier: 0.45, paymentMethods: ["card", "upi"] },
  BR: { currency: "brl", locale: "pt-BR", multiplier: 0.55, paymentMethods: ["card"] },
  JP: { currency: "jpy", locale: "ja-JP", multiplier: 0.9, paymentMethods: ["card"] },
  AU: { currency: "aud", locale: "en-AU", multiplier: 1.05, paymentMethods: ["card"] },
};

export function getRegion(region: string): Region {
  if (region in REGION_CONFIGS) return region as Region;
  return "US";
}

export function adjustedPrice(cents: number, region: Region): number {
  return Math.round(cents * REGION_CONFIGS[region].multiplier);
}

export function formatPrice(cents: number, region: Region): string {
  const cfg = REGION_CONFIGS[region];
  const adjusted = adjustedPrice(cents, region);
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency.toUpperCase(),
  }).format(adjusted / 100);
}
