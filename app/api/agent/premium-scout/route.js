import crypto from "node:crypto";
import { x402HTTPResourceServer } from "@okxweb3/x402-core/http";
import { x402ResourceServer } from "@okxweb3/x402-core/server";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";

export const runtime = "nodejs";

let x402ServerPromise;

function hasX402Config() {
  return Boolean(
    process.env.OKX_API_KEY &&
      process.env.OKX_SECRET_KEY &&
      process.env.OKX_PASSPHRASE &&
      process.env.OKX_PROJECT_ID &&
      process.env.X402_PAY_TO_ADDRESS,
  );
}

class OKXX402FacilitatorClient {
  constructor(config) {
    this.config = {
      baseUrl: "https://web3.okx.com",
      apiPrefix: "/api/v6/pay/x402",
      syncSettle: false,
      ...config,
    };
  }

  createHeaders(method, path, body) {
    const timestamp = new Date().toISOString();
    const sign = crypto
      .createHmac("sha256", this.config.secretKey)
      .update(timestamp + method + path + (body || ""))
      .digest("base64");

    return {
      "OK-ACCESS-KEY": this.config.apiKey,
      "OK-ACCESS-SIGN": sign,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": this.config.passphrase,
      "OK-ACCESS-PROJECT": this.config.projectId,
      "Content-Type": "application/json",
    };
  }

  async request(method, suffix, bodyObj) {
    const path = `${this.config.apiPrefix}${suffix}`;
    const body = bodyObj ? JSON.stringify(bodyObj) : undefined;
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers: this.createHeaders(method, path, body),
      body,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`OKX ${suffix} failed: ${response.status}${detail ? ` ${detail.slice(0, 180)}` : ""}`);
    }

    const json = await response.json();
    return json.data ?? json;
  }

  getSupported() {
    return this.request("GET", "/supported");
  }

  verify(paymentPayload, paymentRequirements) {
    return this.request("POST", "/verify", {
      x402Version: 2,
      paymentPayload,
      paymentRequirements,
    });
  }

  settle(paymentPayload, paymentRequirements) {
    const body = {
      x402Version: 2,
      paymentPayload,
      paymentRequirements,
    };
    if (this.config.syncSettle !== undefined) {
      body.syncSettle = this.config.syncSettle;
    }
    return this.request("POST", "/settle", body);
  }

  getSettleStatus(txHash) {
    return this.request("GET", `/settle/status?txHash=${encodeURIComponent(txHash)}`);
  }
}

async function getX402Server() {
  if (!x402ServerPromise) {
    x402ServerPromise = (async () => {
      const facilitatorClient = new OKXX402FacilitatorClient({
        apiKey: process.env.OKX_API_KEY,
        secretKey: process.env.OKX_SECRET_KEY,
        passphrase: process.env.OKX_PASSPHRASE,
        projectId: process.env.OKX_PROJECT_ID,
        baseUrl: process.env.X402_FACILITATOR_BASE_URL || "https://web3.okx.com",
        apiPrefix: process.env.OKX_X402_API_PREFIX || "/api/v6/pay/x402",
        syncSettle: process.env.X402_SYNC_SETTLE === "true",
      });

      const resourceServer = new x402ResourceServer(facilitatorClient).register("eip155:196", new ExactEvmScheme());
      await resourceServer.initialize();

      return new x402HTTPResourceServer(resourceServer, {
        "POST /api/agent/premium-scout": {
          accepts: {
            scheme: "exact",
            network: "eip155:196",
            payTo: process.env.X402_PAY_TO_ADDRESS,
            price: process.env.X402_PREMIUM_SCOUT_PRICE || "$0.01",
          },
          description: "StrikeNation FC premium AI scouting report",
          mimeType: "application/json",
        },
      });
    })();
  }

  return x402ServerPromise;
}

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function nextRequestAdapter(request) {
  const url = new URL(request.url);

  return {
    getHeader(name) {
      return request.headers.get(name) || undefined;
    },
    getMethod() {
      return request.method;
    },
    getPath() {
      return url.pathname;
    },
    getUrl() {
      return request.url;
    },
    getAcceptHeader() {
      return request.headers.get("accept") || "application/json";
    },
    getUserAgent() {
      return request.headers.get("user-agent") || "";
    },
    getQueryParams() {
      return Object.fromEntries(url.searchParams.entries());
    },
    getQueryParam(name) {
      return url.searchParams.get(name) || undefined;
    },
  };
}

function responseFromInstructions(instructions) {
  return Response.json(instructions.body || {}, {
    status: instructions.status,
    headers: instructions.headers,
  });
}

async function buildPremiumScout(state, paymentMode) {
  const fallback = {
    summary: `${state.agentName || "Your agent"} should force a controlled duel, avoid early risk, and pressure the rival wallet after the first miss.`,
    opponentWeakness: "Second-wallet agents usually overcommit when the opening power is above 80.",
    recommendedCourtPlan: "Open with medium power, settle after both agents are confirmed, then post a market intent.",
    suggestedMarket: `Will ${state.country || "Nigeria"} FanDAO win the next autonomous court?`,
    commentary: `${state.country || "Your country"} enters the court with a paid scouting edge.`,
    source: paymentMode,
  };

  if (!process.env.CLAUDE_API_KEY) {
    return fallback;
  }

  const prompt = `
You are the premium scout for StrikeNation FC, an AI-agent football court on X Layer.
Return only minified JSON with keys: summary, opponentWeakness, recommendedCourtPlan, suggestedMarket, commentary.
Each value must be under 24 words. Use plain ASCII only. No markdown, emojis, hashtags, or quotation marks inside values.
State: ${JSON.stringify({
    country: state.country,
    opponent: state.opponent,
    agentName: state.agentName,
    playstyle: state.playstyle,
    record: state.record,
    marketOdds: state.marketOdds,
    courtMatchId: state.courtMatchId,
  })}
`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
        max_tokens: Number(process.env.CLAUDE_PREMIUM_MAX_TOKENS || 260),
        temperature: 0.45,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return fallback;

    const data = await response.json();
    const text = data.content?.find((item) => item.type === "text")?.text || "{}";
    const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim());

    return {
      summary: parsed.summary || fallback.summary,
      opponentWeakness: parsed.opponentWeakness || fallback.opponentWeakness,
      recommendedCourtPlan: parsed.recommendedCourtPlan || fallback.recommendedCourtPlan,
      suggestedMarket: parsed.suggestedMarket || fallback.suggestedMarket,
      commentary: parsed.commentary || fallback.commentary,
      source: paymentMode,
    };
  } catch {
    return fallback;
  }
}

export async function POST(request) {
  const state = await request.json();

  if (!hasX402Config()) {
    return Response.json(
      {
        error: "payment_required",
        x402Ready: true,
        payment: {
          scheme: "exact",
          network: "eip155:196",
          payTo: process.env.X402_PAY_TO_ADDRESS || "set_X402_PAY_TO_ADDRESS",
          price: process.env.X402_PREMIUM_SCOUT_PRICE || "$0.01",
          endpoint: "POST /api/agent/premium-scout",
        },
        message:
          "x402 payment boundary is installed. Add OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE, and X402_PAY_TO_ADDRESS to enforce paid access.",
      },
      { status: 402, headers: { "PAYMENT-REQUIRED": "x402-config-missing" } },
    );
  }

  let server;
  let result;
  const context = {
    adapter: nextRequestAdapter(request),
    path: "/api/agent/premium-scout",
    method: "POST",
    paymentHeader: request.headers.get("PAYMENT-SIGNATURE") || undefined,
  };

  try {
    server = await withTimeout(getX402Server(), 12000, "x402 setup");
    result = await withTimeout(server.processHTTPRequest(context), 12000, "x402 payment check");
  } catch (error) {
    console.error("x402 premium scout setup failed", {
      name: error?.name,
      message: error?.message,
      status: error?.status,
    });
    return Response.json(
      {
        error: "x402_setup_failed",
        message: "x402 facilitator setup failed. Check OKX facilitator credentials, pay-to wallet, and price format.",
        detail: error?.message || "Unknown x402 setup error",
      },
      { status: 500 },
    );
  }

  if (result.type === "payment-error") {
    return responseFromInstructions(result.response);
  }

  const body = await buildPremiumScout(state, "x402-paid");

  if (result.type === "payment-verified") {
    const responseBody = Buffer.from(JSON.stringify(body));
    const settlement = await server.processSettlement(
      result.paymentPayload,
      result.paymentRequirements,
      result.declaredExtensions,
      {
        request: context,
        responseBody,
        responseHeaders: { "content-type": "application/json" },
      },
    );

    if (!settlement.success) {
      return responseFromInstructions(settlement.response);
    }

    return Response.json(body, { headers: settlement.headers });
  }

  return Response.json(body);
}
