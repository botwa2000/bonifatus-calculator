/**
 * HTML for the confidential /admin/stats pages (login, code entry, dashboard).
 * Plain server-rendered HTML outside the localized app: no NextAuth, no
 * analytics, no third-party scripts except Turnstile on the login form. The
 * dashboard loads GET /api/admin/usage-stats and renders client-side with
 * inline SVG. Every API string (reviews, comments, referrers) is user-generated
 * and goes through esc() before touching innerHTML.
 */

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  )

const BASE_CSS = `
:root{--bg:#f6f5fb;--surface:#fff;--text:#1c1830;--muted:#6b6785;--border:#e6e3f0;--accent:#7c3aed;
  --web:#7c3aed;--ios:#2f80ed;--android:#1e9e5a;--app:#9a96b0;--parent:#2f80ed;--child:#1e9e5a;
  --quick:#7c3aed;--term:#f59e0b;--settlement:#0ea5e9;--bad:#d64545;--good:#1e9e5a;--grid:#eeecf5;--star:#f5a623}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#100e19;--surface:#1a1727;--text:#e9e7f3;--muted:#9c98b8;--border:#2b2740;
  --web:#a78bfa;--ios:#5aa2ff;--android:#3cc47c;--app:#6f6b88;--parent:#5aa2ff;--child:#3cc47c;--quick:#a78bfa;--term:#fbbf24;
  --settlement:#38bdf8;--grid:#25213a}}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font:14px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:16px}
`

function shell(title: string, body: string, extraHead = '') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
<style>${BASE_CSS}
.auth{max-width:380px;margin:12vh auto 0;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px}
.auth h1{font-size:1.2rem;font-weight:800;margin-bottom:6px}.auth h1 span{color:var(--accent)}
.auth p{color:var(--muted);margin-bottom:16px}
.auth label{display:block;font-weight:600;font-size:.85rem;margin-bottom:6px}
.auth input{width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);font:inherit;margin-bottom:14px}
.auth input.code{font-size:1.4rem;letter-spacing:.4em;text-align:center;font-variant-numeric:tabular-nums}
.auth button{width:100%;padding:10px;border:0;border-radius:10px;background:var(--accent);color:#fff;font:inherit;font-weight:700;cursor:pointer}
.auth .err{background:#fde8e8;color:#8a1c1c;padding:8px 10px;border-radius:8px;margin-bottom:12px;font-size:.85rem}
.auth .ts{margin-bottom:14px;min-height:65px}
.auth a{color:var(--accent)}
</style>
${extraHead}
</head>
<body>${body}</body>
</html>`
}

export function renderLoginPage(
  o: { siteKey?: string; error?: boolean; rateLimited?: boolean } = {}
) {
  const msg = o.rateLimited
    ? '<div class="err">Too many attempts. Try again in an hour.</div>'
    : o.error
      ? '<div class="err">Bot check failed. Please try again.</div>'
      : ''
  const turnstile = o.siteKey
    ? `<div class="ts"><div class="cf-turnstile" data-sitekey="${esc(o.siteKey)}" data-theme="auto"></div></div>`
    : ''
  return shell(
    'Bonifatus Stats',
    `<form class="auth" method="post" action="/admin/stats/login">
  <h1>Bonifatus <span>stats</span></h1>
  <p>Confidential. Enter your email to receive a sign-in code.</p>
  ${msg}
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" required autofocus>
  ${turnstile}
  <button type="submit">Send code</button>
</form>`,
    o.siteKey
      ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>'
      : ''
  )
}

export function renderOtpPage(o: { error?: boolean; rateLimited?: boolean } = {}) {
  const msg = o.rateLimited
    ? '<div class="err">Too many wrong codes. Try again in 15 minutes.</div>'
    : o.error
      ? '<div class="err">That code is wrong or expired.</div>'
      : ''
  return shell(
    'Bonifatus Stats',
    `<form class="auth" method="post" action="/admin/stats/verify">
  <h1>Bonifatus <span>stats</span></h1>
  <p>If that address is allowed, a 6-digit code is on its way. It expires in 10 minutes.</p>
  ${msg}
  <label for="code">Code</label>
  <input id="code" class="code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required autofocus>
  <button type="submit">Sign in</button>
  <p style="margin:14px 0 0;font-size:.85rem"><a href="/admin/stats/login">Send a new code</a></p>
</form>`
  )
}

// The token travels in the URL fragment, which browsers never send to a server,
// so it stays out of proxy and access logs; the script moves it into a POST.
export function renderLinkPage(o: { error?: boolean } = {}) {
  if (o.error) {
    return shell(
      'Bonifatus Stats',
      `<div class="auth">
  <h1>Bonifatus <span>stats</span></h1>
  <div class="err">This sign-in link is invalid, expired or already used.</div>
  <p style="margin:0"><a href="/admin/stats/login">Sign in with an email code</a></p>
</div>`
    )
  }
  return shell(
    'Bonifatus Stats',
    `<form class="auth" id="f" method="post" action="/admin/stats/link">
  <h1>Bonifatus <span>stats</span></h1>
  <p>Signing you in…</p>
  <input type="hidden" name="token" id="t">
  <noscript><div class="err">This link needs JavaScript.</div></noscript>
</form>
<script>(function(){var t=location.hash.slice(1);history.replaceState(null,'',location.pathname);
if(!t){location.replace('/admin/stats/login');return}
document.getElementById('t').value=t;document.getElementById('f').submit()})()</script>`
  )
}

export function renderDashboardPage() {
  return shell(
    'Bonifatus Stats',
    `<div class="wrap">
<header>
  <h1>Bonifatus <span>stats</span></h1>
  <div class="pills" id="range">
    <button data-v="today">Today</button><button data-v="7d">7 days</button><button data-v="30d">30 days</button><button data-v="90d">90 days</button>
  </div>
  <div class="pills" id="platform">
    <button data-v="all">All</button><button data-v="web">Web</button><button data-v="ios">iOS</button><button data-v="android">Android</button>
  </div>
  <button class="btn" id="import" title="Re-run the store imports now">↻ Store import</button>
  <a class="btn" href="/admin/stats/logout">Sign out</a>
</header>
<div class="meta" id="meta">Loading…</div>
<div id="root"></div>
</div>
<script>${DASHBOARD_JS}</script>`,
    `<style>${DASHBOARD_CSS}</style>`
  )
}

const DASHBOARD_CSS = `
.wrap{max-width:1240px;margin:0 auto}
header{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;margin-bottom:16px}
h1{font-size:1.25rem;font-weight:800;margin-right:auto}
h1 span{color:var(--accent)}
.pills{display:flex;gap:4px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:3px}
.pills button{border:0;background:none;color:var(--muted);padding:5px 10px;border-radius:7px;cursor:pointer;font:inherit;font-weight:600}
.pills button.on{background:var(--accent);color:#fff}
.btn{border:1px solid var(--border);background:var(--surface);color:var(--text);padding:6px 10px;border-radius:8px;cursor:pointer;font:inherit;text-decoration:none}
.meta{color:var(--muted);font-size:.8rem;margin-bottom:12px}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:14px}
.tile{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 14px;min-width:0}
.tile .k{color:var(--muted);font-size:.74rem;font-weight:600;text-transform:uppercase;letter-spacing:.03em}
.tile .v{font-size:1.6rem;font-weight:800;margin:2px 0;font-variant-numeric:tabular-nums}
.tile .s{color:var(--muted);font-size:.78rem;overflow-wrap:anywhere}
.up{color:var(--good)} .down{color:var(--bad)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:12px;margin-bottom:12px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px;min-width:0}
.card h2{font-size:.95rem;font-weight:700;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}
.card h2 small{color:var(--muted);font-weight:500;font-size:.75rem}
table{width:100%;border-collapse:collapse;font-size:.84rem}
th{color:var(--muted);font-weight:600;text-align:left;padding:4px 6px;border-bottom:1px solid var(--border)}
td{padding:4px 6px;border-bottom:1px solid var(--grid);vertical-align:top;overflow-wrap:break-word}
td.nw{white-space:nowrap}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.legend{display:flex;gap:12px;font-size:.76rem;color:var(--muted);margin:4px 0 0;flex-wrap:wrap}
.dot{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.bar{height:6px;border-radius:3px;background:var(--accent);opacity:.75}
.muted{color:var(--muted)} .bad{color:var(--bad)} .ok{color:var(--good)}
.stars{color:var(--star);letter-spacing:1px}
.review{border-bottom:1px solid var(--grid);padding:6px 0}
.review:last-child{border:0}
details summary{cursor:pointer;color:var(--accent);font-weight:600;font-size:.84rem;margin:6px 0}
.scroll{max-height:360px;overflow:auto}
.tw{overflow-x:auto}
svg text{fill:var(--muted);font-size:10px}
h2.sec{font-size:1.05rem;font-weight:800;margin:22px 0 4px}
p.secnote{color:var(--muted);font-size:.8rem;margin-bottom:10px}
.badge{display:inline-block;font-size:.7rem;font-weight:700;padding:1px 6px;border-radius:6px;background:var(--grid);color:var(--muted)}
.badge.ok{background:rgba(30,158,90,.15);color:var(--good)}
.big{font-size:2rem;font-weight:800;font-variant-numeric:tabular-nums}
.err{background:#fde8e8;color:#8a1c1c;padding:10px 12px;border-radius:8px;margin-bottom:12px}
@media (max-width:420px){.card{padding:12px}.tile .v{font-size:1.35rem}.tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
`

// Client script (ES5-style, no build step). Kept as a plain string so the page
// needs no bundler output and no external script.
const DASHBOARD_JS = String.raw`
(function () {
  "use strict";
  var COL = { web: "var(--web)", ios: "var(--ios)", android: "var(--android)", app: "var(--app)",
    parent: "var(--parent)", child: "var(--child)", quick: "var(--quick)", term: "var(--term)", settlement: "var(--settlement)" };
  var NAME = { web: "Web", ios: "iOS", android: "Android", app: "App (old build)", parent: "Parents", child: "Children",
    quick: "Single grades", term: "Report cards", settlement: "Settlements" };
  var ACTION = { grade_quick_save: "Grade added", grade_term_save: "Report card saved", grade_term_update: "Report card edited",
    report_scan: "Report card scanned", calculator_preview: "Bonus calculated", settlement_create: "Settlement paid",
    invite_create: "Invite code created", invite_redeem: "Invite redeemed", signup: "Sign-up", signin: "App sign-in",
    market_fetch: "Market data loaded" };
  var state = { range: "7d", platform: "all" };
  try { var saved = JSON.parse(localStorage.getItem("bonifatus-stats") || "{}"); if (saved.range) state.range = saved.range; if (saved.platform) state.platform = saved.platform; } catch (e) {}

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return n == null ? "—" : Number(n).toLocaleString("en-US"); }
  function money(n, cur) { try { return Number(n).toLocaleString("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }); } catch (e) { return fmt(Math.round(n)) + " " + esc(cur); } }
  function pct(x, d) { return x == null ? "—" : (x * 100).toFixed(d == null ? 0 : d) + "%"; }
  function ms(v) { return v == null ? "—" : v >= 1000 ? (v / 1000).toFixed(1) + "s" : v + "ms"; }
  function delta(cur, prev) {
    if (!prev) return cur ? '<span class="muted">new</span>' : "";
    var d = (cur - prev) / prev;
    return '<span class="' + (d >= 0 ? "up" : "down") + '">' + (d >= 0 ? "▲" : "▼") + " " + Math.abs(d * 100).toFixed(0) + "%</span> vs prev";
  }
  function join() { return Array.prototype.filter.call(arguments, Boolean).join(" · "); }
  function stars(n) { var r = Math.round(n || 0); return '<span class="stars">' + "★★★★★".slice(0, r) + '<span class="muted">' + "★★★★★".slice(r) + "</span></span>"; }
  function tile(k, v, s) { return '<div class="tile"><div class="k">' + k + '</div><div class="v">' + v + '</div><div class="s">' + (s || "&nbsp;") + "</div></div>"; }
  function card(title, body, sub) { return '<div class="card"><h2>' + title + (sub ? " <small>" + sub + "</small>" : "") + "</h2>" + body + "</div>"; }
  function table(cols, rows, empty) {
    if (!rows.length) return '<p class="muted">' + (empty || "No data in this range yet.") + "</p>";
    return '<div class="tw"><table><tr>' + cols.map(function (c) { return '<th class="' + (c.n ? "n" : "") + '">' + c.h + "</th>"; }).join("") + "</tr>" +
      rows.map(function (r) { return "<tr>" + cols.map(function (c) { return '<td class="' + (c.n ? "n" : "") + '">' + c.f(r) + "</td>"; }).join("") + "</tr>"; }).join("") + "</table></div>";
  }
  function legend(keys) { return '<div class="legend">' + keys.map(function (k) { return '<span><i class="dot" style="background:' + COL[k] + '"></i>' + NAME[k] + "</span>"; }).join("") + "</div>"; }
  function section(title, note) { return '<h2 class="sec">' + title + "</h2>" + (note ? '<p class="secnote">' + note + "</p>" : '<p class="secnote"></p>'); }
  function dot(p) { return '<i class="dot" style="background:' + (COL[p] || "var(--app)") + '"></i>'; }
  function actionName(a) { return esc(ACTION[a] || a.replace(/_/g, " ")); }

  function lineChart(rows, series, fmtY) {
    var W = 560, H = 150, padL = 34, padB = 18;
    var vals = [];
    rows.forEach(function (r) { series.forEach(function (s) { if (r[s.key] != null) vals.push(r[s.key]); }); });
    if (!vals.length) return '<p class="muted">No snapshots in this range yet — the store import runs nightly.</p>';
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    if (max === min) { max = max + 1; min = Math.max(0, min - 1); }
    var n = rows.length, x = function (i) { return padL + (n === 1 ? (W - padL) / 2 : i * (W - padL - 10) / (n - 1)); };
    var y = function (v) { return (H - padB) - (v - min) / (max - min) * (H - padB - 8); };
    var out = [];
    [min, (min + max) / 2, max].forEach(function (v) {
      out.push('<line x1="' + padL + '" x2="' + W + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="var(--grid)"/>');
      out.push('<text x="' + (padL - 4) + '" y="' + (y(v) + 3).toFixed(1) + '" text-anchor="end">' + (fmtY ? fmtY(v) : fmt(Math.round(v))) + "</text>");
    });
    series.forEach(function (s) {
      var pts = [];
      rows.forEach(function (r, i) { if (r[s.key] != null) pts.push([x(i), y(r[s.key]), r]); });
      if (pts.length > 1) out.push('<polyline fill="none" stroke="' + s.color + '" stroke-width="2" points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") + '"/>');
      pts.forEach(function (p) { out.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="' + s.color + '"><title>' + p[2].day + " " + s.name + ": " + (fmtY ? fmtY(p[2][s.key]) : fmt(p[2][s.key])) + "</title></circle>"); });
    });
    var every = Math.ceil(n / 8);
    rows.forEach(function (r, i) { if (i % every === 0 || n <= 8) out.push('<text x="' + x(i).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + r.day.slice(5) + "</text>"); });
    return '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img">' + out.join("") + "</svg>";
  }

  function stacked(points, keys) {
    var W = 560, H = 150, padL = 30, padB = 18, n = points.length || 1;
    var max = 1;
    points.forEach(function (p) { var t = 0; keys.forEach(function (k) { t += p[k] || 0; }); if (t > max) max = t; });
    var bw = (W - padL) / n, out = [];
    [0, 0.5, 1].forEach(function (f) {
      var y = (H - padB) * (1 - f);
      out.push('<line x1="' + padL + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--grid)"/>');
      out.push('<text x="' + (padL - 4) + '" y="' + (y + 3) + '" text-anchor="end">' + fmt(Math.round(max * f * 10) / 10) + "</text>");
    });
    points.forEach(function (p, i) {
      var y = H - padB, x = padL + i * bw + bw * 0.15, w = Math.max(1, bw * 0.7);
      keys.forEach(function (k) {
        var v = p[k] || 0; if (!v) return;
        var h = (H - padB) * v / max; y -= h;
        out.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + COL[k] + '" rx="1.5"><title>' + p.day + " " + NAME[k] + ": " + fmt(v) + "</title></rect>");
      });
      var every = Math.ceil(n / 8);
      if (i % every === 0 || n <= 8) out.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + p.day.slice(5) + "</text>");
    });
    return '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img">' + out.join("") + "</svg>";
  }
  function keysIn(points, order) {
    var seen = {};
    points.forEach(function (p) { Object.keys(p).forEach(function (k) { if (COL[k] && p[k]) seen[k] = 1; }); });
    return order.filter(function (k) { return seen[k]; });
  }
  var PLAT = ["web", "ios", "android", "app"];
  function chartOrEmpty(points, order, empty) {
    var k = keysIn(points, order);
    return k.length ? stacked(points, k) + legend(k) : '<p class="muted">' + (empty || "Nothing in this range yet.") + "</p>";
  }
  function hbars(rows, label, value, color) {
    if (!rows.length) return '<p class="muted">No data in this range yet.</p>';
    var max = Math.max.apply(null, rows.map(value)) || 1;
    return "<table>" + rows.map(function (r) {
      return '<tr><td style="width:42%">' + label(r) + '</td><td style="width:43%"><div class="bar" style="width:' + (100 * value(r) / max).toFixed(1) + "%" + (color ? ";background:" + color : "") + '"></div></td><td class="n">' + fmt(value(r)) + "</td></tr>";
    }).join("") + "</table>";
  }
  function ago(ts) {
    var s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + "m ago";
    if (s < 86400) return Math.round(s / 3600) + "h ago";
    return Math.round(s / 86400) + "d ago";
  }

  function render(d) {
    var k = d.kpis.cur, kp = d.kpis.prev, st = d.store, rv = st.reviews, h = d.health, rec = d.records;
    var dlIos = st.downloads.ios || 0, dlAnd = st.downloads.android || 0;
    var dlPrev = (st.prevDownloads.ios || 0) + (st.prevDownloads.android || 0);
    var failRate = k.actions ? k.actionsFailed / k.actions : null;
    var html = [];

    // ── Headline tiles
    html.push('<div class="tiles">' +
      tile("Active users", fmt(k.activeUsers), join("≈ " + (k.avgDailyUsers < 10 ? k.avgDailyUsers.toFixed(1) : fmt(Math.round(k.avgDailyUsers))) + "/day", delta(k.activeUsers, kp.activeUsers))) +
      tile("New accounts", fmt(k.newAccounts), join(fmt(k.newParents) + " parents", fmt(k.newChildren) + " children", delta(k.newAccounts, kp.newAccounts))) +
      tile("Grades entered", fmt(k.quickGrades + k.termGrades), join(fmt(k.quickGrades) + " single", fmt(k.termGrades) + " report cards", delta(k.quickGrades + k.termGrades, kp.quickGrades + kp.termGrades))) +
      tile("Settlements", fmt(k.settlements), join(k.settledByCurrency.map(function (c) { return money(c.amount, c.currency); }).join(" · ") || "none", delta(k.settlements, kp.settlements))) +
      tile("Families connected", fmt(k.newConnections), delta(k.newConnections, kp.newConnections) || "&nbsp;") +
      tile("Core actions", fmt(k.actions), join(failRate == null ? "" : '<span class="' + (failRate > 0.02 ? "bad" : "") + '">' + pct(failRate, 1) + " failed</span>", delta(k.actions, kp.actions))) +
      tile("New installs", fmt(k.newInstalls), join("apps + consented web", delta(k.newInstalls, kp.newInstalls))) +
      (d.platform === "web" ? "" : tile("Downloads", fmt(dlIos + dlAnd), ["iOS " + fmt(dlIos), "Android " + fmt(dlAnd), delta(dlIos + dlAnd, dlPrev)].filter(Boolean).join(" · "))) +
      (rv ? Object.keys(rv.perPlatform).map(function (p) {
        var t = rv.perPlatform[p], gained = t.ratingsAtStart == null ? null : t.ratings - t.ratingsAtStart;
        return tile(p === "ios" ? "App Store rating" : "Google Play rating", t.avg ? t.avg.toFixed(2) + " ★" : "—",
          fmt(t.ratings) + (t.ratingsIsWrittenOnly ? " written reviews" : " ratings") + (gained ? ' · <span class="up">+' + fmt(gained) + "</span> in range" : ""));
      }).join("") + (Object.keys(rv.perPlatform).length > 1 ? tile("Store ratings total", fmt(rv.total), rv.avg ? stars(rv.avg) + " " + rv.avg.toFixed(2) + " weighted" : "no ratings yet") : "") : "") +
      tile("In-app rating", d.feedback.app.avg ? d.feedback.app.avg.toFixed(2) + " ★" : "—", fmt(d.feedback.app.n) + " ratings in range") +
      tile("Retention", pct(d.retention.d1) + " / " + pct(d.retention.d7), "D1 / D7 · cohorts " + fmt(d.retention.d1Base) + " / " + fmt(d.retention.d7Base)) +
      "</div>");

    // ── Store ratings
    if (rv) {
      var maxH = 1;
      Object.keys(rv.perPlatform).forEach(function (p) { var hh = rv.perPlatform[p].histogram || {}; Object.keys(hh).forEach(function (x) { if (hh[x] > maxH) maxH = hh[x]; }); });
      var storeCards = Object.keys(rv.perPlatform).map(function (p) {
        var t = rv.perPlatform[p], hh = t.histogram || {};
        var gained = t.ratingsAtStart == null ? null : t.ratings - t.ratingsAtStart;
        var avgMove = t.avgAtStart != null && t.avg != null ? t.avg - t.avgAtStart : null;
        var histRows = t.histogramSource ? [5, 4, 3, 2, 1].map(function (s) {
          var v = hh[s] || 0;
          return '<tr><td class="nw">' + s + ' <span class="stars">★</span></td><td style="width:70%"><div class="bar" style="width:' + (100 * v / maxH).toFixed(1) + '%;background:var(--star)"></div></td><td class="n">' + fmt(v) + "</td></tr>";
        }).join("") : "";
        var note = t.histogramSource ? "" : p === "android"
          ? '<p class="muted" style="margin-top:6px">Google Play shows no public rating yet — it appears once enough people have rated the app.</p>'
          : '<p class="muted" style="margin-top:6px">Apple publishes only the count and average; the star split comes from written reviews (needs the App Store Connect key).</p>';
        return card(p === "ios" ? "App Store" : "Google Play",
          '<p><span class="big">' + (t.avg ? t.avg.toFixed(2) : "—") + "</span> " + (t.avg ? stars(t.avg) : "") + "</p>" +
          '<p class="muted" style="margin-bottom:8px">' + fmt(t.ratings) + (t.ratingsIsWrittenOnly ? " written reviews" : " ratings") +
          (gained != null ? " · " + (gained > 0 ? '<span class="up">+' + fmt(gained) + "</span>" : "±0") + " in range" : "") +
          (avgMove ? " · avg " + (avgMove > 0 ? '<span class="up">▲' : '<span class="down">▼') + Math.abs(avgMove).toFixed(2) + "</span>" : "") +
          " · " + fmt(t.written) + " written (" + fmt(t.writtenPeriod) + " new)" +
          (t.repliedKnown ? " · replied " + fmt(t.replied) + "/" + fmt(t.repliedKnown) : "") +
          (t.activeDevices != null ? " · " + fmt(t.activeDevices) + " active devices" : "") + "</p>" +
          (histRows ? "<table>" + histRows + "</table>" : "") +
          (t.histogramSource ? '<p class="muted" style="font-size:.75rem;margin-top:4px">distribution: ' + esc(t.histogramSource) + "</p>" : "") + note,
          p === "ios" ? "all App Store storefronts" : "public Play listing");
      }).join("");
      var trendSeries = [];
      if (rv.perPlatform.ios) trendSeries.push({ key: "ios_count", color: "var(--ios)", name: "App Store ratings" });
      if (rv.perPlatform.android) trendSeries.push({ key: "android_count", color: "var(--android)", name: "Google Play ratings" });
      var avgSeries = trendSeries.map(function (x) { return { key: x.key.replace("_count", "_avg"), color: x.color, name: x.name.replace("ratings", "average") }; });
      var recentRv = rv.recent.length ? rv.recent.map(function (r) {
        return '<div class="review">' + dot(r.platform) + stars(r.rating) + ' <span class="muted">' + esc(String(r.created_at).slice(0, 10)) + " " + esc(r.territory || r.lang || "") + (r.app_version ? " v" + esc(r.app_version) : "") + "</span> " +
          (r.replied === true ? '<span class="badge ok">replied</span>' : r.replied === false ? '<span class="badge">no reply</span>' : "") +
          (r.title ? "<br><b>" + esc(r.title) + "</b>" : "") + (r.body ? "<br>" + esc(r.body) : "") + "</div>";
      }).join("") : '<p class="muted">No written reviews imported yet (iOS needs the App Store Connect key; Android needs the Play service account).</p>';
      html.push(section("App Store &amp; Google Play ratings") + '<div class="grid">' + storeCards +
        card("Rating count over time", lineChart(rv.trend, trendSeries) + legend(Object.keys(rv.perPlatform)), "daily snapshot") +
        card("Average over time", lineChart(rv.trend, avgSeries, function (v) { return Number(v).toFixed(2); }) + legend(Object.keys(rv.perPlatform))) +
        (rv.iosCountries.length ? card("App Store ratings by country", hbars(rv.iosCountries, function (r) { return esc(r.country); }, function (r) { return r.n; }, "var(--star)")) : "") +
        card("Latest written reviews", '<div class="scroll">' + recentRv + "</div>") +
        "</div>");
    }

    // ── Users & activity (tracked)
    html.push(section("Users &amp; activity", "Tracked since " + (d.trackingSince ? esc(d.trackingSince.slice(0, 10)) : "— (nothing recorded yet)") + ". Signed-in people count once across devices; anonymous web visitors count once per day."));
    var fails = d.series.actions.reduce(function (a, p) { return a + p._fail; }, 0);
    html.push('<div class="grid">' +
      card("Active users per day", chartOrEmpty(d.series.activeUsers, PLAT), "accounts + app installs + web visitors") +
      card("Core actions per day", chartOrEmpty(d.series.actions, PLAT), fmt(fails) + " failed in range") +
      (d.platform === "web" ? "" : card("Downloads per day", chartOrEmpty(d.series.downloads, ["ios", "android"], "Needs the store sales feeds (see Store imports below)."), "App Store + Google Play")) +
      "</div>");

    // ── Accounts & data (records)
    var t = rec.totals, a = rec.activation;
    html.push(section("Accounts &amp; data", "Straight from the product tables — exact for all time, all platforms (these rows carry no platform)."));
    html.push('<div class="grid">' +
      card("Totals", "<table>" +
        "<tr><td>Accounts</td><td class=\"n\">" + fmt(t.accounts) + ' <span class="muted">' + fmt(t.parents) + " parents · " + fmt(t.children) + " children</span></td></tr>" +
        "<tr><td>Email not verified</td><td class=\"n\">" + fmt(t.unverified) + "</td></tr>" +
        "<tr><td>Deactivated</td><td class=\"n\">" + fmt(t.inactive) + "</td></tr>" +
        "<tr><td>Families (parents with a linked child)</td><td class=\"n\">" + fmt(t.families) + ' <span class="muted">' + fmt(t.connections) + " links</span></td></tr>" +
        "<tr><td>Children with at least one grade</td><td class=\"n\">" + fmt(t.children_with_grades) + ' <span class="muted">of ' + fmt(t.children) + "</span></td></tr>" +
        "<tr><td>Single grades</td><td class=\"n\">" + fmt(t.quick_grades) + "</td></tr>" +
        "<tr><td>Report cards</td><td class=\"n\">" + fmt(t.term_grades) + ' <span class="muted">' + fmt(t.subject_grades) + " subject grades</span></td></tr>" +
        "<tr><td>Settlements</td><td class=\"n\">" + fmt(t.settlements) + "</td></tr></table>", "all time") +
      card("Sign-ups per day", chartOrEmpty(rec.signupsPerDay, ["parent", "child"], "No sign-ups in this range."),
        "activation: " + (a.children ? pct(a.childrenGraded / a.children) : "—") + " of new children entered a grade · " + (a.signups ? pct(a.connected / a.signups) : "—") + " of new accounts linked a family") +
      card("Grades &amp; settlements per day", chartOrEmpty(rec.gradesPerDay.map(function (g, i) { var s = rec.settlementsPerDay[i] || {}; return Object.assign({}, g, { settlement: s.settlement || 0 }); }), ["quick", "term", "settlement"], "No grades or settlements in this range.")) +
      card("Grading systems used", hbars(rec.gradingSystems, function (r) { return esc(r.system); }, function (r) { return r.n; }), "grades entered in range") +
      "</div>");

    // ── Usage
    html.push(section("What people do"));
    html.push('<div class="grid">' +
      card("Core actions", table([
        { h: "Action", f: function (r) { return actionName(r.action); } },
        { h: "Total", n: 1, f: function (r) { return fmt(r.n); } },
        { h: "OK", n: 1, f: function (r) { return pct(r.n ? r.ok / r.n : null) ; } },
        { h: "Fail", n: 1, f: function (r) { return r.fail ? '<span class="bad">' + fmt(r.fail) + "</span>" : "0"; } },
        { h: "p50", n: 1, f: function (r) { return ms(r.p50); } },
        { h: "p95", n: 1, f: function (r) { return ms(r.p95); } },
        { h: "Web", n: 1, f: function (r) { return fmt(r.web); } },
        { h: "iOS", n: 1, f: function (r) { return fmt(r.ios); } },
        { h: "Android", n: 1, f: function (r) { return fmt(r.android); } },
        { h: "Old app", n: 1, f: function (r) { return fmt(r.app); } }], d.usage.core), "server-side, every request; rejected = invalid / denied / rate-limited") +
      card("Tracked events", table([
        { h: "Event", f: function (r) { return esc(r.e.replace(/_/g, " ")); } },
        { h: "Total", n: 1, f: function (r) { return fmt(r.a.total); } },
        { h: "Web", n: 1, f: function (r) { return fmt(r.a.web); } },
        { h: "iOS", n: 1, f: function (r) { return fmt(r.a.ios); } },
        { h: "Android", n: 1, f: function (r) { return fmt(r.a.android); } }],
        Object.keys(d.usage.events).sort(function (x, y) { return d.usage.events[y].total - d.usage.events[x].total; }).map(function (e) { return { e: e, a: d.usage.events[e] }; }))) +
      card("App screens", table([
        { h: "Screen", f: function (r) { return esc(r.screen); } },
        { h: "Views", n: 1, f: function (r) { return fmt(r.n); } },
        { h: "Users", n: 1, f: function (r) { return fmt(r.users); } }], d.usage.screens, "No app screen views yet (needs the app release with usage stats).")) +
      card("Web pages", '<div class="scroll">' + table([
        { h: "Page", f: function (r) { return esc(r.screen); } },
        { h: "Views", n: 1, f: function (r) { return fmt(r.n); } },
        { h: "Visitors", n: 1, f: function (r) { return fmt(r.users); } }], d.usage.pages) + "</div>") +
      "</div>");

    // ── Content
    html.push(section("What people work on"));
    html.push('<div class="grid">' +
      card("Top subjects", '<div class="scroll">' + table([
        { h: "Subject", f: function (r) { return esc(r.subject); } },
        { h: "Grades", n: 1, f: function (r) { return fmt(r.n); } },
        { h: "Web", n: 1, f: function (r) { return fmt(r.web); } },
        { h: "iOS", n: 1, f: function (r) { return fmt(r.ios); } },
        { h: "Android", n: 1, f: function (r) { return fmt(r.android); } },
        { h: "Untracked", n: 1, f: function (r) { return fmt(r.other); } }], d.content.subjects) + "</div>", "grades entered in range; platform from the request that saved them") +
      card("Where actions start", table([
        { h: "Action", f: function (r) { return actionName(r.action); } },
        { h: "Entry point", f: function (r) { return esc(r.source); } },
        { h: "OK", n: 1, f: function (r) { return fmt(r.n); } }], d.content.sources), "X-Source sent by the app / web button") +
      card("Latest feedback &amp; messages", '<div class="scroll">' + (d.content.latestText.length ? d.content.latestText.map(function (c) {
        return '<div class="review">' + dot(c.platform) + (c.rating ? stars(c.rating) + " " : "") + '<span class="badge">' + esc(c.kind) + '</span> <span class="muted">' + ago(c.ts) + " " + esc(c.country || "") + " " + esc(c.lang || "") + "</span><br>" + esc(c.comment) + "</div>";
      }).join("") : '<p class="muted">No feedback comments or contact messages in the last 30 days.</p>') + "</div>", "raw text kept 30 days") +
      "</div>");

    // ── Acquisition
    var ac = d.acquisition, inv = ac.invites;
    html.push(section("Where users come from"));
    html.push('<div class="grid">' +
      card("Visit sources", table([
        { h: "Source", f: function (r) { return esc(r.source) + (r.medium ? ' <span class="muted">' + esc(r.medium) + "</span>" : ""); } },
        { h: "Campaign", f: function (r) { return esc(r.campaign || ""); } },
        { h: "Visits", n: 1, f: function (r) { return fmt(r.n); } }], ac.visits, "No referred visits in this range."), "referrer domain / UTM") +
      card("New installs by source", table([
        { h: "", f: function (r) { return dot(r.platform); } },
        { h: "Source", f: function (r) { return esc(r.source) + (r.campaign ? ' <span class="muted">' + esc(r.campaign) + "</span>" : ""); } },
        { h: "Installs", n: 1, f: function (r) { return fmt(r.n); } }], ac.installs), "first touch; Android via Play Install Referrer") +
      card("Family invites", '<div class="tiles" style="grid-template-columns:repeat(auto-fit,minmax(90px,1fr));margin:0">' +
        tile("Created", fmt(inv.created)) + tile("Shared", fmt(inv.shared)) + tile("Opened", fmt(inv.opened)) + tile("Redeemed", fmt(inv.redeemed)) + tile("New children", fmt(inv.newChildren)) + "</div>",
        "codes created → link/QR opened → redeemed") +
      card("Store sources", table([
        { h: "", f: function (r) { return dot(r.platform); } },
        { h: "Source / campaign", f: function (r) { return esc(String(r.metric).replace(/^src:/, "").replace(/^cmp:/, "campaign: ").replace(/^ref:/, "referrer: ")); } },
        { h: "Downloads", n: 1, f: function (r) { return fmt(r.n); } }], ac.store, "Needs the App Store Analytics / Play reports feeds (see Store imports below)."), "App Store Analytics · Play acquisition") +
      "</div>");

    // ── Feedback
    var fb = d.feedback, app = fb.app;
    var maxDist = Math.max.apply(null, app.distribution.map(function (x) { return x.n; })) || 1;
    var dist = app.distribution.slice().reverse().map(function (x) {
      return '<tr><td class="nw">' + x.rating + ' <span class="stars">★</span></td><td style="width:70%"><div class="bar" style="width:' + (100 * x.n / maxDist).toFixed(1) + '%;background:var(--star)"></div></td><td class="n">' + fmt(x.n) + "</td></tr>";
    }).join("");
    var appBody = app.n
      ? '<p style="margin-bottom:6px"><b style="font-size:1.4rem">' + app.avg.toFixed(2) + "</b> " + stars(app.avg) + ' <span class="muted">' + fmt(app.n) + " ratings" +
        (app.prevN ? " · prev " + (app.prevAvg ? app.prevAvg.toFixed(2) + " ★ (" + fmt(app.prevN) + ")" : "—") : "") +
        " · web " + fmt(app.byPlatform.web) + " · iOS " + fmt(app.byPlatform.ios) + " · Android " + fmt(app.byPlatform.android) + "</span></p><table>" + dist + "</table>"
      : '<p class="muted">No in-app ratings in this range yet (parents rate via Settings → Rate Bonifatus).</p>';
    var rd = fb.redo;
    var signals = "<table>" +
      "<tr><td>Contact messages</td><td class=\"n\">" + fmt(fb.contact.n) + "</td></tr>" +
      "<tr><td>Store review prompt shown → store opened</td><td class=\"n\">" + fmt(fb.reviewPrompts.shown) + " → " + fmt(fb.reviewPrompts.storeOpened) + "</td></tr>" +
      "<tr><td>Feedback form opened</td><td class=\"n\">" + fmt(fb.reviewPrompts.feedbackOpened) + "</td></tr>" +
      '<tr><td>Scans per saved report card <span class="muted">(re-scans = OCR trouble)</span></td><td class="n">' + (rd.saves ? (rd.scans / rd.saves).toFixed(2) : "—") + ' <span class="muted">' + fmt(rd.scans) + "/" + fmt(rd.saves) + "</span></td></tr>" +
      '<tr><td>Report cards edited after saving</td><td class="n">' + (rd.saves ? pct(rd.edits / rd.saves) : "—") + ' <span class="muted">' + fmt(rd.edits) + "</span></td></tr></table>";
    html.push(section("Feedback &amp; ratings") + '<div class="grid">' +
      card("In-app rating", appBody, "parents, 1–5 ★") +
      card("Result ratings", table([
        { h: "Rated", f: function (r) { return actionName(r.action); } },
        { h: "Ratings", n: 1, f: function (r) { return fmt(r.n); } },
        { h: "Avg", n: 1, f: function (r) { return r.avg == null ? "—" : r.avg.toFixed(2) + " ★"; } }], fb.results, "No result ratings in this range yet."), "one tap after a scan / calculation") +
      card("Other signals", signals) +
      "</div>");

    // ── Health
    html.push(section("Health &amp; imports"));
    html.push('<div class="grid">' +
      card("Backends", table([
        { h: "Provider", f: function (r) { return esc(r.provider); } },
        { h: "Requests", n: 1, f: function (r) { return fmt(r.n); } },
        { h: "OK", n: 1, f: function (r) { return pct(r.n ? r.ok / r.n : null, 1); } },
        { h: "p50", n: 1, f: function (r) { return ms(r.p50); } },
        { h: "p95", n: 1, f: function (r) { return ms(r.p95); } }], h.providers) +
        '<p class="muted" style="margin-top:8px">Today: FMP market API <b>' + fmt(h.quota.fmpToday) + "</b> / " + fmt(h.quota.fmpLimit) + " requests · OCR scans <b>" + fmt(h.quota.scansToday) + "</b></p>") +
      card("Outcomes", hbars(h.outcomes, function (r) { return '<span class="' + (r.outcome === "ok" ? "ok" : r.outcome === "fail" ? "bad" : "") + '">' + esc(r.outcome) + "</span>"; }, function (r) { return Number(r.n); }) +
        "<details><summary>Bot check (Turnstile) per day</summary>" + table([
          { h: "Day", f: function (r) { return esc(r.day.slice(5)); } },
          { h: "Passed", n: 1, f: function (r) { return fmt(r.ok); } },
          { h: "Blocked", n: 1, f: function (r) { return r.blocked ? '<span class="bad">' + fmt(r.blocked) + "</span>" : "0"; } }], h.botGate) + "</details>") +
      card("Countries", hbars(h.countries, function (r) { return esc(r.country); }, function (r) { return Number(r.users); }), "people") +
      card("Languages", hbars(h.languages, function (r) { return esc(r.lang); }, function (r) { return Number(r.users); }), "people") +
      card("App versions", table([
        { h: "", f: function (r) { return dot(r.platform); } },
        { h: "Version", f: function (r) { return esc(r.app_version); } },
        { h: "Installs", n: 1, f: function (r) { return fmt(r.installs); } }], h.versions, "Needs the app release with usage stats.")) +
      card("Store imports", table([
        { h: "Feed", f: function (r) { return '<span style="white-space:nowrap">' + esc(r.source) + "</span>"; } },
        { h: "", f: function (r) { return r.ok ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>'; } },
        { h: "Last run", f: function (r) { return '<span class="muted">' + ago(r.ran_at) + "</span>"; } },
        { h: "Detail", f: function (r) { return '<span class="muted">' + esc(r.detail) + "</span>"; } }], h.imports, "Not run yet — first run ~2 min after deploy, then nightly 04:30 UTC."), "nightly 04:30 UTC") +
      "</div>");

    document.getElementById("root").innerHTML = html.join("");
  }

  function setPills() {
    ["range", "platform"].forEach(function (id) {
      Array.prototype.forEach.call(document.querySelectorAll("#" + id + " button"), function (b) { b.classList.toggle("on", b.dataset.v === state[id]); });
    });
  }

  function load() {
    setPills();
    try { localStorage.setItem("bonifatus-stats", JSON.stringify(state)); } catch (e) {}
    document.getElementById("meta").textContent = "Loading…";
    fetch("/api/admin/usage-stats?range=" + state.range + "&platform=" + state.platform, { credentials: "same-origin" })
      .then(function (r) { if (r.status === 401) { location.href = "/admin/stats/login"; throw new Error("auth"); } if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        document.getElementById("meta").textContent = d.from + " → " + d.to + " (UTC) · " + (NAME[d.platform] || "All platforms") + " · updated " + new Date(d.generatedAt).toLocaleTimeString();
        render(d);
      })
      .catch(function (e) { if (e.message !== "auth") { document.getElementById("meta").textContent = ""; document.getElementById("root").innerHTML = '<div class="err">Could not load stats: ' + esc(e.message) + "</div>"; } });
  }

  ["range", "platform"].forEach(function (id) {
    document.getElementById(id).addEventListener("click", function (e) {
      var v = e.target.dataset && e.target.dataset.v; if (!v) return; state[id] = v; load();
    });
  });
  document.getElementById("import").addEventListener("click", function () {
    var b = this; b.disabled = true; b.textContent = "Import started…";
    fetch("/api/admin/usage-stats", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import" }) })
      .then(function () { setTimeout(function () { b.disabled = false; b.textContent = "↻ Store import"; load(); }, 20000); });
  });
  load();
  setInterval(function () { if (!document.hidden) load(); }, 60 * 1000);
})();
`
