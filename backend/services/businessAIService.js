const {
  buildDashboardReport,
} = require("./reportingService");

async function generateBusinessAI(req, options = {}) {
  const report = await buildDashboardReport(req, options);

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return {
      provider: "local-rules-v1",
      status: "ready",
      configured: false,
      generatedAt: new Date(),
      insights: report.ai?.insights || [],
      explanation:
        "The reporting engine is operational. LLM analysis is not enabled because OPENAI_API_KEY and/or OPENAI_MODEL is not configured on the backend.",
      facts: {
        period: report.period,
        scope: report.scope,
        summary: report.summary,
        topProducts: report.topProducts,
        stock: report.stock.summary,
      },
    };
  }

  const businessFacts = {
    period: report.period,
    scope: report.scope,
    summary: report.summary,
    topProducts: report.topProducts,
    stockSummary: report.stock.summary,
    lowStockModels: report.stock.models
      .filter((item) => item.status === "Critical" || item.status === "Low")
      .slice(0, 20)
      .map((item) => ({
        brand: item.brand,
        model: item.model,
        ram: item.ram,
        storage: item.storage,
        total: item.total,
        status: item.status,
      })),
  };

  const prompt = [
    "You are the Business Intelligence assistant for a phone retail company.",
    "Analyze only the supplied structured business facts.",
    "Do not invent numbers, transactions, causes, or recommendations unsupported by the facts.",
    "Separate facts from interpretation.",
    "Return concise management-ready insights.",
    "When discussing critical or low stock, name the affected models explicitly rather than reporting only counts.",
    "Return valid JSON with this exact shape:",
    '{"summary":"string","insights":[{"type":"positive|attention|opportunity|risk","title":"string","message":"string","evidence":["string"],"drillDown":{"label":"string","path":"string","params":{}}}],"recommendedActions":["string"]}',
    "",
    "BUSINESS FACTS:",
    JSON.stringify(businessFacts),
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: 900,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI provider request failed (${response.status}): ${text}`);
    }

    const data = await response.json();

    const outputText =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        ?.map((item) => item.text || "")
        ?.join("") ||
      "";

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch {
      parsed = {
        summary: outputText.trim() || "AI returned no readable analysis.",
        insights: [],
        recommendedActions: [],
      };
    }

    return {
      provider: "openai-responses",
      status: "ready",
      configured: true,
      model,
      generatedAt: new Date(),
      ...parsed,
      facts: businessFacts,
    };
  } catch (providerError) {
    console.error("Business AI provider unavailable; using local intelligence:", providerError.message);

    return {
      provider: "local-rules-v1",
      status: "fallback",
      configured: true,
      generatedAt: new Date(),
      insights: report.ai?.insights || [],
      explanation:
        "The external AI provider could not be reached. GadgetShop has retained deterministic Business Intelligence so the report remains usable.",
      providerError: providerError.message,
      facts: businessFacts,
    };
  }

}

module.exports = {
  generateBusinessAI,
};
