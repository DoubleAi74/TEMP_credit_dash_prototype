import { z } from "zod";

const isSandboxSecretKey = (value) =>
  value.startsWith("sk_test_") ||
  (value.startsWith("sup_sk_") &&
    !value.startsWith("sk_live_") &&
    !value.startsWith("sup_pk_") &&
    !value.startsWith("sup_afk_"));

const sumupEnvironmentSchema = z.object({
  SUMUP_API_KEY: z
    .string()
    .min(1)
    .refine(isSandboxSecretKey, {
      message:
        "SUMUP_API_KEY must be a SumUp sandbox/server secret key, not a live, public, or affiliate key.",
    }),
  SUMUP_MERCHANT_CODE: z.string().min(1),
  SUMUP_API_BASE_URL: z.string().url().default("https://api.sumup.com"),
  SUMUP_CURRENCY: z.literal("GBP").default("GBP"),
  SUMUP_WEBHOOK_URL: z.string().url(),
  SUMUP_CHECKOUT_RETURN_URL: z.string().url(),
});

let cachedEnvironment = null;

export function getSumUpEnvironment() {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  cachedEnvironment = sumupEnvironmentSchema.parse({
    SUMUP_API_KEY: process.env.SUMUP_API_KEY,
    SUMUP_MERCHANT_CODE: process.env.SUMUP_MERCHANT_CODE,
    SUMUP_API_BASE_URL:
      process.env.SUMUP_API_BASE_URL || "https://api.sumup.com",
    SUMUP_CURRENCY: process.env.SUMUP_CURRENCY || "GBP",
    SUMUP_WEBHOOK_URL: process.env.SUMUP_WEBHOOK_URL,
    SUMUP_CHECKOUT_RETURN_URL: process.env.SUMUP_CHECKOUT_RETURN_URL,
  });

  return cachedEnvironment;
}

export function resetSumUpEnvironmentForTests() {
  cachedEnvironment = null;
}
