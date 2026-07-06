import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getSumUpEnvironment,
  resetSumUpEnvironmentForTests,
} from "./sumup-env.mjs";

const requiredEnvironment = {
  SUMUP_API_BASE_URL: "https://api.sumup.com",
  SUMUP_CHECKOUT_RETURN_URL: "https://example.com/payment/return",
  SUMUP_CURRENCY: "GBP",
  SUMUP_MERCHANT_CODE: "sandbox-merchant",
  SUMUP_WEBHOOK_URL: "https://example.com/api/webhooks/sumup/test-path",
};

function stubEnvironment(apiKey) {
  resetSumUpEnvironmentForTests();
  vi.stubEnv("SUMUP_API_KEY", apiKey);

  for (const [key, value] of Object.entries(requiredEnvironment)) {
    vi.stubEnv(key, value);
  }
}

describe("SumUp environment validation", () => {
  afterEach(() => {
    resetSumUpEnvironmentForTests();
    vi.unstubAllEnvs();
  });

  it("accepts SumUp sandbox/server secret key formats", () => {
    stubEnvironment("sk_test_example");
    expect(getSumUpEnvironment().SUMUP_API_KEY).toBe("sk_test_example");

    stubEnvironment("sup_sk_example");
    expect(getSumUpEnvironment().SUMUP_API_KEY).toBe("sup_sk_example");
  });

  it("rejects live, public, and affiliate key shapes", () => {
    for (const apiKey of ["sk_live_example", "sup_pk_example", "sup_afk_example"]) {
      stubEnvironment(apiKey);
      expect(() => getSumUpEnvironment()).toThrow(
        "SUMUP_API_KEY must be a SumUp sandbox/server secret key",
      );
    }
  });
});
