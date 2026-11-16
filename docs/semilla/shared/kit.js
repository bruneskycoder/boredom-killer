/* Kit compartido por los ocho juegos: consulta a Claude, render de texto,
   conversación por turnos y guardado de estado entre versiones. */
(function () {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
  }
  /* Markdown mínimo: párrafos, listas, títulos, negrita y cursiva. */
  function md(src) {
    const out = [];
    let list = null, para = [];
    const flushP = () => { if (para.length) { out.push("<p>" + para.join("<br>") + "</p>"); para = []; } };
    const flushL = () => {
      if (list) { out.push("<" + list.t + ">" + list.items.map((i) => "<li>" + i + "</li>").join("") + "</" + list.t + ">"); list = null; }
    };
    for (const raw of String(src || "").replace(/\r/g, "").split("\n")) {
      const l = raw.trim();
      let m;
      if (!l) { flushP(); flushL(); continue; }
      if ((m = l.match(/^#{1,4}\s+(.*)$/))) { flushP(); flushL(); out.push("<h3>" + inline(m[1]) + "</h3>"); continue; }
      if ((m = l.match(/^[-*•]\s+(.*)$/))) { flushP(); if (!list || list.t !== "ul") { flushL(); list = { t: "ul", items: [] }; } list.items.push(inline(m[1])); continue; }
      if ((m = l.match(/^\d+[.)]\s+(.*)$/))) { flushP(); if (!list || list.t !== "ol") { flushL(); list = { t: "ol", items: [] }; } list.items.push(inline(m[1])); continue; }
      flushL(); para.push(inline(l));
    }
    flushP(); flushL();
    return out.join("");
  }

  /* ---- Claude ---- */
  const MSG = {
    not_granted: "No diste permiso para que esta página consulte a Claude. Sin eso el juego no puede seguir.",
    rate_limited: "Claude está recibiendo demasiados pedidos. Esperá un minuto y reintentá.",
    unavailable: "Claude no está disponible en esta vista. Abrí el artefacto desde claude.ai con tu sesión iniciada.",
  };
  let aiP = null;
  function ai() {
    if (!aiP) {
      const c = window.claude;
      aiP = c && typeof c.use === "function" ? Promise.resolve(c.use("sample")).catch(() => null) : Promise.resolve(null);
    }
    return aiP;
  }
  async function ask(input, opts) {
    opts = opts || {};
    const s = await ai();
    if (!s) { const e = new Error(MSG.unavailable); e.code = "unavailable"; throw e; }
    const o = { cache: false, modelTier: opts.tier || "default" };
    if (opts.onText) o.onText = opts.onText;
    try {
      const r = await s(input, o);
      return String((r && r.text) || "").trim();
    } catch (err) {
      const e = new Error(MSG[err && err.code] || "Algo falló al consultar a Claude. Reintentá.");
      e.code = err && err.code;
      throw e;
    }
  }
  function parseJSON(text) {
    const t = String(text).replace(/```(?:json)?/g, "");
    const a = t.search(/[\[{]/);
    if (a < 0) throw new Error("sin JSON");
    const b = t.lastIndexOf(t[a] === "{" ? "}" : "]");
    return JSON.parse(t.slice(a, b + 1));
  }
  async function askJSON(input, opts) {
    const text = await ask(input, opts);
    try { return parseJSON(text); }
    catch (_) { throw new Error("Claude respondió en un formato inesperado. Reintentá."); }
  }

  function setBusy(busy, scope) {
    (scope || document).querySelectorAll("[data-ai]").forEach((b) => { b.disabled = busy; });
  }

  /* ---- Conversación por turnos ----
     Claude no recuerda nada entre llamadas: en cada turno se manda el
     instructivo (brief) más toda la historia. */
  function chat(cfg) {
    let messages = [];
    let busy = false;

    function bubble(role, html) {
      const d = document.createElement("div");
      d.className = "msg " + role;
      d.innerHTML = html;
      cfg.log.appendChild(d);
      d.scrollIntoView({ block: "nearest" });
      return d;
    }
    const userHTML = (t) => "<p>" + esc(t).replace(/\n/g, "<br>") + "</p>";
    function render() {
      cfg.log.innerHTML = "";
      for (const m of messages) if (!m.hidden) bubble(m.role, m.role === "user" ? userHTML(m.content) : md(m.content));
    }
    function payload() {
      const out = messages.map((m) => ({ role: m.role, content: m.content }));
      out[0] = { role: "user", content: cfg.brief() + "\n\n=====\n\n" + out[0].content };
      return out;
    }
    function lock(b) {
      busy = b;
      setBusy(b);
      if (cfg.form) cfg.form.querySelectorAll("button[type=submit]").forEach((x) => { x.disabled = b; });
    }
    async function run() {
      lock(true);
      const el = bubble("assistant", '<p class="wait">Pensando…</p>');
      try {
        const text = await ask(payload(), { tier: cfg.tier, onText: (t) => { if (t && t.text) el.innerHTML = md(t.text); } });
        el.innerHTML = md(text);
        messages.push({ role: "assistant", content: text });
      } catch (e) {
        el.className = "msg error";
        el.innerHTML = "<p>" + esc(e.message) + "</p>";
        const b = document.createElement("button");
        b.className = "btn ghost"; b.type = "button"; b.textContent = "Reintentar";
        b.onclick = () => { el.remove(); run(); };
        el.appendChild(b);
      }
      lock(false);
      if (cfg.onChange) cfg.onChange();
    }
    function send(text, o) {
      text = String(text || "").trim();
      if (busy || !text) return;
      const hidden = !!(o && o.hidden);
      const last = messages[messages.length - 1];
      cfg.log.querySelectorAll(".msg.error").forEach((x) => x.remove());
      if (last && last.role === "user") last.content += "\n\n" + text; // el turno anterior falló: se suma a ese
      else messages.push({ role: "user", content: text, hidden });
      if (!hidden) bubble("user", userHTML(text));
      if (cfg.onChange) cfg.onChange();
      return run();
    }
    if (cfg.form) {
      cfg.form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const v = cfg.input.value;
        if (busy || !v.trim()) return;
        cfg.input.value = "";
        send(v);
      });
      cfg.input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); cfg.form.requestSubmit(); }
      });
    }
    return {
      send,
      clear() { messages = []; cfg.log.innerHTML = ""; },
      state: () => messages,
      load(m) { messages = Array.isArray(m) ? m : []; render(); },
      userTurns: () => messages.filter((m) => m.role === "user" && !m.hidden).length,
      replies: () => messages.filter((m) => m.role === "assistant").length,
      isBusy: () => busy,
    };
  }

  /* Botones de sugerencia. */
  function chips(box, items, onPick) {
    box.innerHTML = "";
    items.forEach((it) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = it;
      b.onclick = () => onPick(it, b);
      box.appendChild(b);
    });
  }
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* Conserva la partida si la página se actualiza a una versión nueva. */
  function boot(start, snapshot) {
    const h = window.claude && window.claude.hot;
    try { if (h && h.snapshot) h.snapshot(snapshot); } catch (_) {}
    if (h && h.ready) h.ready(start); else start((h && h.data) || {});
  }

  /* Aviso si la página se abre donde Claude no responde. */
  if (document.body && document.body.hasAttribute("data-needs-ai")) {
    ai().then((s) => {
      if (s) return;
      const n = document.createElement("p");
      n.className = "notice"; n.textContent = MSG.unavailable;
      const mast = $(".mast");
      if (mast) mast.after(n);
    });
  }

  window.Kit = { $, esc, md, ai, ask, askJSON, parseJSON, chat, chips, pick, boot, setBusy };
})();
