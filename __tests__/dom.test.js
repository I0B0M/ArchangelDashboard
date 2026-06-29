const {
  toggleMode,
  switchTab,
  setStatus,
  showMsg,
  renderTasks,
  renderLogs,
  renderAll,
  updateTodayStatus
} = require('../src/dashboard');

function createMinimalDOM() {
  document.body.innerHTML = `
    <body>
      <button id="modeBtn">Light</button>

      <div class="tab active" onclick="switchTab('overview')">Overview</div>
      <div class="tab" onclick="switchTab('tasks')">Tasks</div>
      <div class="tab" onclick="switchTab('log')">Log</div>
      <div class="tab-pane active" id="pane-overview"></div>
      <div class="tab-pane" id="pane-tasks"></div>
      <div class="tab-pane" id="pane-log"></div>

      <div class="status" id="statusBar">
        <div class="sdot" id="sDot"></div>
        <span id="sTxt"></span>
      </div>
      <span id="sTime"></span>

      <div class="status" id="taskStatus">
        <div class="sdot" id="taskDot"></div>
        <span id="taskTxt"></span>
      </div>

      <div id="logMsg" class="form-msg"></div>

      <table><tbody id="taskTbl"></tbody></table>
      <div id="taskEmpty" style="display:none"></div>
      <span id="taskCount"></span>

      <table><tbody id="logTbl"></tbody></table>
      <div id="logEmpty"></div>

      <div id="k1"></div><div id="k1s"></div><div id="k1b" style="width:0%"></div>
      <div id="k2"></div><div id="k2s"></div><div id="k2b" style="width:0%"></div>
      <div id="k3"></div><div id="k3s"></div><div id="k3b" style="width:0%"></div>
      <div id="sumTbl"></div>
      <div id="progBars"></div>

      <div id="todayStatus"></div>
    </body>
  `;
}

beforeEach(() => {
  createMinimalDOM();
});

describe('toggleMode', () => {
  it('toggles from dark to light mode', () => {
    const result = toggleMode(document, false);
    expect(result).toBe(true);
    expect(document.body.classList.contains('light')).toBe(true);
    expect(document.getElementById('modeBtn').textContent).toContain('Dark');
  });

  it('toggles from light to dark mode', () => {
    const result = toggleMode(document, true);
    expect(result).toBe(false);
    expect(document.body.classList.contains('light')).toBe(false);
    expect(document.getElementById('modeBtn').textContent).toContain('Light');
  });
});

describe('switchTab', () => {
  it('switches to the tasks tab', () => {
    switchTab(document, 'tasks');
    const tabs = document.querySelectorAll('.tab');
    expect(tabs[0].classList.contains('active')).toBe(false);
    expect(tabs[1].classList.contains('active')).toBe(true);
    expect(document.getElementById('pane-overview').classList.contains('active')).toBe(false);
    expect(document.getElementById('pane-tasks').classList.contains('active')).toBe(true);
  });

  it('switches to the log tab', () => {
    switchTab(document, 'log');
    expect(document.getElementById('pane-log').classList.contains('active')).toBe(true);
    expect(document.getElementById('pane-overview').classList.contains('active')).toBe(false);
  });

  it('switches back to overview', () => {
    switchTab(document, 'tasks');
    switchTab(document, 'overview');
    expect(document.getElementById('pane-overview').classList.contains('active')).toBe(true);
    expect(document.getElementById('pane-tasks').classList.contains('active')).toBe(false);
  });
});

describe('setStatus', () => {
  it('sets live status', () => {
    setStatus(document, 'statusBar', 'sDot', 'sTxt', 'Connected', 'live', false);
    const bar = document.getElementById('statusBar');
    expect(bar.className).toBe('status status-live');
    expect(document.getElementById('sTxt').textContent).toBe('Connected');
    const dot = document.getElementById('sDot');
    const style = dot.getAttribute('style');
    expect(style).toContain('var(--found)');
    expect(style).toContain('pulse 2s infinite');
  });

  it('sets error status', () => {
    setStatus(document, 'statusBar', 'sDot', 'sTxt', 'Error occurred', 'err', false);
    expect(document.getElementById('statusBar').className).toBe('status status-err');
    const style = document.getElementById('sDot').getAttribute('style');
    expect(style).toContain('var(--biz)');
    expect(style).toContain('none');
  });

  it('sets loading status', () => {
    setStatus(document, 'statusBar', 'sDot', 'sTxt', 'Loading...', 'load', false);
    expect(document.getElementById('statusBar').className).toBe('status status-load');
    const style = document.getElementById('sDot').getAttribute('style');
    expect(style).toContain('var(--text3)');
  });

  it('updates timestamp when showTime is true', () => {
    setStatus(document, 'statusBar', 'sDot', 'sTxt', 'Connected', 'live', true);
    expect(document.getElementById('sTime').textContent).toMatch(/^Updated:/);
  });

  it('does not update timestamp when showTime is false', () => {
    setStatus(document, 'statusBar', 'sDot', 'sTxt', 'Connected', 'live', false);
    expect(document.getElementById('sTime').textContent).toBe('');
  });

  it('works with task status bar', () => {
    setStatus(document, 'taskStatus', 'taskDot', 'taskTxt', '5 tasks loaded.', 'live', false);
    expect(document.getElementById('taskStatus').className).toBe('status status-live');
    expect(document.getElementById('taskTxt').textContent).toBe('5 tasks loaded.');
  });
});

describe('showMsg', () => {
  it('shows success message', () => {
    showMsg(document, 'Entry submitted!', 'ok');
    const el = document.getElementById('logMsg');
    expect(el.textContent).toBe('Entry submitted!');
    expect(el.className).toBe('form-msg form-msg-ok');
    expect(el.style.display).toBe('block');
  });

  it('shows error message', () => {
    showMsg(document, 'Submission failed.', 'err');
    const el = document.getElementById('logMsg');
    expect(el.textContent).toBe('Submission failed.');
    expect(el.className).toBe('form-msg form-msg-err');
  });

  it('treats unknown type as error', () => {
    showMsg(document, 'Something happened', 'unknown');
    const el = document.getElementById('logMsg');
    expect(el.className).toBe('form-msg form-msg-err');
  });
});

describe('renderTasks', () => {
  it('renders tasks into the table', () => {
    const tasks = [
      { intern: 'Ibrahim', date: '6/10/2026', day: 'Monday', hrs: 4, task: 'Build API', notes: '' },
      { intern: 'Bryan', date: '6/11/2026', day: 'Tuesday', hrs: 6, task: 'Review code', notes: 'https://link.com' },
    ];
    renderTasks(document, tasks);
    const tbody = document.getElementById('taskTbl');
    expect(tbody.querySelectorAll('tr').length).toBe(2);
    expect(document.getElementById('taskEmpty').style.display).toBe('none');
    expect(document.getElementById('taskCount').textContent).toBe('2 tasks');
  });

  it('shows empty state when no tasks', () => {
    renderTasks(document, []);
    expect(document.getElementById('taskTbl').innerHTML).toBe('');
    expect(document.getElementById('taskEmpty').style.display).toBe('block');
    expect(document.getElementById('taskCount').textContent).toBe('0 tasks');
  });

  it('shows singular "task" for one task', () => {
    const tasks = [{ intern: 'Ibrahim', date: '6/10/2026', day: 'Monday', hrs: 4, task: 'Build', notes: '' }];
    renderTasks(document, tasks);
    expect(document.getElementById('taskCount').textContent).toBe('1 task');
  });

  it('uses correct badge class for each intern', () => {
    const tasks = [
      { intern: 'Ibrahim', date: '6/10/2026', day: 'Mon', hrs: 4, task: 'Work', notes: '' },
      { intern: 'Bryan', date: '6/11/2026', day: 'Tue', hrs: 6, task: 'Work', notes: '' },
    ];
    renderTasks(document, tasks);
    const badges = document.getElementById('taskTbl').querySelectorAll('span');
    expect(badges[0].classList.contains('intern-badge-i')).toBe(true);
    expect(badges[1].classList.contains('intern-badge-b')).toBe(true);
  });

  it('truncates long notes URLs', () => {
    const longUrl = 'https://example.com/very/long/path/to/resource/that/exceeds/forty/characters';
    const tasks = [{ intern: 'Ibrahim', date: '6/10/2026', day: 'Mon', hrs: 4, task: 'Work', notes: longUrl }];
    renderTasks(document, tasks);
    const link = document.getElementById('taskTbl').querySelector('a');
    expect(link.textContent.length).toBeLessThanOrEqual(43); // 40 + '...'
    expect(link.href).toBe(longUrl);
  });
});

describe('renderLogs', () => {
  it('renders logs into the table', () => {
    const logs = [
      { intern: 'Bryan', day: 'Monday', signedIn: '9:05 AM', task: 'Dashboard work', notes: '' },
      { intern: 'Ibrahim', day: 'Tuesday', signedIn: '9:10 AM', task: 'API work', notes: 'link' },
    ];
    renderLogs(document, logs);
    const tbody = document.getElementById('logTbl');
    expect(tbody.querySelectorAll('tr').length).toBe(2);
    expect(document.getElementById('logEmpty').style.display).toBe('none');
  });

  it('shows empty state when no logs', () => {
    renderLogs(document, []);
    expect(document.getElementById('logTbl').innerHTML).toBe('');
    expect(document.getElementById('logEmpty').style.display).toBe('block');
  });

  it('uses correct badge class for Bryan vs Ibrahim', () => {
    const logs = [
      { intern: 'Bryan', day: 'Mon', signedIn: '9:00', task: 'Work', notes: '' },
      { intern: 'Ibrahim', day: 'Tue', signedIn: '9:00', task: 'Work', notes: '' },
    ];
    renderLogs(document, logs);
    const badges = document.getElementById('logTbl').querySelectorAll('span');
    expect(badges[0].classList.contains('intern-badge-b')).toBe(true);
    expect(badges[1].classList.contains('intern-badge-i')).toBe(true);
  });

  it('shows dash when signedIn is empty', () => {
    const logs = [{ intern: 'Bryan', day: 'Mon', signedIn: '', task: 'Work', notes: '' }];
    renderLogs(document, logs);
    const html = document.getElementById('logTbl').innerHTML;
    expect(html).toContain('\u2014');
  });
});

describe('renderAll', () => {
  it('renders KPIs, summary table, and progress bars', () => {
    const d = {
      iH: [10, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bH: [8, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      iT: [3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bT: [2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    renderAll(document, d);
    expect(document.getElementById('k1').textContent).toBe('30 hrs');
    expect(document.getElementById('k2').textContent).toBe('23 hrs');
    expect(document.getElementById('k3').textContent).toBe('53 hrs');
    expect(document.getElementById('k3s').textContent).toBe('12 tasks logged');
    expect(document.getElementById('sumTbl').innerHTML).toContain('Ibrahim');
    expect(document.getElementById('sumTbl').innerHTML).toContain('Bryan');
    expect(document.getElementById('progBars').innerHTML).toContain('Ibrahim');
  });

  it('handles all-zero data', () => {
    const d = {
      iH: new Array(12).fill(0),
      bH: new Array(12).fill(0),
      iT: new Array(12).fill(0),
      bT: new Array(12).fill(0),
    };
    renderAll(document, d);
    expect(document.getElementById('k1').textContent).toBe('0 hrs');
    expect(document.getElementById('k2').textContent).toBe('0 hrs');
    expect(document.getElementById('k3').textContent).toBe('0 hrs');
    expect(document.getElementById('k3s').textContent).toBe('0 tasks logged');
  });

  it('caps progress bar width at 100%', () => {
    const d = {
      iH: new Array(12).fill(50), // 600 total > 480
      bH: new Array(12).fill(0),
      iT: new Array(12).fill(0),
      bT: new Array(12).fill(0),
    };
    renderAll(document, d);
    expect(document.getElementById('k1b').style.width).toBe('100%');
  });
});

describe('updateTodayStatus', () => {
  it('shows sign-in time for interns who logged today', () => {
    const logs = [
      { intern: 'Bryan', day: 'Monday', signedIn: '9:05 AM', task: 'Work', notes: '' },
    ];
    const result = updateTodayStatus(document, logs, 'Monday');
    expect(result.bryanToday).toHaveLength(1);
    expect(result.ibrahimToday).toHaveLength(0);
    const html = document.getElementById('todayStatus').innerHTML;
    expect(html).toContain('9:05 AM');
    expect(html).toContain('No entry yet');
  });

  it('shows "No entry yet" for both when no logs for today', () => {
    const result = updateTodayStatus(document, [], 'Monday');
    expect(result.bryanToday).toHaveLength(0);
    expect(result.ibrahimToday).toHaveLength(0);
    const html = document.getElementById('todayStatus').innerHTML;
    expect(html).toContain('No entry yet');
  });

  it('handles case-insensitive day matching', () => {
    const logs = [
      { intern: 'Ibrahim', day: 'monday', signedIn: '9:00 AM', task: 'Work', notes: '' },
    ];
    const result = updateTodayStatus(document, logs, 'Monday');
    expect(result.ibrahimToday).toHaveLength(1);
  });

  it('shows "Logged" when signedIn is empty', () => {
    const logs = [
      { intern: 'Bryan', day: 'Monday', signedIn: '', task: 'Work', notes: '' },
    ];
    updateTodayStatus(document, logs, 'Monday');
    const html = document.getElementById('todayStatus').innerHTML;
    expect(html).toContain('Logged');
  });
});
