// Minimal client logic: version display + update check fallback
(function(){
  const versionBadge = document.querySelector('#oc-version');
  const checkBtn = document.querySelector('#check-update');

  async function fetchVersion() {
    try {
      if (window.MC_CONFIG && window.MC_CONFIG.versionUrl) {
        const r = await fetch(window.MC_CONFIG.versionUrl, { cache: 'no-store' });
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

  fetchVersion();
})();
