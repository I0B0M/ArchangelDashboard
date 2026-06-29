const TARGET = 480;
const WEEKS = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];

function emptyData() {
  return {
    iH: new Array(12).fill(0),
    bH: new Array(12).fill(0),
    iT: new Array(12).fill(0),
    bT: new Array(12).fill(0)
  };
}

function parseDash(rows) {
  let hIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const j = rows[i].join('|').toLowerCase();
    if (j.includes('week') && j.includes('ibrahim hrs')) { hIdx = i; break; }
  }
  if (hIdx < 0) return emptyData();
  const hdr = rows[hIdx].map(c => c.toString().toLowerCase().trim());
  const iHC = hdr.findIndex(c => c === 'ibrahim hrs');
  const iTC = hdr.findIndex(c => c === 'ibrahim tasks');
  const bHC = hdr.findIndex(c => c === 'bryan hrs');
  const bTC = hdr.findIndex(c => c === 'bryan tasks');
  if (iHC < 0 || bHC < 0) return emptyData();
  const iH = [], bH = [], iT = [], bT = [];
  for (let i = hIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const lbl = (r[1] || '').toString().toLowerCase().trim();
    if (lbl === '' || lbl === 'total') continue;
    if (!lbl.includes('week')) continue;
    iH.push(parseFloat(r[iHC]) || 0);
    iT.push(parseFloat(r[iTC]) || 0);
    bH.push(parseFloat(r[bHC]) || 0);
    bT.push(parseFloat(r[bTC]) || 0);
    if (iH.length >= 12) break;
  }
  while (iH.length < 12) { iH.push(0); iT.push(0); bH.push(0); bT.push(0); }
  return { iH, bH, iT, bT };
}

function parseTasks(rows, internName) {
  const tasks = [];
  let hIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const j = rows[i].join('|').toLowerCase();
    if (j.includes('day') && j.includes('task')) { hIdx = i; break; }
  }
  if (hIdx < 0) return tasks;
  const hdr = rows[hIdx].map(c => c.toString().toLowerCase().trim());
  const dayC = hdr.findIndex(c => c === 'day' || c === 'b');
  const dateC = hdr.findIndex(c => c === 'date' || c === 'c');
  const hrsC = hdr.findIndex(c => c === 'hrs' || c === 'hours' || c === 'd');
  const taskC2 = hdr.findIndex(c => c.includes('task'));
  const notesC = hdr.findIndex(c => c.includes('note') || c.includes('link'));

  for (let i = hIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const taskVal = (r[taskC2] || '').toString().trim();
    const dateVal = (r[dateC] || '').toString().trim();
    if (!taskVal || !dateVal) continue;
    if (taskVal.toLowerCase().startsWith('e.g')) continue;
    tasks.push({
      intern: internName,
      date: dateVal,
      day: (r[dayC] || '').toString().trim(),
      hrs: parseFloat(r[hrsC]) || 0,
      task: taskVal,
      notes: (r[notesC] || '').toString().trim()
    });
  }
  return tasks;
}

function parseLogs(rows, internName) {
  const logs = [];
  if (rows.length < 2) return logs;
  const hdr = rows[0].map(c => c.toString().toLowerCase().trim());
  const signC = hdr.findIndex(c => c.includes('sign'));
  const dayC = hdr.findIndex(c => c === 'day');
  const taskC2 = hdr.findIndex(c => c.includes('task'));
  const notesC = hdr.findIndex(c => c.includes('note') || c.includes('link'));
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const dayVal = (r[dayC] || '').toString().trim();
    const taskVal = (r[taskC2] || '').toString().trim();
    if (!dayVal && !taskVal) continue;
    logs.push({
      intern: internName,
      day: dayVal,
      signedIn: signC >= 0 ? (r[signC] || '').toString().trim() : '',
      task: taskVal,
      notes: notesC >= 0 ? (r[notesC] || '').toString().trim() : ''
    });
  }
  return logs;
}

function toggleMode(doc, isLight) {
  isLight = !isLight;
  doc.body.classList.toggle('light', isLight);
  doc.getElementById('modeBtn').textContent = isLight ? '\uD83C\uDF19 Dark' : '\u2600\uFE0F Light';
  return isLight;
}

function switchTab(doc, name) {
  doc.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  doc.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const tabEl = doc.querySelector(`[onclick="switchTab('${name}')"]`);
  if (tabEl) tabEl.classList.add('active');
  const pane = doc.getElementById('pane-' + name);
  if (pane) pane.classList.add('active');
}

function setStatus(doc, id, dotId, txtId, msg, type, showTime) {
  const bar = doc.getElementById(id);
  bar.className = 'status status-' + (type === 'live' ? 'live' : type === 'err' ? 'err' : 'load');
  doc.getElementById(txtId).textContent = msg;
  const dot = doc.getElementById(dotId);
  const bg = type === 'live' ? 'var(--found)' : type === 'err' ? 'var(--biz)' : 'var(--text3)';
  const anim = type === 'live' ? 'pulse 2s infinite' : 'none';
  dot.setAttribute('style', 'background:' + bg + ';animation:' + anim);
  if (showTime) doc.getElementById('sTime').textContent = 'Updated: ' + new Date().toLocaleTimeString();
}

function showMsg(doc, msg, type) {
  const el = doc.getElementById('logMsg');
  el.textContent = msg;
  el.className = 'form-msg form-msg-' + (type === 'ok' ? 'ok' : 'err');
  el.style.display = 'block';
}

function renderTasks(doc, tasks) {
  const tbody = doc.getElementById('taskTbl');
  const empty = doc.getElementById('taskEmpty');
  if (tasks.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    doc.getElementById('taskCount').textContent = '0 tasks';
    return;
  }
  empty.style.display = 'none';
  doc.getElementById('taskCount').textContent = tasks.length + ' task' + (tasks.length !== 1 ? 's' : '');
  tbody.innerHTML = tasks.map(t => `
    <tr>
      <td><span class="${t.intern === 'Ibrahim' ? 'intern-badge-i' : 'intern-badge-b'}">${t.intern}</span></td>
      <td style="white-space:nowrap">${t.date}</td>
      <td>${t.day}</td>
      <td style="font-weight:600;color:var(--text)">${t.hrs}</td>
      <td style="color:var(--text)">${t.task}</td>
      <td style="font-size:11px">${t.notes ? '<a href="' + t.notes + '" style="color:var(--tech);text-decoration:none" target="_blank">' + t.notes.substring(0, 40) + (t.notes.length > 40 ? '...' : '') + '</a>' : ''}</td>
    </tr>
  `).join('');
}

function renderLogs(doc, logs) {
  const tbody = doc.getElementById('logTbl');
  const empty = doc.getElementById('logEmpty');
  if (logs.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td><span class="${l.intern === 'Bryan' ? 'intern-badge-b' : 'intern-badge-i'}">${l.intern}</span></td>
      <td>${l.day}</td>
      <td style="color:var(--found);font-weight:600">${l.signedIn || '\u2014'}</td>
      <td style="color:var(--text)">${l.task}</td>
      <td style="font-size:11px">${l.notes ? '<a href="' + l.notes + '" style="color:var(--tech);text-decoration:none" target="_blank">' + l.notes.substring(0, 40) + (l.notes.length > 40 ? '...' : '') + '</a>' : ''}</td>
    </tr>
  `).join('');
}

function renderAll(doc, d) {
  const tI = d.iH.reduce((a, b) => a + b, 0);
  const tB = d.bH.reduce((a, b) => a + b, 0);
  const tkI = d.iT.reduce((a, b) => a + b, 0);
  const tkB = d.bT.reduce((a, b) => a + b, 0);
  const pI = Math.round(tI / TARGET * 100);
  const pB = Math.round(tB / TARGET * 100);

  doc.getElementById('k1').textContent = tI + ' hrs';
  doc.getElementById('k1s').textContent = pI + '% of 480hr target';
  doc.getElementById('k1b').style.width = Math.min(100, pI) + '%';
  doc.getElementById('k2').textContent = tB + ' hrs';
  doc.getElementById('k2s').textContent = pB + '% of 480hr target';
  doc.getElementById('k2b').style.width = Math.min(100, pB) + '%';
  doc.getElementById('k3').textContent = (tI + tB) + ' hrs';
  doc.getElementById('k3s').textContent = (tkI + tkB) + ' tasks logged';
  doc.getElementById('k3b').style.width = Math.min(100, Math.round((tI + tB) / (TARGET * 2) * 100)) + '%';

  doc.getElementById('sumTbl').innerHTML = [
    { name: 'Ibrahim Chhapra', hrs: tI, tasks: tkI, cls: 'intern-badge-i' },
    { name: 'Bryan Londres', hrs: tB, tasks: tkB, cls: 'intern-badge-b' }
  ].map(r => `<tr>
    <td style="font-weight:600;color:var(--text)"><span class="${r.cls}">${r.name.split(' ')[0]}</span> ${r.name.split(' ')[1]}</td>
    <td>${r.hrs}</td><td>${r.tasks}</td>
    <td><span class="pill-active">Active</span></td>
  </tr>`).join('');

  doc.getElementById('progBars').innerHTML =
    `<div class="pbar-lbl"><span>Ibrahim Chhapra</span><span>${pI}% (${tI}/${TARGET} hrs)</span></div>
     <div class="pbar-track"><div class="pbar-fill" style="background:var(--tech);width:${Math.min(100, pI)}%"></div></div>
     <div class="pbar-lbl"><span>Bryan Londres</span><span>${pB}% (${tB}/${TARGET} hrs)</span></div>
     <div class="pbar-track"><div class="pbar-fill" style="background:var(--edu);width:${Math.min(100, pB)}%"></div></div>`;
}

function buildWeekFilter(doc, tasks) {
  const weeks = new Set();
  tasks.forEach(t => {
    try {
      const d = new Date(t.date);
      if (!isNaN(d)) {
        const diff = Math.floor((d - new Date('2026-06-09')) / (7 * 24 * 3600 * 1000));
        const w = Math.min(11, Math.max(0, diff));
        weeks.add('Week ' + (w + 1).toString().padStart(2, '0'));
      }
    } catch (e) {}
  });
  const sel = doc.getElementById('filterWeek');
  Array.from(weeks).sort().forEach(w => {
    const o = doc.createElement('option');
    o.value = w; o.textContent = w; sel.appendChild(o);
  });
  return Array.from(weeks).sort();
}

function filterTasksLogic(allTasks, intern, week, search) {
  return allTasks.filter(t => {
    if (intern !== 'all' && !t.intern.includes(intern)) return false;
    if (search && !t.task.toLowerCase().includes(search) && !t.notes.toLowerCase().includes(search)) return false;
    return true;
  });
}

function buildExportRows(d, allTasks) {
  const rows = [['Week', 'Ibrahim Hours', 'Bryan Hours', 'Ibrahim Tasks', 'Bryan Tasks', 'Combined Hours']];
  for (let i = 0; i < 12; i++) rows.push(['Week ' + (i + 1), d.iH[i], d.bH[i], d.iT[i], d.bT[i], d.iH[i] + d.bH[i]]);
  if (allTasks.length > 0) {
    rows.push([]);
    rows.push(['Intern', 'Date', 'Day', 'Hours', 'Task', 'Notes']);
    allTasks.forEach(t => rows.push([t.intern, t.date, t.day, t.hrs, t.task, t.notes]));
  }
  return rows;
}

function validateLogInput(day, signedIn, task) {
  if (!day || !signedIn || !task) return 'Please fill in Day, Signed In, and Task.';
  return null;
}

function buildLogUrl(intern, signedIn, day, task, notes, bryanScript, ibrahimScript) {
  const url = (intern === 'bryan' ? bryanScript : ibrahimScript)
    + `?signedIn=${encodeURIComponent(signedIn)}&day=${encodeURIComponent(day)}&task=${encodeURIComponent(task)}&notes=${encodeURIComponent(notes)}`;
  return url;
}

function updateTodayStatus(doc, logs, today) {
  const bryanToday = logs.filter(l => l.intern === 'Bryan' && l.day.toLowerCase() === today.toLowerCase());
  const ibrahimToday = logs.filter(l => l.intern === 'Ibrahim' && l.day.toLowerCase() === today.toLowerCase());
  const el = doc.getElementById('todayStatus');
  if (el) {
    el.innerHTML = [
      { name: 'Bryan Londres', cls: 'intern-badge-b', dotColor: 'var(--edu)', entries: bryanToday },
      { name: 'Ibrahim Chhapra', cls: 'intern-badge-i', dotColor: 'var(--tech)', entries: ibrahimToday }
    ].map(({ name, dotColor, entries }) => `
      <div class="today-row">
        <div style="display:flex;align-items:center">
          <div class="today-dot" style="background:${entries.length ? 'var(--found)' : dotColor};${entries.length ? 'animation:pulse 2s infinite' : ''}"></div>
          <span class="today-name">${name}</span>
        </div>
        ${entries.length
          ? `<span class="today-time">${entries[0].signedIn || 'Logged'}</span>`
          : `<span class="today-missing">No entry yet</span>`}
      </div>
    `).join('');
  }
  return { bryanToday, ibrahimToday };
}

module.exports = {
  TARGET,
  WEEKS,
  emptyData,
  parseDash,
  parseTasks,
  parseLogs,
  toggleMode,
  switchTab,
  setStatus,
  showMsg,
  renderTasks,
  renderLogs,
  renderAll,
  buildWeekFilter,
  filterTasksLogic,
  buildExportRows,
  validateLogInput,
  buildLogUrl,
  updateTodayStatus
};
