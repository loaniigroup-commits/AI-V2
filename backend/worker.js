export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    if (url.pathname === "/health") return cors(json({ ok: true }));
    if (url.pathname !== "/api/chat" || request.method !== "POST") return cors(json({ error: "Not found" }, 404));

    if (!env.OPENAI_API_KEY) return cors(json({ error: "OPENAI_API_KEY is not configured" }, 500));

    try {
      const body = await request.json();
      const message = String(body.message || "").trim();
      const currentDate = String(body.current_date || "");
      const timezone = String(body.timezone || "");
      if (!message) return cors(json({ error: "message is required" }, 400));

      const instructions = `You are the AI assistant inside a Daily Task Manager Android app. Reply in the same language as the user whenever practical. Current local date: ${currentDate}. Time zone: ${timezone}.\n\nYour job is to answer questions normally, AND detect requests to create a task. Return ONLY valid JSON, no markdown.\n\nFor normal conversation use:\n{"action":"chat","reply":"your helpful reply"}\n\nWhen the user clearly asks to add/create/save a task, use:\n{"action":"add_task","reply":"brief confirmation describing the task","task":{"title":"short title","description":"useful details from the request","date":"YYYY-MM-DD","time":"HH:mm"}}\n\nRules: If the user says today/tomorrow/a weekday, resolve it using the current local date. If no date is specified, use the current local date. If no time is specified, set time to an empty string. Use 24-hour HH:mm. Do not invent phone numbers or details. If the request is ambiguous enough that saving the wrong task would be harmful, ask a brief question using action=chat instead of creating it.`;

      const openai = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-5.6-luna",
          instructions,
          input: message,
          max_output_tokens: 600
        })
      });

      const data = await openai.json();
      if (!openai.ok) return cors(json({ error: "OpenAI request failed", detail: data }, openai.status));
      const text = extractText(data);
      let parsed;
      try { parsed = JSON.parse(cleanJson(text)); }
      catch { parsed = { action: "chat", reply: text || "I couldn't format the response. Please try again." }; }
      return cors(json(parsed));
    } catch (e) {
      return cors(json({ error: String(e && e.message ? e.message : e) }, 500));
    }
  }
};

function extractText(data) {
  if (typeof data.output_text === "string" && data.output_text) return data.output_text;
  const parts = [];
  for (const item of (data.output || [])) {
    for (const c of (item.content || [])) {
      if (typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("\n");
}

function cleanJson(s) {
  return String(s || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
}
function json(obj, status=200) { return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8" } }); }
function cors(res) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  return new Response(res.body, { status: res.status, headers: h });
}
