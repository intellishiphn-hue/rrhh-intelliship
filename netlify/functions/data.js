const https = require("https");

const SITE_ID = process.env.NETLIFY_SITE_ID || "9551dde8-cb02-4dd5-9048-69d175f5e40e";
const TOKEN   = process.env.NETLIFY_TOKEN;
const KEY     = "appdata";
const STORE   = "rrhh";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

function netlifyRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.netlify.com",
      path: path,
      method: method,
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  if (!TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "NETLIFY_TOKEN not set" }) };
  }

  const blobPath = `/api/v1/blobs/${SITE_ID}/${STORE}/${KEY}`;

  if (event.httpMethod === "GET") {
    try {
      const res = await netlifyRequest("GET", blobPath, null);
      if (res.status === 404) return { statusCode: 200, headers, body: JSON.stringify(null) };
      if (res.status !== 200) return { statusCode: 200, headers, body: JSON.stringify(null) };
      return { statusCode: 200, headers, body: res.body };
    } catch (e) {
      console.error("GET error:", e);
      return { statusCode: 200, headers, body: JSON.stringify(null) };
    }
  }

  if (event.httpMethod === "POST") {
    try {
      const res = await netlifyRequest("PUT", blobPath, event.body);
      console.log("PUT status:", res.status);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: res.status < 300 }) };
    } catch (e) {
      console.error("POST error:", e);
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
};
