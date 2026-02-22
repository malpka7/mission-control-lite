document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const tabs = document.querySelectorAll('.tab');
  const views = document.querySelectorAll('section');
  tabs.forEach((tab, i) => tab.onclick = () => {
    tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
    tab.setAttribute('aria-selected', 'true');
    views.forEach(v => v.classList.add('hidden'));
    views[i].classList.remove('hidden');
    loadTabData(i);
  });

  // Mock OpenClaw data
  const data = {
    tasks: [
      {title: 'Proton cron', owner: 'Ahmed', status: 'open'},
      {title: 'Mission V2', owner: 'Hubert', status: 'doing'},
      {title: 'Expenses check', owner: 'Ahmed', status: 'done'}
    ],
    crons: [
      {id: 'a2a37eea', name: 'Daily expenses', schedule: '0 17 * * * UTC', status: 'ok'}
    ],
    models: ['xai/grok-4-fast (default)', 'openai/gpt-5', 'google/gemini-2.5-flash'],
    skills: ['stealth-browser', 'skillboss', 'opengraph-io', 'weather'],
    agents: ['main (grok)', 'gpt-agent (gpt-5)', 'sub-agents']
  };

  function loadTabData(tabIndex) {
    if (tabIndex === 0) { // Tasks kanban
      ['open', 'doing', 'done'].forEach(status => {
        const col = document.getElementById(status + '-tasks');
        col.innerHTML = data.tasks.filter(t => t.status === status).map(t => 
          `<div class="item"><div class="t">${t.title}</div><div class="s">${t.owner}</div></div>`
        ).join('');
      });
    } else if (tabIndex === 1) { // Crons
      document.getElementById('cron-list').innerHTML = data.crons.map(c => 
        `<li><strong>${c.name}</strong> (${c.schedule}) <span class="pill">${c.status}</span></li>`
      ).join('');
    } else if (tabIndex === 2) { // Models
      document.getElementById('models-list').innerHTML = data.models.map(m => `<li>${m}</li>`).join('');
    } else if (tabIndex === 3) { // Skills
      document.getElementById('skills-list').innerHTML = data.skills.map(s => `<li>${s}</li>`).join('');
    } else if (tabIndex === 4) { // Agents
      document.getElementById('agents-list').innerHTML = data.agents.map(a => `<li>${a}</li>`).join('');
    }
  }

  // Buttons
  document.getElementById('add-task').onclick = () => alert('Task added! (v3 backend)');
  document.getElementById('spawn-agent').onclick = () => {
    const name = document.getElementById('agent-name').value;
    const model = document.getElementById('agent-model').value;
    alert(`Spawned ${name} (${model}) – sessions_spawn mock`);
  };

  loadTabData(0); // Load first tab
});
