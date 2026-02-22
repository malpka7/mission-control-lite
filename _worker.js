export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Routes
    if (url.pathname === '/api/version' && request.method === 'GET') {
      const v = await env.VERS.get('version');
      return json({ version: v || 'unknown' });
    }
    if (url.pathname.startsWith('/api/version/update')) {
      // protect updates with token
      const token = url.searchParams.get('token') || (await getBearer(request));
      if (!token || token !== (env.VERSION_UPDATE_TOKEN || '')) {
        return json({ error: 'unauthorized' }, 401);
      }
      const v = url.searchParams.get('v') || (await readJSON(request))?.version;
      if (!v) return json({ error: 'missing version' }, 400);
      await env.VERS.put('version', v);
      return json({ ok: true, version: v });
    }

    if (url.pathname === '/api/state' && request.method === 'GET') {
      const s = await env.STATE.get('state', { type: 'json' });
      return json(s || { agents: [], crons: [] });
    }
    if (url.pathname.startsWith('/api/state/update')) {
      const token = url.searchParams.get('token') || (await getBearer(request));
      if (!token || token !== (env.STATE_UPDATE_TOKEN || '')) {
        return json({ error: 'unauthorized' }, 401);
      }
      const body = await readJSON(request);
      if (!body) return json({ error: 'missing body' }, 400);
      await env.STATE.put('state', JSON.stringify(body));
      return json({ ok: true });
    }

    // Simple password gate for app (Pages + Functions)
    // Prefer env.PASSWORD; fallback to hardcoded default (discouraged)
    const PASSWORD = env.PASSWORD || 'openclaw7';
    const isAsset = await isStaticAsset(url.pathname);

    // Let APIs and static assets bypass auth (so CSS/JS/ico load on login page)
    const bypass = url.pathname.startsWith('/api/') || isAsset;

    if (!bypass) {
      const cookies = parseCookies(request.headers.get('Cookie') || '');
      if (cookies.mc_auth !== sign(PASSWORD)) {
        if (request.method === 'POST' && url.pathname === '/login') {
          const form = await request.formData();
          const pass = form.get('password') + '';
          if (pass === PASSWORD) {
            const res = new Response('', { status: 302, headers: { Location: '/' } });
            res.headers.append('Set-Cookie', cookie('mc_auth', sign(PASSWORD)));
            return res;
          }
          return html(loginHTML('Złe hasło. Spróbuj ponownie.'));
        }
        return html(loginHTML());
      }
      // logout
      if (url.pathname === '/logout') {
        const res = new Response('', { status: 302, headers: { Location: '/' } });
        res.headers.append('Set-Cookie', cookie('mc_auth', '', { maxAge: 0 }));
        return res;
      }
    }

    // Fallthrough to static assets
    return env.ASSETS.fetch(request);
  }
};

function parseCookies(s) {
  const out = {}; s.split(/;\s*/).forEach(p=>{ const i=p.indexOf('='); if(i>0) out[p.slice(0,i)]=decodeURIComponent(p.slice(i+1)); });
  return out;
}
function cookie(name, value, opts={}){
  const parts = [`${name}=${encodeURIComponent(value)}`,'Path=/','HttpOnly','Secure','SameSite=Lax'];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}
function sign(pw){
  // lightweight non-cryptographic marker
  return 'ok:' + btoa(pw).replace(/=+/g,'');
}
async function getBearer(req){
  const a = req.headers.get('Authorization')||''; const m=a.match(/^Bearer\s+(.+)/i); return m?m[1]:null;
}
async function readJSON(req){
  try { return await req.json(); } catch { return null; }
}
function json(obj, status=200){
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
async function isStaticAsset(path){
  return /\.(css|js|png|jpg|jpeg|webp|svg|ico|map|txt)$/i.test(path) || path==='/' || path==='/index.html';
}
function html(body){
  return new Response(`<!doctype html>
<html lang="pl"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Mission Control • Login</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{--bg:#0b1220;--card:rgba(255,255,255,.06);--line:rgba(255,255,255,.12);--text:#e8eefc;--muted:#a9b6d6;--brand:#7c5cff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui}
.wrap{min-height:100dvh;display:grid;place-items:center;padding:24px}
.card{width:100%;max-width:420px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px}
.h{display:flex;gap:10px;align-items:center;margin-bottom:12px}
.logo{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#7c5cff,#b18cff)}
.muted{color:var(--muted);font-size:13px}
.input{width:100%;padding:12px;border-radius:12px;border:1px solid var(--line);background:#0e1424;color:var(--text)}
.btn{width:100%;padding:12px;border-radius:999px;border:1px solid var(--line);background:linear-gradient(135deg,#31d0aa,#2fb89a);color:#0b1220;font-weight:600;cursor:pointer}
.err{color:#ff5577;font-size:13px;margin:-4px 0 8px}
</style></head>
<body><div class="wrap"><form class="card" method="post" action="/login">
  <div class="h"><div class="logo"></div><div><h2 style="margin:0">Mission Control</h2><div class="muted">Wpisz hasło, aby wejść</div></div></div>
  ${body?`<div class="err">${escapeHTML(body)}</div>`:''}
  <input class="input" type="password" name="password" placeholder="Hasło" autofocus />
  <div style="height:12px"></div>
  <button class="btn" type="submit">Zaloguj</button>
</form></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
function escapeHTML(s){ return (s||'').replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
