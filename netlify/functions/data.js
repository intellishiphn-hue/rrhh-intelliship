const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const store = getStore({ name: "rrhh", consistency: "strong" });

  if (event.httpMethod === "GET") {
    try {
      const raw = await store.get("appdata");
      if (!raw) return { statusCode: 200, headers, body: JSON.stringify(null) };
      return { statusCode: 200, headers, body: raw };
    } catch (e) {
      return { statusCode: 200, headers, body: JSON.stringify(null) };
    }
  }

  if (event.httpMethod === "POST") {
    try {
      const body = event.body;
      await store.set("appdata", body);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      console.error("Save error:", e);
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: e.message }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
};
