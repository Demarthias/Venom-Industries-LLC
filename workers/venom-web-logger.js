export default {
  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      try {
        const data = await request.json();
        await logToSheet(data, request, env);
        return new Response(JSON.stringify({ status: "logged" }), { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    }
    return new Response("Venom Edge Online", { status: 200 });
  }
};
async function logToSheet(data, request, env) {
  const row = [new Date().toISOString(), data.email||"", request.cf?.country||"XX", request.cf?.city||"Unknown", request.cf?.region||"Unknown", data.utm_source||"", data.utm_medium||"", data.utm_campaign||"", data.path||"/", data.ref||"direct", data.title||"Unknown", data.screen||"", data.viewport||"", data.tz||"", request.headers.get("User-Agent")||""];
  const token = await getToken(env);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${env.GOOGLE_SHEETS_TAB||"Sheet1"}!A1:append?valueInputOption=USER_ENTERED`, { method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body: JSON.stringify({ values:[row] }) });
  if (!res.ok) throw new Error(await res.text());
}
async function getToken(env) {
  const enc = s => btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  const now = Math.floor(Date.now()/1000);
  const hdr = enc(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const clm = enc(JSON.stringify({iss:env.GOOGLE_SERVICE_ACCOUNT_EMAIL,scope:"https://www.googleapis.com/auth/spreadsheets",aud:"https://oauth2.googleapis.com/token",exp:now+3600,iat:now}));
  const si = `${hdr}.${clm}`;
  const der = Uint8Array.from(atob(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace("-----BEGIN PRIVATE KEY-----","").replace("-----END PRIVATE KEY-----","").replace(/\s/g,"")),c=>c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8",der,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(si))))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  const r = await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:`${si}.${sig}`})});
  return (await r.json()).access_token;
}
