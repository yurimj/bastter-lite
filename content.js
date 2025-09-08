/*
	1-Início da Rotina de Remoção de Conteúdo
*/

const REMOVER_GLOBAL = [
  "[class*='container-fluid']", //menu cinza com ícones
  ".list-inline.pull-right.hidden-xs",
  "[data-menu-id='criancas']", //ícone das crianças
  "[data-original-title='Roteiro do iniciante']", //icone do roteiro do iniciante
  "#ultimostopicos", //últimos tópicos
  "#topicossugeridos", //tópicos sugeridos
  "[id^='lateral-par']" //menu lateral
];

const REMOVER_HOME = [
  ".panel-body", //Remoção do corpo dos tópicos v1.0.1
  'div.btn-group.pull-left.margin-bottom5[role="group"][aria-label="..."]', //Remoção do botão responder tópico da home
  '.btn-comprar-voadora', //Botão comprar voadora
  'div.dropdown.pull-left.margin-left-5.margin-bottom5:has(> a[title="Marcar tópico como lendário"])', //Botão Marcar como tópico Lendário
  'div.dropdown.pull-left.margin-bottom5:has(> a.dropdown-toggle.share#btn-compartilhar)' //Botão Compartilhar
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
  chrome.storage.sync.get({ selectors: REMOVER_GLOBAL, disabled: false }, (res) => {
    enabled = !res.disabled;

    // base: sempre os seletores globais (ou os que vierem do storage)
    const base = res.selectors || REMOVER_GLOBAL;

    // considera home como /, /mercado ou /mercado/
    const isHome =
      location.pathname === '/' ||
      location.pathname === '/mercado' ||
      location.pathname === '/mercado/';

    //Debug:
    //console.log('[BLite] path:', location.pathname, 'isHome:', isHome);

    // na home, adiciona os seletores extras; fora dela, só os globais
    const finalSelectors = isHome ? [...base, ...REMOVER_HOME] : base;

    // Para Debug
    // finalSelectors.forEach(sel => {
    //   try {
    //     // mostra se o seletor existe na página
    //     const found = document.querySelector(sel);
    //     console.log(found ? '✔︎' : '—', sel, found || '');
    //   } catch (e) {
    //     console.warn('⚠︎ seletor INVÁLIDO:', sel, e.message);
    //   }
    // });

    const styleEl = document.getElementById('bastter-lite-style');

    //Debug:    
    //console.log('[BLite] style present?', !!styleEl);
    //if (styleEl) console.log('[BLite] css preview:', styleEl.textContent.slice(0, 400), '...');
      

    if (enabled) applyRules(finalSelectors);
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