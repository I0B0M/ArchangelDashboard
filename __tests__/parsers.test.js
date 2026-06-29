const { parseDash, parseTasks, parseLogs, emptyData } = require('../src/dashboard');

describe('emptyData', () => {
  it('returns four arrays of 12 zeros', () => {
    const d = emptyData();
    expect(d.iH).toHaveLength(12);
    expect(d.bH).toHaveLength(12);
    expect(d.iT).toHaveLength(12);
    expect(d.bT).toHaveLength(12);
    expect(d.iH.every(v => v === 0)).toBe(true);
    expect(d.bH.every(v => v === 0)).toBe(true);
  });

  it('returns independent arrays (mutation safety)', () => {
    const a = emptyData();
    const b = emptyData();
    a.iH[0] = 99;
    expect(b.iH[0]).toBe(0);
  });
});

describe('parseDash', () => {
  const header = ['', 'Week', 'Ibrahim Hrs', 'Ibrahim Tasks', 'Bryan Hrs', 'Bryan Tasks'];

  it('parses valid dashboard rows', () => {
    const rows = [
      header,
      ['', 'Week 1', '10', '3', '8', '2'],
      ['', 'Week 2', '12', '4', '9', '3'],
    ];
    const d = parseDash(rows);
    expect(d.iH[0]).toBe(10);
    expect(d.iH[1]).toBe(12);
    expect(d.bH[0]).toBe(8);
    expect(d.bH[1]).toBe(9);
    expect(d.iT[0]).toBe(3);
    expect(d.bT[1]).toBe(3);
    // remaining weeks padded to 0
    expect(d.iH[2]).toBe(0);
    expect(d.iH).toHaveLength(12);
  });

  it('returns emptyData when header row is not found', () => {
    const rows = [['foo', 'bar', 'baz']];
    const d = parseDash(rows);
    expect(d).toEqual(emptyData());
  });

  it('returns emptyData when required columns are missing', () => {
    const rows = [['', 'Week', 'Other Col', 'Ibrahim Hrs']];
    const d = parseDash(rows);
    // Missing 'bryan hrs' column
    expect(d).toEqual(emptyData());
  });

  it('skips rows with empty labels', () => {
    const rows = [
      header,
      ['', '', '5', '1', '4', '1'],
      ['', 'Week 1', '10', '3', '8', '2'],
    ];
    const d = parseDash(rows);
    expect(d.iH[0]).toBe(10);
  });

  it('skips total row', () => {
    const rows = [
      header,
      ['', 'Week 1', '10', '3', '8', '2'],
      ['', 'Total', '10', '3', '8', '2'],
    ];
    const d = parseDash(rows);
    expect(d.iH[0]).toBe(10);
    expect(d.iH[1]).toBe(0);
  });

  it('handles non-numeric values gracefully', () => {
    const rows = [
      header,
      ['', 'Week 1', 'abc', '', 'xyz', ''],
    ];
    const d = parseDash(rows);
    expect(d.iH[0]).toBe(0);
    expect(d.bH[0]).toBe(0);
  });

  it('caps at 12 weeks', () => {
    const rows = [header];
    for (let i = 1; i <= 15; i++) {
      rows.push(['', `Week ${i}`, String(i), '1', String(i), '1']);
    }
    const d = parseDash(rows);
    expect(d.iH).toHaveLength(12);
    expect(d.iH[11]).toBe(12);
  });

  it('handles header not on first row', () => {
    const rows = [
      ['some', 'preamble'],
      ['more', 'preamble'],
      header,
      ['', 'Week 1', '10', '3', '8', '2'],
    ];
    const d = parseDash(rows);
    expect(d.iH[0]).toBe(10);
  });
});

describe('parseTasks', () => {
  const header = ['', 'Day', 'Date', 'Hrs', 'Task Description', 'Notes/Links'];

  it('parses valid task rows', () => {
    const rows = [
      header,
      ['', 'Monday', '6/10/2026', '4', 'Built API endpoint', 'https://link.com'],
      ['', 'Tuesday', '6/11/2026', '6', 'Code review', ''],
    ];
    const tasks = parseTasks(rows, 'Ibrahim');
    expect(tasks).toHaveLength(2);
    expect(tasks[0].intern).toBe('Ibrahim');
    expect(tasks[0].date).toBe('6/10/2026');
    expect(tasks[0].day).toBe('Monday');
    expect(tasks[0].hrs).toBe(4);
    expect(tasks[0].task).toBe('Built API endpoint');
    expect(tasks[0].notes).toBe('https://link.com');
    expect(tasks[1].notes).toBe('');
  });

  it('returns empty array when no header found', () => {
    const rows = [['foo', 'bar']];
    expect(parseTasks(rows, 'Ibrahim')).toEqual([]);
  });

  it('skips rows without task or date', () => {
    const rows = [
      header,
      ['', 'Monday', '6/10/2026', '4', '', ''],
      ['', 'Tuesday', '', '4', 'Some task', ''],
    ];
    const tasks = parseTasks(rows, 'Bryan');
    expect(tasks).toHaveLength(0);
  });

  it('skips example rows starting with "e.g"', () => {
    const rows = [
      header,
      ['', 'Monday', '6/10/2026', '4', 'e.g. Build something', ''],
    ];
    const tasks = parseTasks(rows, 'Ibrahim');
    expect(tasks).toHaveLength(0);
  });

  it('handles missing notes column', () => {
    const rows = [
      ['', 'Day', 'Date', 'Hrs', 'Task Description'],
      ['', 'Monday', '6/10/2026', '4', 'Built API endpoint'],
    ];
    const tasks = parseTasks(rows, 'Ibrahim');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].notes).toBe('');
  });

  it('handles non-numeric hours', () => {
    const rows = [
      header,
      ['', 'Monday', '6/10/2026', 'N/A', 'Work', ''],
    ];
    const tasks = parseTasks(rows, 'Ibrahim');
    expect(tasks[0].hrs).toBe(0);
  });

  it('preserves intern name for each task', () => {
    const rows = [
      header,
      ['', 'Monday', '6/10/2026', '4', 'Task 1', ''],
    ];
    const ibrahimTasks = parseTasks(rows, 'Ibrahim');
    const bryanTasks = parseTasks(rows, 'Bryan');
    expect(ibrahimTasks[0].intern).toBe('Ibrahim');
    expect(bryanTasks[0].intern).toBe('Bryan');
  });
});

describe('parseLogs', () => {
  const header = ['Signed In', 'Day', 'Task', 'Notes'];

  it('parses valid log rows', () => {
    const rows = [
      header,
      ['9:05 AM', 'Monday', 'Worked on dashboard', 'Link here'],
      ['9:10 AM', 'Tuesday', 'Code review', ''],
    ];
    const logs = parseLogs(rows, 'Bryan');
    expect(logs).toHaveLength(2);
    expect(logs[0].intern).toBe('Bryan');
    expect(logs[0].signedIn).toBe('9:05 AM');
    expect(logs[0].day).toBe('Monday');
    expect(logs[0].task).toBe('Worked on dashboard');
    expect(logs[0].notes).toBe('Link here');
  });

  it('returns empty array for rows with less than 2 entries', () => {
    expect(parseLogs([], 'Bryan')).toEqual([]);
    expect(parseLogs([['Signed In', 'Day', 'Task']], 'Bryan')).toEqual([]);
  });

  it('skips rows where both day and task are empty', () => {
    const rows = [
      header,
      ['9:05 AM', '', '', ''],
      ['9:10 AM', 'Tuesday', 'Code review', ''],
    ];
    const logs = parseLogs(rows, 'Bryan');
    expect(logs).toHaveLength(1);
    expect(logs[0].day).toBe('Tuesday');
  });

  it('keeps rows where day is present but task is empty', () => {
    const rows = [
      header,
      ['9:05 AM', 'Monday', '', ''],
    ];
    const logs = parseLogs(rows, 'Ibrahim');
    expect(logs).toHaveLength(1);
    expect(logs[0].day).toBe('Monday');
    expect(logs[0].task).toBe('');
  });

  it('handles missing sign-in column', () => {
    const rows = [
      ['Day', 'Task', 'Notes'],
      ['Monday', 'Work', 'Link'],
    ];
    const logs = parseLogs(rows, 'Ibrahim');
    expect(logs).toHaveLength(1);
    expect(logs[0].signedIn).toBe('');
  });

  it('handles missing notes column', () => {
    const rows = [
      ['Signed In', 'Day', 'Task'],
      ['9:00 AM', 'Monday', 'Work'],
    ];
    const logs = parseLogs(rows, 'Bryan');
    expect(logs).toHaveLength(1);
    expect(logs[0].notes).toBe('');
  });
});
