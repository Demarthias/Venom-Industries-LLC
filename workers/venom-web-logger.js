/**
 * Venom Edge Core (Patched)
 * - Uses ctx.waitUntil to ensure logs are sent before the worker dies.
 */

const REDIRECTS = {
  "/api/research-panel": "https://afflat3c1.com/trk/lnk/83686571-AB97-4819-9B29-F9D5671EE09E/?o=30906&c=918277&a=785240&k=62C72F007A2C13609498199396AD3F25&l=35633&s1=pinterest&s2=monolith_render",
  "/go/credit":          "https://afflat3c2.com/trk/lnk/83686571-AB97-4819-9B29-F9D5671EE09E/?o=27618&c=918277&a=785240&k=FCCE6E2FF9DBBC3F1268A01A31567EEA&l=29942&s1=pinterest_landingpage&s2=monolith_render",
  "/api/intel-alpha":    "https://afflat3c2.com/trk/lnk/83686571-AB97-4819-9B29-F9D5671EE09E/?o=27707&c=918277&a=785240&k=177469C1DA56836D33E87AFA2D6D73F2&l=29747&s1=pinterest&s2=monolith_render",
  "/api/asset-sync":     "https://afflat3c1.com/trk/lnk/83686571-AB97-4819-9B29-F9D5671EE09E/?o=29787&c=918277&a=785240&k=35077C3C49E6246E573B365AAC9C5D69&l=33479&s1=pinterest&s2=monolith_render",
  "/api/uplink-beta":    "https://afflat3c1.com/trk/lnk/83686571-AB97-4819-9B29-F9D5671EE09E/?o=25746&c=918277&a=785240&k=A068D57FFE7262FDE665A13A12B47473&l=26967&s1=pinterest&s2=monolith_render",
  "/go/proton":          "https://proton.me/vpn",
};

export default {
  async fetch(request, env, ctx) { // <--- Added ctx here
    const url = new URL(request.url);
    const path = url.pathname;

    // --- 1. HANDLE REDIRECTS ---
    if (request.method === "GET" && REDIRECTS[path]) {
      const targetUrl = REDIRECTS[path];
      
      const logData = {
        path: path,
        ref: request.headers.get("Referer") || "direct",
        title: "Affiliate Redirect",
        utm_source: "venom_cloaker",
        utm_campaign: path.replace("/","")
      };
      
      // FIX: Use ctx.waitUntil to keep worker alive
      ctx.waitUntil(
        logToSheet(logData, request, env).catch(err => console.log("Log failed", err))
      );

      return Response.redirect(targetUrl, 302);
    }

    // --- 2. HANDLE ANALYTICS ---
    if (request.method === "POST") {
      try {
        const data = await request.json();
        // For POST, we await it because the client expects a response
        await logToSheet(data, request, env);
        return new Response(JSON.stringify({ status: "logged" }), {
          headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // --- 3. OPTIONS (CORS) ---
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    return new Response("Venom Edge Online", { status: 200 });
  }
};

// --- HELPER FUNCTIONS ---
async function logToSheet(data, request, env) {
  const country = request.cf?.country || "XX";
  const city = request.cf?.city || "Unknown";
  const region = request.cf?.region || "Unknown";

  const rowValues = [
    new Date().toISOString(),            
    data.email        || "",             
    country,                             
    city,                                
    region,                              
    data.utm_source   || "",             
    data.utm_medium   || "",             
    data.utm_campaign || "",             
    data.path         || "/",            
    data.ref          || "direct",       
    data.title        || "Unknown",      
    data.screen       || "",             
    data.viewport     || "",             
    data.tz           || "",             
    request.headers.get("User-Agent") || "" 
  ];

  const token = await getGoogleAuthToken(env);
  const sheetId = env.GOOGLE_SHEETS_ID;
  const range = `${env.GOOGLE_SHEETS_TAB || "Sheet1"}!A1`; 
  const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(sheetsUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [rowValues] }),
  });

  if (!response.ok) throw new Error(`Sheets API Error: ${await response.text()}`);
}

async function getGoogleAuthToken(env) {
  const pem = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: clientEmail, scope: scopes.join(" "), aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;
  const signature = await signWithPrivateKey(signatureInput, pem);
  const jwt = `${signatureInput}.${signature}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}
function base64UrlEncode(str) { return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
async function signWithPrivateKey(data, pem) {
  const pemContents = pem.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, ""); 
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", binaryDer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
