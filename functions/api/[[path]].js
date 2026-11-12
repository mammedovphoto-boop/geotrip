// API личного кабинета GeoTrip (Cloudflare Pages Functions + база D1 с именем DB).
// Адреса: POST /api/register, /api/login, /api/logout, /api/settings, /api/bookings
//         GET  /api/me, /api/bookings
//         Для менеджера: GET /api/admin/bookings, POST /api/admin/status  (заголовок X-Admin-Key = переменная ADMIN_KEY)

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });

const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (n) => toHex(crypto.getRandomValues(new Uint8Array(n)));

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return toHex(bits);
}

function sameHex(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function getCookie(request, name) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}

const SESSION_DAYS = 60;
const cookie = (token, maxAge) => `gt_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

async function startSession(env, userId) {
  const token = randomHex(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, userId, expires).run();
  return cookie(token, SESSION_DAYS * 86400);
}

async function currentUser(env, request) {
  const token = getCookie(request, "gt_session");
  if (!token) return null;
  return env.DB.prepare(
    "SELECT u.id, u.email, u.name, u.phone FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?"
  ).bind(token, new Date().toISOString()).first();
}

const clean = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function onRequest({ request, env, params }) {
  if (!env.DB) return json({ error: "no_database" }, 500);
  const path = (params.path || []).join("/");
  const method = request.method;
  let body = {};
  if (method === "POST") {
    try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }
  }

  // ----- менеджер -----
  if (path.startsWith("admin/")) {
    if (!env.ADMIN_KEY || request.headers.get("X-Admin-Key") !== env.ADMIN_KEY) return json({ error: "forbidden" }, 403);
    if (path === "admin/bookings" && method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT b.*, u.email, u.name AS user_name, u.phone FROM bookings b JOIN users u ON u.id = b.user_id ORDER BY b.id DESC LIMIT 500"
      ).all();
      return json({ items: results });
    }
    if (path === "admin/status" && method === "POST") {
      const status = ["new", "confirmed", "cancelled"].includes(body.status) ? body.status : null;
      if (!status || !Number.isInteger(body.id)) return json({ error: "bad_request" }, 400);
      await env.DB.prepare("UPDATE bookings SET status = ? WHERE id = ?").bind(status, body.id).run();
      return json({ ok: true });
    }
    return json({ error: "not_found" }, 404);
  }

  // ----- клиент -----
  if (path === "register" && method === "POST") {
    const email = clean(body.email, 120).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!isEmail(email) || password.length < 8) return json({ error: "bad_input" }, 400);
    const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (exists) return json({ error: "exists" }, 409);
    const salt = randomHex(16);
    const hash = await hashPassword(password, salt);
    const res = await env.DB.prepare("INSERT INTO users (email, name, phone, pass_hash, pass_salt) VALUES (?, ?, ?, ?, ?)")
      .bind(email, clean(body.name, 120), clean(body.phone, 40), hash, salt).run();
    const setCookie = await startSession(env, res.meta.last_row_id);
    return json({ ok: true }, 200, { "Set-Cookie": setCookie });
  }

  if (path === "login" && method === "POST") {
    const email = clean(body.email, 120).toLowerCase();
    const user = await env.DB.prepare("SELECT id, pass_hash, pass_salt FROM users WHERE email = ?").bind(email).first();
    if (!user) return json({ error: "bad_login" }, 401);
    const hash = await hashPassword(typeof body.password === "string" ? body.password : "", user.pass_salt);
    if (!sameHex(hash, user.pass_hash)) return json({ error: "bad_login" }, 401);
    const setCookie = await startSession(env, user.id);
    return json({ ok: true }, 200, { "Set-Cookie": setCookie });
  }

  if (path === "logout" && method === "POST") {
    const token = getCookie(request, "gt_session");
    if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
  }

  const user = await currentUser(env, request);
  if (!user) return json({ error: "unauthorized" }, 401);

  if (path === "me" && method === "GET") return json({ user });

  if (path === "settings" && method === "POST") {
    await env.DB.prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?").bind(clean(body.name, 120), clean(body.phone, 40), user.id).run();
    return json({ ok: true });
  }

  if (path === "bookings" && method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT id, program, title, days, mode, start, stars, persons, price, status, created_at FROM bookings WHERE user_id = ? ORDER BY id DESC"
    ).bind(user.id).all();
    return json({ items: results });
  }

  if (path === "bookings" && method === "POST") {
    const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
    await env.DB.prepare(
      "INSERT INTO bookings (user_id, program, title, days, mode, start, stars, persons, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(user.id, clean(body.program, 60), clean(body.title, 120), int(body.days, 1, 60), body.mode === "private" ? "private" : "group",
      /^\d{4}-\d{2}-\d{2}$/.test(body.start || "") ? body.start : null, int(body.stars, 1, 5), int(body.persons, 1, 50), int(body.price, 0, 1e7)).run();
    return json({ ok: true });
  }

  return json({ error: "not_found" }, 404);
}
