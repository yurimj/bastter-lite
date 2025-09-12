
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

/*
  3- Tema Black
*/

function bliteApplyDark(on) {
  if (on) {
    document.documentElement.setAttribute('data-blite-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-blite-theme');
  }
}

// Inicializa com o estado salvo
chrome.storage.sync.get({ bliteDark: false }, ({ bliteDark }) => {
  bliteApplyDark(!!bliteDark);
});

// Reage a mudanças
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && 'bliteDark' in changes) {
    bliteApplyDark(!!changes.bliteDark.newValue);
  }
});

// Atalho ALT+D
document.addEventListener('keydown', (e) => {
  if (e.altKey && (e.key === 'd' || e.key === 'D')) {
    chrome.storage.sync.get({ bliteDark: false }, ({ bliteDark }) => {
      chrome.storage.sync.set({ bliteDark: !bliteDark });
    });
  }
});

// //força tema
// function forceNavbarDark() {
//   // só força quando o tema escuro estiver ativo
//   if (document.documentElement.getAttribute('data-blite-theme') !== 'dark') return;

//   const nodes = document.querySelectorAll('nav.navbar.navbar-default, .navbar.navbar-default');
//   nodes.forEach((el) => {
//     el.style.setProperty('background', 'var(--bl-muted)', 'important');
//     el.style.setProperty('background-image', 'none', 'important');
//     el.style.setProperty('border-color', 'var(--bl-border)', 'important');
//     el.style.setProperty('box-shadow', 'none', 'important');
//   });

//   // links/textos dentro da navbar
//   const links = document.querySelectorAll('.navbar.navbar-default a, .navbar.navbar-default .navbar-text, .navbar.navbar-default .navbar-brand');
//   links.forEach((el) => {
//     el.style.setProperty('color', 'var(--bl-bg)', 'important');
//   });
// }

// // chame após aplicar o tema
// chrome.storage.sync.get({ bliteDark: false }, ({ bliteDark }) => {
//   bliteApplyDark(!!bliteDark);
//   forceNavbarDark();
// });

// // reforce quando o tema mudar via options/atalho
// chrome.storage.onChanged.addListener((changes, area) => {
//   if (area === 'sync' && 'bliteDark' in changes) {
//     bliteApplyDark(!!changes.bliteDark.newValue);
//     forceNavbarDark();
//   }
// });

// // e quando o DOM mudar (site injeta coisas depois)
// new MutationObserver(() => forceNavbarDark())
//   .observe(document.documentElement, { childList: true, subtree: true });

// // tenta de novo após delays (pega CSS que entra atrasado)
// setTimeout(forceNavbarDark, 300);
// setTimeout(forceNavbarDark, 1000);
// setTimeout(forceNavbarDark, 2500);



/*
    4- Grid Simplificado dos tópicos
*/

(function () {
  const GRID_ID = "blite-grid-topicos";
  const HR_SELECTOR = 'hr#bloco-topico-inicio.invisivel';
  const TOPIC_LINKS_SELECTOR = 'h2.topico-titulo a[href*="forum"]';
  
  const HEADER_CLASSES = [
    "col-12 col-sm-12 col-md-6 col-lg-6", // Col 1
    "col-12 col-sm-6 col-md-6 col-lg-1",  // Col 2
    "col-12 col-sm-6 col-md-6 col-lg-1",  // Col 3
    "col-12 col-sm-6 col-md-6 col-lg-1",  // Col 4
    "col-12 col-sm-6 col-md-6 col-lg-3"  // Col 5
  ];      


  // Cria ou retorna o grid antes do HR
  function ensureGrid() {
    const hr = document.querySelector(HR_SELECTOR);
    if (!hr) return null;
  
    let grid = document.getElementById(GRID_ID);
    if (!grid) {
      grid = document.createElement("div");
      grid.id = GRID_ID;
  
      // Header (com nomes fixos + tamanhos sincronizados)
      const NOMES_COLUNAS = [
        { html: "Tópico" },
        { html: '<img src="/mercado/images/icone-curtir.svg" class="img-responsive icone-bastter-svg">' },
        { html: '<img src="/mercado/images/icone-voadora.svg" class="img-responsive icone-voadora-svg">' },
        { html: '<i class="fa fa-eye"></i>' },
        { html: "Autor" }
      ];
      
  
      const header = document.createElement("div");
      header.className = "row blite-grid-header";

      for (let i = 0; i < 5; i++) {
        const col = document.createElement("div");
        col.className = HEADER_CLASSES[i];

      
        const conteudo = NOMES_COLUNAS[i];
        if (!conteudo) {
          col.textContent = `Col ${i + 1}`;
        } else if (typeof conteudo.html === "string") {
          col.innerHTML = conteudo.html;
        } else {
          col.textContent = conteudo.html; // fallback, se vier texto puro
        }
      
        header.appendChild(col);
      }
      
  
      grid.appendChild(header);
      hr.parentNode.insertBefore(grid, hr);
    }
  
    return grid;
  }
  

  // Remove todas as linhas geradas anteriormente (mantém apenas o header)
  function clearOldRows(grid) {
    if (!grid) return;
    // mantém o primeiro filho (header)
    while (grid.children.length > 1) {
      grid.removeChild(grid.lastChild);
    }
  }

  // Constrói as rows a partir dos tópicos
  function buildRows() {
    const grid = ensureGrid();
    if (!grid) return;

    clearOldRows(grid);

    const links = document.querySelectorAll(TOPIC_LINKS_SELECTOR);

    links.forEach((a) => {
      // Cria uma linha
      const row = document.createElement("div");
      row.className = "row blite-grid-row"; 

      // Col 1 recebe o link (clone, pra não mexer no DOM original)
      const col1 = document.createElement("div");
      col1.className = "col-12 col-sm-12 col-md-6 col-lg-6";
      const clone = a.cloneNode(true);
      // opcional: abrir em nova aba
      clone.setAttribute("target", "_blank");
      clone.setAttribute("rel", "noopener");
      col1.appendChild(clone);
      row.appendChild(col1);

      // Demais colunas vazias por enquanto
      for (let i = 2; i <= 5; i++) {
        const col = document.createElement("div");

        col.className = HEADER_CLASSES[i - 1] || "col-12"; // fallback seguro

              
        if (i === 2) {
          // busca o container pai do link do tópico
          let qtd = "-"; // valor padrão

          // vamos tentar subir alguns níveis e procurar dentro do bloco do tópico
          let current = a;
          for (let i = 0; i < 5; i++) {
            if (!current.parentElement) break;
            current = current.parentElement;
          
            const btn = current.querySelector('a[id^="qtdCurtiram_"]');
            if (btn) {
              qtd = btn.textContent.trim();
              break;
            }
          }
          
          col.textContent = qtd;
        } else
        if (i === 3) {
          // busca o container pai do link do tópico
          let qtd = "-"; // valor padrão

          // vamos tentar subir alguns níveis e procurar dentro do bloco do tópico
          let current = a;
          for (let i = 0; i < 5; i++) {
            if (!current.parentElement) break;
            current = current.parentElement;
          
            const btn = current.querySelector('a[id^="qtdNaoCurtiram_"]');
            if (btn) {
              qtd = btn.textContent.trim();
              break;
            }
          }
          
          col.textContent = qtd;
        } else 
        if (i === 4) {
          // busca o container pai do link do tópico
          let qtd = "-"; // valor padrão

          let current = a;
          for (let i = 0; i < 5; i++) {
            if (!current.parentElement) break;
            current = current.parentElement;
          
            const btn = current.querySelector('a.btn-visto-count');
            if (btn) {
              qtd = btn.textContent.trim();
              break;
            }
          }
          
          col.textContent = qtd;
        } else
        if (i === 5) {
           

          // busca o container pai do link do tópico
          let qtd = "-"; // valor padrão

          let current = a;
          for (let i = 0; i < 5; i++) {
            if (!current.parentElement) break;
            current = current.parentElement;
          
            const btn = current.querySelector('a.profileLink');
            if (btn) {
              col.innerHTML = btn.outerHTML;
              break;
            }
          }
          
          //col.textContent = qtd;          

        }
      
        row.appendChild(col);
      }
      

      grid.appendChild(row);
    });
  }

  // Debounce pra não reconstruir freneticamente
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  const buildRowsDebounced = debounce(buildRows, 150);

  // Primeira construção
  buildRows();

  // Observa mudanças (scroll infinito, filtros, etc.)
  const obs = new MutationObserver((muts) => {
    // Reconstrói quando aparecer/emudar h2.topico-titulo ou o container dos tópicos
    const changed = muts.some((m) =>
      [...m.addedNodes, ...m.removedNodes].some((n) => {
        if (!(n instanceof HTMLElement)) return false;
        return (
          n.matches?.("h2.topico-titulo, " + HR_SELECTOR) ||
          n.querySelector?.("h2.topico-titulo, " + HR_SELECTOR)
        );
      })
    );
    if (changed) buildRowsDebounced();
  });

  obs.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });

  // expõe manualmente no console se quiser chamar: window.BLiteRebuildGrid()
  window.BLiteRebuildGrid = buildRows;
})();


(function applyGridStyles() {
  const style = document.createElement("style");
  style.id = "blite-grid-style";
  style.textContent = `
    /* Estilo alternado (zebra) nas linhas */
    #blite-grid-topicos > .blite-grid-row:nth-child(odd) {
      background-color: #ffffff !important;
    }

    [data-blite-theme]:not([data-blite-theme="dark"]) #blite-grid-topicos > .blite-grid-row:nth-child(odd) {
      background-color: #bcbdbe !important;
    }

  `;
  document.head.appendChild(style);
})();
