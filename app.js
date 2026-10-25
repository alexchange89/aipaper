/* AiPaper PWA — calendario e-ink + liste. Dati salvati in localStorage. */
(() => {
  "use strict";
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const ICONS = { warn:"\u26A0", bolt:"\u26A1", star:"\u2605", note:"\u270E" };
  const QUOTES = [
    "Love is all of life; all actions find their resource in love.",
    "The secret of getting ahead is getting started.",
    "Well begun is half done.",
    "Simplicity is the ultimate sophistication."
  ];

  // ---------- stato ----------
  const today = new Date();
  let viewY = today.getFullYear(), viewM = today.getMonth();
  let selDate = ymd(today);
  let activeTab = "todo";

  const DEFAULTS = {
    todo: [
      { t:"Fare nota spese + Controllare accredito Anna", ic:"warn", done:false },
      { t:"Chiedere a Nardozza come procedono i controlli sui beni posseduti", ic:"warn", done:false },
      { t:"Dire a Charbel di considerare il polling di un HH solo <= 5AM", ic:"warn", done:false },
      { t:"Inserire regola per T181 su Beni posseduti", ic:"bolt", done:false },
      { t:"Check HH 100501 x Ale", ic:"star", done:false },
      { t:"Chiamare meccanico per auto", ic:"star", done:false }
    ],
    tasks: [], notes: [], logs: []
  };

  const store = load();
  // events: { "2026-10-15": [{title:"..."}], ... }
  const events = store.events || {};

  // ---------- util ----------
  function ymd(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function dayOfYear(d){ const s=new Date(d.getFullYear(),0,0); return Math.floor((d-s)/86400000); }
  function daysLeft(d){ const e=new Date(d.getFullYear(),11,31); return Math.round((e-d)/86400000); }
  function load(){
    try { const r = JSON.parse(localStorage.getItem("aipaper")||"{}");
      return { lists: Object.assign({}, DEFAULTS, r.lists||{}), events: r.events||{} }; }
    catch(e){ return { lists: JSON.parse(JSON.stringify(DEFAULTS)), events:{} }; }
  }
  function save(){ localStorage.setItem("aipaper", JSON.stringify({ lists: store.lists, events })); }

  // ---------- calendario ----------
  const cells = document.getElementById("cells");
  function renderCal(){
    document.getElementById("monthLabel").textContent = MONTHS[viewM];
    document.getElementById("yearLabel").textContent = viewY;
    cells.innerHTML = "";
    const first = new Date(viewY, viewM, 1);
    // settimana che inizia di lunedì
    let start = (first.getDay()+6)%7;
    const gridStart = new Date(viewY, viewM, 1 - start);
    for (let i=0;i<42;i++){
      const d = new Date(gridStart); d.setDate(gridStart.getDate()+i);
      const out = d.getMonth()!==viewM;
      const key = ymd(d);
      const cell = document.createElement("div");
      cell.className = "cell" + (out?" out":"") + (key===selDate?" sel":"");
      cell.dataset.key = key;
      cell.innerHTML = `<span class="d">${d.getDate()}</span>
        <span class="idx">${dayOfYear(d)}/${daysLeft(d)}</span>`;
      const evs = events[key]||[];
      if (evs.length){
        const dots = document.createElement("div"); dots.className="dots";
        evs.slice(0,3).forEach((e,i)=>{ const s=document.createElement("span"); s.className="dot"+(i%2?" o":""); dots.appendChild(s); });
        cell.appendChild(dots);
        if (evs.length){
          const docs=document.createElement("div"); docs.className="docs";
          const doc=document.createElement("span"); doc.className="doc";
          doc.innerHTML = `\uD83D\uDCC4<span class="badge">${evs.length}</span>`;
          docs.appendChild(doc); cell.appendChild(docs);
        }
      }
      cell.addEventListener("click", ()=>{ selDate=key; renderCal(); renderDay(); });
      cells.appendChild(cell);
    }
  }

  function renderDay(){
    const box = document.getElementById("dayEvents");
    const evs = events[selDate]||[];
    if (!evs.length){
      box.className = "side-body";
      box.innerHTML = `<div class="no-event"><div class="no-event-ic">\uD83D\uDCC5</div><div>Nessun evento</div></div>`;
      return;
    }
    box.className = "side-body has-ev";
    box.innerHTML = evs.map(e=>`<div class="ev">${esc(e.title)}</div>`).join("");
  }

  // ---------- liste ----------
  const listEl = document.getElementById("list");
  function renderList(){
    const items = store.lists[activeTab]||[];
    listEl.innerHTML = items.map((it,i)=>`
      <li class="row ${it.done?"done":""}" data-i="${i}">
        <span class="check" data-check>${it.done?"\u2713":""}</span>
        <span class="badge-ic">${ICONS[it.ic]||ICONS.star}</span>
        <span class="text">${esc(it.t)}</span>
      </li>`).join("") || `<li class="row"><span class="text" style="color:var(--ink-soft)">Nessun elemento. Tocca \u2295 per aggiungere.</span></li>`;
  }
  function esc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }

  // ---------- eventi UI ----------
  document.getElementById("prevMonth").onclick = ()=>{ viewM--; if(viewM<0){viewM=11;viewY--;} renderCal(); };
  document.getElementById("nextMonth").onclick = ()=>{ viewM++; if(viewM>11){viewM=0;viewY++;} renderCal(); };
  document.querySelector('[data-act="today"]').onclick = ()=>{ viewY=today.getFullYear(); viewM=today.getMonth(); selDate=ymd(today); renderCal(); renderDay(); };
  document.querySelector('[data-act="refresh"]').onclick = ()=>{ document.getElementById("quote").textContent = QUOTES[Math.floor(Math.random()*QUOTES.length)]; };
  document.querySelector('[data-act="add-event"]').onclick = ()=>{
    const t = prompt("Titolo evento per "+selDate+":"); if(!t) return;
    (events[selDate] = events[selDate]||[]).push({title:t}); save(); renderCal(); renderDay();
  };

  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
    activeTab=b.dataset.tab;
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
    renderList();
  });

  document.getElementById("addItem").onclick = ()=>{
    const t = prompt("Nuovo elemento ("+activeTab+"):"); if(!t) return;
    (store.lists[activeTab] = store.lists[activeTab]||[]).push({t, ic:"star", done:false});
    save(); renderList();
  };

  listEl.addEventListener("click", (e)=>{
    const row = e.target.closest(".row"); if(!row||row.dataset.i===undefined) return;
    const i = +row.dataset.i; const items = store.lists[activeTab];
    if (e.target.hasAttribute("data-check")){ items[i].done = !items[i].done; save(); renderList(); }
  });

  // ---------- avvio ----------
  renderCal(); renderDay(); renderList();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
})();
