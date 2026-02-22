// Minimal client logic: version display + update check fallback
(function(){
  const versionBadge = document.querySelector('#oc-version');
  const checkBtn = document.querySelector('#check-update');

  async function fetchVersion() {
    const cfg = window.MC_CONFIG||{};
    try {
      if (cfg.versionUrl) {
        const r = await fetch(cfg.versionUrl, { cache: 'no-store' });
        const data = await r.json();
        if (data && data.version) {
          versionBadge.textContent = data.version;
          return;
        }
      }
    } catch(e) {
      // silent fallback
    }
    // Fallback text if no backend
    versionBadge.textContent = 'unknown';
  }

  function copyCmd(cmd){
    navigator.clipboard.writeText(cmd).then(()=>{
      const note = document.createElement('div');
      note.className = 'toast';
      note.textContent = 'Skopiowano: ' + cmd;
      document.body.appendChild(note);
      setTimeout(()=> note.remove(), 1800);
    });
  }

  checkBtn?.addEventListener('click', ()=>{
    const menu = document.querySelector('#update-menu');
    menu?.classList.toggle('open');
  });

  document.addEventListener('click', (e)=>{
    if(e.target.matches('[data-copy]')){
      copyCmd(e.target.getAttribute('data-copy'));
    }
  });

  // Agents & Crons render (from state API)
  async function fetchState(){
    try{
      const cfg = window.MC_CONFIG||{};
      if(!cfg.stateUrl) return;
      const r = await fetch(cfg.stateUrl, { cache: 'no-store' });
      const s = await r.json();
      renderAgents(s.agents||[]);
      renderCrons(s.crons||[]);
    }catch(e){/* silent */}
  }
  function renderAgents(list){
    const ul = document.getElementById('agents-list'); if(!ul) return; ul.innerHTML='';
    list.forEach(a=>{ const li=document.createElement('li'); li.textContent=`${a.name||a.id} · ${a.model||''}`; ul.appendChild(li); });
  }
  function renderCrons(list){
    const ul = document.getElementById('cron-list'); if(!ul) return; ul.innerHTML='';
    list.forEach(c=>{ const li=document.createElement('li'); li.textContent=`${c.name||c.id} — ${c.schedule||''}`; ul.appendChild(li); });
  }

  fetchVersion();
  fetchState();
})();
