/* Метка «Концепт» и карточка агентства: один файл на все Концепты.
   Источник и описание: tools/demo/concept-card/; копии в сайтах делает sync.mjs. */
(() => {
  const d = document.currentScript.dataset;
  // Тексты и контакты: одна правка на все сайты.
  const T = {
    telegram: "", // имя без «@»; пусто — кнопка ведёт на «#»
    email: "",
    projects: "https://yansite.github.io/pokaz/#projects",
    label: "Концепт",
    over: "Концепт · Есть что показать",
    title: "Так онлайн может выглядеть ваша {категория}.",
    text: "Это не сайт реального бизнеса. Мы сделали его, чтобы показать, как проявить то, что у бизнеса уже есть. Название и детали придуманы.",
    talk: "Обсудить ваш бизнес",
    hint: "Или просто ответьте в чате, где получили эту ссылку.",
    more: "Другие проекты",
    mail: "Написать на почту",
    subject: "Хочу обсудить свой бизнес",
    order: "Здесь гость оформил бы заказ.",
    contact: "Здесь гость написал бы в мастерскую.",
    close: "Закрыть",
  };
  const tg = (d.telegram ?? T.telegram).replace(/^@/, "");
  const email = d.email ?? T.email;
  const tgHref = tg ? "https://t.me/" + tg : "#";
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
.over,.why,.hint{font-size:12px;line-height:1.45;color:var(--soft)}
h2{font-size:24px;line-height:1.15;font-weight:500;padding-right:28px;overflow-wrap:anywhere}
.text{font-size:15px;line-height:1.5;color:var(--soft)}
a{display:flex;align-items:center;justify-content:center;min-height:52px;padding:8px 20px;font-size:15px;text-align:center;text-decoration:none;border-radius:2px;color:var(--ink);border:1px solid var(--ink)}
a.b1{background:var(--ink);color:var(--bg);margin-top:6px}
a.mail{border:0;min-height:44px;text-decoration:underline}
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
<p class="text">${T.text}</p>
<a class="b1" href="${tgHref}"${tg ? blank : ""}>${T.talk}</a>
<p class="hint">${T.hint}</p>
<a href="${T.projects}"${blank}>${T.more}</a>
${email ? `<a class="mail" href="mailto:${email}?subject=${encodeURIComponent(T.subject)}">${T.mail}</a>` : ""}
</div></div>`;
  const $ = (s) => root.querySelector(s);
  const tag = $(".tag"),
    veil = $(".veil"),
    card = $(".card"),
    why = $(".why");
  let back = null,
    hideT = 0;

  const open = (kind) => {
    clearTimeout(hideT);
    why.textContent = T[kind] || "";
    why.hidden = !T[kind];
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
  veil.onclick = (e) => {
    if (e.target === veil) close();
    else if (e.target.closest('a[href="#"]')) e.preventDefault();
  };
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

  // Кнопки заказа и связи Концепта открывают карточку с пояснением.
  addEventListener(
    "click",
    (e) => {
      const t = e.target.closest ? e.target : null;
      if (!t || host.contains(t)) return;
      const kind = ["order", "contact", "plain"].find((k) => d[k] && t.closest(d[k]));
      if (!kind) {
        if (!t.closest("[data-cc-talk]")) return;
        if (tg) return void window.open(tgHref, "_blank", "noopener");
      }
      e.preventDefault();
      e.stopPropagation();
      open(kind);
    },
    true,
  );

  // Последний кадр: через 1,5 с карточка открывается сама — каждый раз, когда посетитель до него доходит.
  let finT = 0;
  addEventListener("concept:final", (e) => {
    clearTimeout(finT);
    if (e.detail !== false) finT = setTimeout(() => veil.hidden && open(), 1500);
  });

  (document.body || document.documentElement).appendChild(host);
})();
