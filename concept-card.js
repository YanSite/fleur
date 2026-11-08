/* Метка «Концепт» и карточка агентства: один файл на все Концепты.
   Источник и описание: tools/demo/concept-card/; копии в сайтах делает sync.mjs. */
(() => {
  const s = document.currentScript;
  const d = s.dataset;
  // Тексты и адрес связи: одна правка на все сайты.
  const T = {
    // Адрес формы связи. Пусто — кнопки связи нет совсем; значение подставляет sync.mjs из contact.json.
    contactUrl: "",
    projects: "https://yansite.github.io/pokaz/#projects",
    label: "Концепт",
    over: "Концепт · Есть что показать",
    title: "Так онлайн может выглядеть ваша {категория}.",
    text: "Это не сайт реального бизнеса. Мы сделали его, чтобы показать, как проявить то, что у бизнеса уже есть. Название, цены и адрес придуманы.",
    reply: "Если хотите так же для своего бизнеса — ответьте в чате, где получили эту ссылку.",
    talk: "Обсудить ваш бизнес",
    more: "Другие проекты",
    order: "Здесь гость оформил бы заказ.",
    contact: "Здесь гость написал бы в мастерскую.",
    plain: "Здесь гость открыл бы этот раздел.",
    close: "Закрыть",
  };
  // Имя проекта для адреса связи: data-case или папка сайта (/sloi/concept-card.js → sloi).
  const id = d.case || new URL(s.src, location.href).pathname.split("/").slice(-2, -1)[0] || "";
  const sep = T.contactUrl.includes("?") ? "&" : "?";
  const talkHref = T.contactUrl
    ? `${T.contactUrl}${sep}from=pokaz&case=${encodeURIComponent(id)}`
    : "";
  const blank = ' target="_blank" rel="noopener"';
  const dark = d.tone === "dark";
  const pos = d.position || "bl";
  const side = (n, on) =>
    `${n}:var(--cc-${n},${on ? `max(8px,env(safe-area-inset-${n}))` : "auto"});`;
  const at =
    side("top", pos[0] === "t") +
    side("bottom", pos[0] !== "t") +
    side("left", pos[1] !== "r") +
    side("right", pos[1] === "r");

  const host = document.createElement("concept-card");
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>
:host{all:initial;font-family:inherit;--bg:${dark ? "#171412" : "#faf7f2"};--ink:${dark ? "#f4f0ea" : "#1d1a17"};--soft:${dark ? "#b9b1a7" : "#5d564e"};--line:${dark ? "rgba(244,240,234,.28)" : "rgba(29,26,23,.24)"}}
*{box-sizing:border-box;font-family:var(--cc-font,inherit)}
.tag{position:fixed;z-index:2147483000;${at}min-width:44px;min-height:44px;padding:0;border:0;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer}
.tag span{font-size:11px;line-height:1;padding:6px 9px;border-radius:2px;background:var(--bg);color:var(--ink);border:1px solid var(--line)}
.veil{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s}
.veil[hidden]{display:none}
.veil.on{opacity:1}
.card{position:relative;width:100%;max-width:520px;max-height:92dvh;overflow:auto;background:var(--bg);color:var(--ink);padding:28px 24px calc(24px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:12px;outline:0;transform:translateY(100%);transition:transform .35s cubic-bezier(.2,.7,.2,1)}
.on .card{transform:none}
p,h2{margin:0}
.over,.why{font-size:12px;line-height:1.45;color:var(--soft)}
h2{font-size:24px;line-height:1.15;font-weight:500;padding-right:28px;overflow-wrap:anywhere}
.text{font-size:15px;line-height:1.5;color:var(--soft)}
.reply{font-size:18px;line-height:1.4;font-weight:500;margin:6px 0 4px}
a{display:flex;align-items:center;justify-content:center;min-height:52px;padding:8px 20px;font-size:15px;text-align:center;text-decoration:none;border-radius:2px;color:var(--ink);border:1px solid var(--ink)}
a.b1{background:var(--ink);color:var(--bg)}
.x{position:absolute;top:6px;right:6px;width:44px;height:44px;border:0;background:none;color:inherit;font-size:26px;cursor:pointer}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
@media (min-width:760px){.veil{align-items:stretch;justify-content:flex-end}.card{width:420px;max-height:none;padding:56px 36px 36px;justify-content:center;transform:translateX(100%)}}
@media (prefers-reduced-motion:reduce){.veil,.card{transition:none}}
</style>
<button class="tag" type="button" aria-haspopup="dialog"><span>${T.label}</span></button>
<div class="veil" hidden><div class="card" role="dialog" aria-modal="true" aria-labelledby="t" tabindex="-1">
<button class="x" type="button" aria-label="${T.close}">×</button>
<p class="over">${T.over}</p><p class="why" hidden></p>
<h2 id="t">${T.title.replace("{категория}", d.category || "")}</h2>
<p class="text">${d.text || T.text}</p>
<p class="reply">${T.reply}</p>
${talkHref ? `<a class="b1" href="${talkHref}"${blank}>${T.talk}</a>` : ""}
<a href="${T.projects}"${blank}>${T.more}</a>
</div></div>`;
  const $ = (q) => root.querySelector(q);
  const tag = $(".tag"),
    veil = $(".veil"),
    card = $(".card"),
    why = $(".why");
  let back = null,
    hideT = 0;

  const open = (line) => {
    clearTimeout(hideT);
    why.textContent = line || "";
    why.hidden = !line;
    back = document.activeElement;
    veil.hidden = false;
    void veil.offsetWidth;
    veil.classList.add("on");
    card.focus({ preventScroll: true });
  };
  const close = () => {
    if (veil.hidden) return;
    veil.classList.remove("on");
    hideT = setTimeout(() => (veil.hidden = true), 350);
    if (back && back.focus) back.focus({ preventScroll: true });
  };

  tag.onclick = () => open();
  $(".x").onclick = close;
  veil.onclick = (e) => e.target === veil && close();
  // Свайп вниз закрывает шторку (когда она не прокручена).
  let y0 = null;
  card.addEventListener("touchstart", (e) => (y0 = card.scrollTop ? null : e.touches[0].clientY), {
    passive: true,
  });
  card.addEventListener("touchend", (e) => {
    if (y0 !== null && e.changedTouches[0].clientY - y0 > 70 && innerWidth < 760) close();
  });
  // Жесты и клавиши карточки не уходят в сцену сайта.
  for (const t of "wheel touchstart touchmove touchend pointerdown pointermove pointerup click".split(
    " ",
  ))
    host.addEventListener(t, (e) => e.stopPropagation(), { passive: true });
  host.addEventListener("keydown", (e) => {
    if (veil.hidden) return void (/^( |Enter)$/.test(e.key) && e.stopPropagation());
    e.stopPropagation();
    if (e.key === "Escape") return close();
    if (e.key !== "Tab") return;
    const f = [...card.querySelectorAll("button,a")],
      i = f.indexOf(root.activeElement);
    e.preventDefault();
    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  });

  // Кнопки заказа, связи и прочие ссылки Концепта открывают карточку с пояснением:
  // своё у кнопки (data-cc-why) или общее для вида кнопки.
  addEventListener(
    "click",
    (e) => {
      const t = e.target.closest ? e.target : null;
      if (!t || host.contains(t)) return;
      const kind = ["order", "contact", "plain"].find((k) => d[k] && t.closest(d[k]));
      const own = t.closest("[data-cc-why]");
      if (!kind && !own) {
        if (!t.closest("[data-cc-talk]")) return;
        if (talkHref) return void window.open(talkHref, "_blank", "noopener");
      }
      e.preventDefault();
      e.stopPropagation();
      open((own && own.dataset.ccWhy) || T[kind || "plain"]);
    },
    true,
  );

  // Последний кадр: карточка открывается, когда посетитель пытается листать дальше, или через 5 с —
  // что раньше. Один раз за визит (флаг в sessionStorage; без хранилища — до перезагрузки).
  const KEY = "concept-card-final";
  let shown = false;
  try {
    shown = sessionStorage.getItem(KEY) === "1";
  } catch {}
  let atFinal = false,
    since = 0,
    finT = 0,
    lastWheel = 0,
    acc = 0,
    ty = null;
  const finalOpen = () => {
    if (shown || !atFinal || !veil.hidden) return;
    shown = true;
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    clearTimeout(finT);
    open();
  };
  // Хвост жеста, которым посетитель пришёл на кадр, — не попытка листать дальше.
  const fresh = () => atFinal && performance.now() - since > 700;
  addEventListener("concept:final", (e) => {
    clearTimeout(finT);
    atFinal = e.detail !== false;
    if (!atFinal || shown) return;
    since = performance.now();
    finT = setTimeout(finalOpen, 5000);
  });
  addEventListener(
    "wheel",
    (e) => {
      const now = performance.now();
      if (now - lastWheel > 200) acc = 0;
      lastWheel = now;
      if (!fresh() || e.deltaY <= 0) return;
      if ((acc += e.deltaY) > 30) finalOpen();
    },
    { passive: true, capture: true },
  );
  addEventListener("touchstart", (e) => (ty = e.touches[0].clientY), {
    passive: true,
    capture: true,
  });
  addEventListener(
    "touchend",
    (e) => {
      if (ty !== null && fresh() && ty - e.changedTouches[0].clientY > 40) finalOpen();
      ty = null;
    },
    { passive: true, capture: true },
  );
  addEventListener(
    "keydown",
    (e) => fresh() && /^(ArrowDown|PageDown| |End)$/.test(e.key) && finalOpen(),
    true,
  );

  (document.body || document.documentElement).appendChild(host);
})();
