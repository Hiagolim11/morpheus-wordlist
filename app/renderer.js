"use strict";

// ---- estado (a lógica vive em ../wordlist-core.js → window.WL) ----
const words = [], nums = [], activeChars = new Set();
let useComuns = true, usePadroes = false, leetMode = "off", depth = 2, lastLines = [];
const cfg = () => ({ words, nums, leet: leetMode, comuns: useComuns, padroes: usePadroes, depth, chars: [...activeChars] });

const $ = id => document.getElementById(id);
const fmt = n => (!isFinite(n) || n > 1e12) ? ">1 trilhão" : Math.round(n).toLocaleString("pt-BR");
const humanSize = b => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

// ---- window controls (traffic lights) ----
$("wClose").onclick = () => window.desktop.close();
$("wMin").onclick = () => window.desktop.minimize();
$("wMax").onclick = () => window.desktop.maximize();

// ---- tilt 3D do tile do herói ----
const tile = $("tile");
const scene = tile.parentElement;
scene.addEventListener("mousemove", e => {
  const r = scene.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  tile.style.transform = `rotateY(${px * 26}deg) rotateX(${-py * 26}deg)`;
});
scene.addEventListener("mouseleave", () => { tile.style.transform = "rotateY(0) rotateX(0)"; });

// ---- segmented controls (slider deslizante) ----
function setupSeg(el, onPick){
  const slider = el.querySelector(".slider");
  const btns = [...el.querySelectorAll("button")];
  function move(btn){
    slider.style.width = btn.offsetWidth + "px";
    slider.style.transform = `translateX(${btn.offsetLeft - 3}px)`;
  }
  btns.forEach(b => b.onclick = () => {
    btns.forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    el.dataset.value = b.dataset.v;
    move(b);
    onPick(b.dataset.v);
  });
  requestAnimationFrame(() => move(el.querySelector("button.on")));
}
setupSeg($("segDepth"), v => { depth = parseInt(v, 10); updateEstimate(); });
setupSeg($("segLeet"), v => { leetMode = v; updateEstimate(); });

// ---- switches ----
$("swComuns").onclick = function(){ useComuns = !useComuns; this.classList.toggle("on", useComuns); updateEstimate(); };
$("swPadroes").onclick = function(){ usePadroes = !usePadroes; this.classList.toggle("on", usePadroes); updateEstimate(); };

// ---- caracteres especiais ----
const cb = $("charBtns");
WL.SPECIALS.forEach(ch => {
  const b = document.createElement("button");
  b.className = "charbtn"; b.textContent = ch;
  b.onclick = () => { b.classList.toggle("on"); activeChars.has(ch) ? activeChars.delete(ch) : activeChars.add(ch); updateEstimate(); };
  cb.appendChild(b);
});

// ---- chips ----
function renderChips(list, el, empty, onDel){
  if(!list.length){ el.innerHTML = `<span class="empty">${empty}</span>`; return; }
  el.innerHTML = "";
  list.forEach((v, i) => {
    const c = document.createElement("span");
    c.className = "chip";
    c.innerHTML = `<b></b><span class="x">✕</span>`;
    c.querySelector("b").textContent = v;
    c.querySelector(".x").onclick = () => onDel(i);
    el.appendChild(c);
  });
}

function updateEstimate(){
  const est = $("est");
  if(!words.length){ est.className = "estimate"; est.innerHTML = "estimativa: <b>—</b>"; $("gen").disabled = true; return; }
  const { V, total } = WL.estimar(cfg());
  const over = total > WL.HARD_CAP;
  est.className = "estimate " + (over ? "bad" : total < 50000 ? "ok" : "warn");
  est.innerHTML = over
    ? `⚠ ~<b>${fmt(total)}</b> linhas — acima do limite de ${fmt(WL.HARD_CAP)}. Reduza profundidade, leet ou entradas.`
    : `estimativa: até ~<b>${fmt(total)}</b> linhas · ${V} palavras-base`;
  $("gen").disabled = over;
}

function refresh(){
  renderChips(words, $("wordChips"), "nenhuma palavra ainda", i => { words.splice(i, 1); refresh(); });
  renderChips(nums, $("numChips"), "nenhum número ainda", i => { nums.splice(i, 1); refresh(); });
  $("stWords").textContent = words.length;
  updateEstimate();
}

function addWord(){
  const v = $("wordInput").value.trim().toLowerCase();
  if(v && !words.includes(v)) words.push(v);
  $("wordInput").value = ""; $("wordInput").focus(); refresh();
}
function addNum(){
  const v = $("numInput").value.trim();
  if(v && !nums.includes(v)) nums.push(v);
  $("numInput").value = ""; $("numInput").focus(); refresh();
}
$("addWord").onclick = addWord;
$("addNum").onclick = addNum;
$("wordInput").addEventListener("keydown", e => { if(e.key === "Enter") addWord(); });
$("numInput").addEventListener("keydown", e => { if(e.key === "Enter") addNum(); });

// ---- gerar ----
$("gen").onclick = function(){
  const t0 = performance.now();
  const lines = WL.gerar(cfg());
  lastLines = lines;
  $("stCount").textContent = lines.length.toLocaleString("pt-BR");
  $("stSize").textContent = humanSize(lines.reduce((a, l) => a + l.length + 1, 0));

  const prev = $("preview");
  const show = lines.slice(0, 2000);
  prev.textContent = show.join("\n");
  if(lines.length > show.length){
    const more = document.createElement("div");
    more.className = "more";
    more.textContent = `\n… +${(lines.length - show.length).toLocaleString("pt-BR")} linhas (salve para ver todas)`;
    prev.appendChild(more);
  }
  if(!lines.length) prev.innerHTML = '<span class="ph">Nenhuma combinação gerada.</span>';

  $("copy").disabled = $("save").disabled = lines.length === 0;
  this.textContent = `⚡ Gerado em ${Math.round(performance.now() - t0)}ms — gerar de novo`;
};

// ---- salvar (diálogo nativo via main) ----
$("save").onclick = async () => {
  const res = await window.desktop.save(lastLines.join("\n") + "\n");
  if(res.ok){
    const b = $("save"), t = b.textContent;
    b.textContent = "✓ Salvo"; setTimeout(() => b.textContent = t, 1600);
  }
};

// ---- copiar ----
$("copy").onclick = async () => {
  try{
    await navigator.clipboard.writeText(lastLines.join("\n"));
    const b = $("copy"), t = b.textContent;
    b.textContent = "✓ Copiado"; setTimeout(() => b.textContent = t, 1400);
  }catch(e){ /* clipboard indisponível — usar Salvar */ }
};

refresh();
