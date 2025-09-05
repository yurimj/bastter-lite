/*
	1-Início da Rotina de Remoção de Conteúdo
*/

const REMOVER = [
  "[class*='container-fluid']", //menu cinza com ícones
  ".list-inline.pull-right.hidden-xs",
  "[data-menu-id='criancas']", //ícone das crianças
  "[data-original-title='Roteiro do iniciante']", //icone do roteiro do iniciante
  "#ultimostopicos", //últimos tópicos
  "#topicossugeridos", //tópicos sugeridos
  "[id^='lateral-par']" //menu lateral
];

let enabled = true;
let styleTag = null;

function buildCSS(selectors) {
  if (!selectors || selectors.length === 0) return "/* no rules */";

  const css = selectors
    .map(s => String(s).trim() ? `${s} { display: none !important; }` : "")
    .join("\n");

  const layout = `
    main { max-width: 1100px; margin: 0 auto; }
    body { overflow-y: scroll; }
  `;

  return css + "\n" + layout;
}

function applyRules(selectors) {
  if (styleTag) styleTag.remove();
  styleTag = document.createElement("style");
  styleTag.id = "bastter-lite-style";
  styleTag.textContent = buildCSS(selectors);
  (document.head || document.documentElement).appendChild(styleTag);
}

function loadAndApply() {
  chrome.storage.sync.get({ selectors: REMOVER, disabled: false }, (res) => {
    enabled = !res.disabled;
    if (enabled) applyRules(res.selectors || REMOVER);
  });
}

function toggleSession() {
  enabled = !enabled;
  if (enabled) loadAndApply();
  else if (styleTag) styleTag.remove();
}

document.addEventListener("keydown", (e) => {
  if (e.altKey && (e.key === "b" || e.key === "B")) toggleSession();
});

// observa mudanças no DOM e reaplica as regras
const mo = new MutationObserver(() => {
  if (enabled) loadAndApply();
});
mo.observe(document.documentElement, { childList: true, subtree: true });

// inicializa
loadAndApply();

/*
	2-Rotina de Ajuste Visual no Cabeçalho
*/

// === Bastter Lite: unir logo + busca + ícones (sem esticar a busca) ===
(function unifyTopbarNoStretch() {
  if (!enabled) return;
  if (document.querySelector('.blite-topbar')) return;

  const firstRow = document.querySelector('.container > .row');
  const logoImg  = document.querySelector('#logo-full');
  const hamb = document.querySelector('.btn.btn-default.pull-left');
  const logo = logoImg ? (logoImg.closest('a') || logoImg) : null;
  const search   = document.querySelector('.input-group[data-menu-id="pesquisa"]');
  const icons    = document.querySelector('ul.navbar-right.list-inline.pull-right');

  if (!firstRow || (!hamb && !logo && !search && !icons)) {
    setTimeout(unifyTopbarNoStretch, 400);
    setTimeout(unifyTopbarNoStretch, 1500);
    return;
  }

  // wrapper com 2 zonas: esquerda (logo) e centro (busca + ícones)
  const bar = document.createElement('div');
  bar.className = 'blite-topbar';
  bar.innerHTML = `
    <div class="blite-left"></div>
    <div class="blite-center"></div>
  `;
  firstRow.parentNode.insertBefore(bar, firstRow);

  const left   = bar.querySelector('.blite-left');
  const center = bar.querySelector('.blite-center');

  if (hamb)   left.appendChild(hamb);
  if (logo)   center.appendChild(logo);
  if (search) center.appendChild(search);
  if (icons)  center.appendChild(icons); // ícones ficam colados na busca

  // estilos: NÃO força largura da busca; só alinha lado a lado
  const st = document.createElement('style');
  st.id = 'bastter-lite-unify-style';
  st.textContent = `
    .blite-topbar{
      display:flex; align-items:center; gap:16px;
      padding:6px 10px;
    }
    .blite-left{ flex:0 0 auto; }
    .blite-center{
      flex:0 0 auto;                /* não esticar */
      display:flex; align-items:center; gap:10px;
    }
    /* não mexer na largura original da busca */
    .blite-center .input-group{ width:auto; }

    /* neutraliza floats/align antigos dos ícones e coloca em linha */
    .blite-center .navbar-right.list-inline.pull-right{
      float:none; margin:0; padding:0;
      display:flex; align-items:center; gap:10px;
    }
    .blite-center .navbar-right.list-inline.pull-right > li{
      float:none; display:flex; align-items:center;
    }
  `;
  (document.head || document.documentElement).appendChild(st);
})();
