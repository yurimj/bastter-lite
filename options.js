
const DEFAULTS = [
  "header",
  "footer",
  "aside",
  ".banner",
  ".banners",
  "[id*='banner']",
  "[class*='banner']",
  ".ads",
  ".ad",
  "[id*='ad']",
  "[class*='ad-']",
  "[class*='-ad']",
  ".cookie",
  ".cookies",
  "#cookie",
  "#cookies",
  "[class*='cookie']",
  ".newsletter",
  "[class*='news']",
  ".share",
  ".social",
  "[class*='share']",
  "[class*='social']",
  ".modal",
  ".popup",
  "[class*='popup']",
  "[id*='popup']",
  ".promo",
  ".promotions",
  ".callout",
  ".breadcrumb",
  ".topbar",
  ".navbar",
  ".nav",
  ".menu",
  "#menu",
  ".sidebar",
  "#sidebar",
  ".sponsored",
  ".parceiros",
  ".parceria",
  ".floating",
  "[class*='floating']",
  ".fixed",
  "[class*='sticky']",
  "#ads",
  "#ad",
  "#pub",
  ".pub"
];
const selectorsEl=document.getElementById("selectors");
const disabledEl=document.getElementById("disabled");
const statusEl=document.getElementById("status");
function toText(list){return (list||[]).join("\n");}
function toList(text){return text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);}
function load(){chrome.storage.sync.get({selectors:DEFAULTS,disabled:false},res=>{selectorsEl.value=toText(res.selectors);disabledEl.checked=res.disabled;});}
function save(){const list=toList(selectorsEl.value);chrome.storage.sync.set({selectors:list,disabled:disabledEl.checked},()=>{statusEl.textContent="Salvo!";setTimeout(()=>{statusEl.textContent="";},1500);});}
document.getElementById("save").addEventListener("click",save);
load();
