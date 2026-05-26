export async function POST(request) {
  const state = await request.json();

  const fallback = {
    direction: "left",
    power: 78,
    risk: "medium",
    marketMove: "YES",
    reason: `${state.country || "Nigeria"} should use a controlled left shot and back the country market while momentum is favorable.`,
    commentary: `${state.agentName || "Your Strike Agent"} steps up for ${state.country || "Nigeria"} with the nation watching.`,
    source: "local-fallback",
  };

  if (!process.env.CLAUDE_API_KEY) {
    return Response.json(fallback);
  }

  const prompt = `
You are the AI Captain for StrikeNation FC, a World Cup FanDAO penalty arena on X Layer.
Return only minified JSON with keys: direction, power, risk, marketMove, reason, commentary.
Power must be an integer from 40 to 100. Risk must be low, medium, or high. marketMove must be YES or NO.
Keep reason under 22 words.
Keep commentary under 24 words. Make commentary exciting, country-pride focused, and demo-friendly.
Use plain ASCII text only. No emojis, hashtags, markdown, or quotation marks inside values.

Game state:
${JSON.stringify({
  country: state.country,
  opponent: state.opponent,
  agentName: state.agentName,
  playstyle: state.playstyle,
  record: state.record,
  marketOdds: state.marketOdds,
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
        max_tokens: Number(process.env.CLAUDE_MAX_TOKENS || 140),
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return Response.json({ ...fallback, source: "claude-error" });
    }

    const data = await response.json();
    const text = data.content?.find((item) => item.type === "text")?.text || "{}";
    const parsed = JSON.parse(text.replace(/^```json|```$/g, "").trim());

    return Response.json({
      direction: parsed.direction || fallback.direction,
      power: Number(parsed.power || fallback.power),
      risk: parsed.risk || fallback.risk,
      marketMove: parsed.marketMove || fallback.marketMove,
      reason: parsed.reason || fallback.reason,
      commentary: parsed.commentary || fallback.commentary,
      source: "claude",
    });
  } catch {
    return Response.json({ ...fallback, source: "local-fallback" });
  }
}
