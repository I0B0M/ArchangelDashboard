const {
  filterTasksLogic,
  buildWeekFilter,
  buildExportRows,
  validateLogInput,
  buildLogUrl,
  emptyData
} = require('../src/dashboard');

describe('filterTasksLogic', () => {
  const tasks = [
    { intern: 'Ibrahim', task: 'Build API endpoint', notes: 'REST API' },
    { intern: 'Ibrahim', task: 'Fix bug in dashboard', notes: '' },
    { intern: 'Bryan', task: 'Code review', notes: 'PR #42' },
    { intern: 'Bryan', task: 'Deploy to staging', notes: 'CI/CD pipeline' },
  ];

  it('returns all tasks when filters are "all" and no search', () => {
    const result = filterTasksLogic(tasks, 'all', 'all', '');
    expect(result).toHaveLength(4);
  });

  it('filters by intern name', () => {
    const result = filterTasksLogic(tasks, 'Ibrahim', 'all', '');
    expect(result).toHaveLength(2);
    expect(result.every(t => t.intern === 'Ibrahim')).toBe(true);
  });

  it('filters by search term in task', () => {
    const result = filterTasksLogic(tasks, 'all', 'all', 'api');
    expect(result).toHaveLength(1);
    expect(result[0].task).toBe('Build API endpoint');
  });

  it('filters by search term in notes', () => {
    const result = filterTasksLogic(tasks, 'all', 'all', 'pr #42');
    expect(result).toHaveLength(1);
    expect(result[0].intern).toBe('Bryan');
  });

  it('combines intern filter and search', () => {
    const result = filterTasksLogic(tasks, 'Ibrahim', 'all', 'bug');
    expect(result).toHaveLength(1);
    expect(result[0].task).toBe('Fix bug in dashboard');
  });

  it('returns empty when no matches', () => {
    const result = filterTasksLogic(tasks, 'Ibrahim', 'all', 'nonexistent');
    expect(result).toHaveLength(0);
  });

  it('search is case-insensitive (caller lowercases search)', () => {
    const result = filterTasksLogic(tasks, 'all', 'all', 'code review');
    expect(result).toHaveLength(1);
    expect(result[0].task).toBe('Code review');
  });
});

describe('buildWeekFilter', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="filterWeek">
        <option value="all">All Weeks</option>
      </select>
    `;
  });

  it('adds week options based on task dates', () => {
    const tasks = [
      { date: '6/10/2026' }, // Week 1 (starts 6/9/2026)
      { date: '6/17/2026' }, // Week 2
    ];
    const weeks = buildWeekFilter(document, tasks);
    expect(weeks).toHaveLength(2);
    const sel = document.getElementById('filterWeek');
    // 1 default + 2 added
    expect(sel.options.length).toBe(3);
  });

  it('deduplicates weeks', () => {
    const tasks = [
      { date: '6/10/2026' },
      { date: '6/11/2026' },
      { date: '6/12/2026' },
    ];
    const weeks = buildWeekFilter(document, tasks);
    expect(weeks).toHaveLength(1);
  });

  it('handles invalid dates gracefully', () => {
    const tasks = [
      { date: 'not-a-date' },
      { date: '6/10/2026' },
    ];
    const weeks = buildWeekFilter(document, tasks);
    expect(weeks.length).toBeGreaterThanOrEqual(1);
  });

  it('clamps week to 0-11 range', () => {
    const tasks = [
      { date: '1/1/2020' }, // way before start => clamped to week 0
      { date: '12/31/2026' }, // way after => clamped to week 11
    ];
    const weeks = buildWeekFilter(document, tasks);
    expect(weeks).toContain('Week 01');
    expect(weeks).toContain('Week 12');
  });
});

describe('buildExportRows', () => {
  it('builds header + 12 data rows for empty data', () => {
    const d = emptyData();
    const rows = buildExportRows(d, []);
    expect(rows).toHaveLength(13); // 1 header + 12 weeks
    expect(rows[0]).toEqual(['Week', 'Ibrahim Hours', 'Bryan Hours', 'Ibrahim Tasks', 'Bryan Tasks', 'Combined Hours']);
    expect(rows[1][0]).toBe('Week 1');
    expect(rows[12][0]).toBe('Week 12');
  });

  it('includes task data when tasks are provided', () => {
    const d = emptyData();
    const tasks = [
      { intern: 'Ibrahim', date: '6/10/2026', day: 'Monday', hrs: 4, task: 'Build API', notes: '' },
    ];
    const rows = buildExportRows(d, tasks);
    // 1 header + 12 weeks + 1 blank + 1 task header + 1 task
    expect(rows).toHaveLength(16);
    expect(rows[14]).toEqual(['Intern', 'Date', 'Day', 'Hours', 'Task', 'Notes']);
    expect(rows[15][0]).toBe('Ibrahim');
  });

  it('computes combined hours correctly', () => {
    const d = {
      iH: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bH: [8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      iT: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bT: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    const rows = buildExportRows(d, []);
    expect(rows[1][5]).toBe(18); // 10 + 8
  });
});

describe('validateLogInput', () => {
  it('returns null for valid input', () => {
    expect(validateLogInput('Monday', '9:05 AM', 'Built API')).toBeNull();
  });

  it('returns error when day is empty', () => {
    expect(validateLogInput('', '9:05 AM', 'Built API')).toBe('Please fill in Day, Signed In, and Task.');
  });

  it('returns error when signedIn is empty', () => {
    expect(validateLogInput('Monday', '', 'Built API')).toBe('Please fill in Day, Signed In, and Task.');
  });

  it('returns error when task is empty', () => {
    expect(validateLogInput('Monday', '9:05 AM', '')).toBe('Please fill in Day, Signed In, and Task.');
  });

  it('returns error when all fields are empty', () => {
    expect(validateLogInput('', '', '')).toBe('Please fill in Day, Signed In, and Task.');
  });
});

describe('buildLogUrl', () => {
  const bryanScript = 'https://script.google.com/bryan';
  const ibrahimScript = 'https://script.google.com/ibrahim';

  it('uses Bryan script for bryan intern', () => {
    const url = buildLogUrl('bryan', '9:05 AM', 'Monday', 'Work', 'Notes', bryanScript, ibrahimScript);
    expect(url).toMatch(/^https:\/\/script\.google\.com\/bryan\?/);
  });

  it('uses Ibrahim script for ibrahim intern', () => {
    const url = buildLogUrl('ibrahim', '9:05 AM', 'Monday', 'Work', 'Notes', bryanScript, ibrahimScript);
    expect(url).toMatch(/^https:\/\/script\.google\.com\/ibrahim\?/);
  });

  it('encodes parameters correctly', () => {
    const url = buildLogUrl('bryan', '9:05 AM', 'Monday', 'Build & test', 'Note', bryanScript, ibrahimScript);
    expect(url).toContain('signedIn=9%3A05%20AM');
    expect(url).toContain('day=Monday');
    expect(url).toContain('task=Build%20%26%20test');
    expect(url).toContain('notes=Note');
  });

  it('handles empty notes', () => {
    const url = buildLogUrl('bryan', '9:00', 'Mon', 'Work', '', bryanScript, ibrahimScript);
    expect(url).toContain('notes=');
  });
});
