let appendedRows;
let mockSheet;

beforeEach(() => {
  appendedRows = [];
  mockSheet = {
    appendRow: (row) => appendedRows.push(row)
  };

  global.SpreadsheetApp = {
    getActiveSpreadsheet: () => ({
      getActiveSheet: () => mockSheet
    })
  };

  global.ContentService = {
    createTextOutput: (text) => ({
      _text: text,
      setMimeType: function (mime) {
        this._mime = mime;
        return this;
      }
    }),
    MimeType: { JSON: 'JSON' }
  };
});

const { doGet } = require('../apps-script');

describe('doGet', () => {
  it('appends a row with all parameters', () => {
    const e = { parameter: { signedIn: '9:05 AM', day: 'Monday', task: 'Build API', notes: 'Some notes' } };
    const result = doGet(e);
    expect(appendedRows).toHaveLength(1);
    expect(appendedRows[0]).toEqual(['9:05 AM', 'Monday', 'Build API', 'Some notes']);
    expect(JSON.parse(result._text)).toEqual({ status: 'ok' });
    expect(result._mime).toBe('JSON');
  });

  it('uses empty string for missing notes', () => {
    const e = { parameter: { signedIn: '9:00 AM', day: 'Tuesday', task: 'Review' } };
    doGet(e);
    expect(appendedRows[0][3]).toBe('');
  });

  it('handles empty notes parameter', () => {
    const e = { parameter: { signedIn: '9:00 AM', day: 'Tuesday', task: 'Review', notes: '' } };
    doGet(e);
    expect(appendedRows[0][3]).toBe('');
  });

  it('returns error status on exception', () => {
    mockSheet.appendRow = () => { throw new Error('Sheet not found'); };
    const e = { parameter: { signedIn: '9:00', day: 'Mon', task: 'Work' } };
    const result = doGet(e);
    const parsed = JSON.parse(result._text);
    expect(parsed.status).toBe('error');
    expect(parsed.message).toContain('Sheet not found');
  });

  it('returns JSON mime type on success', () => {
    const e = { parameter: { signedIn: '9:00', day: 'Mon', task: 'Work' } };
    const result = doGet(e);
    expect(result._mime).toBe('JSON');
  });

  it('returns JSON mime type on error', () => {
    mockSheet.appendRow = () => { throw new Error('fail'); };
    const e = { parameter: { signedIn: '9:00', day: 'Mon', task: 'Work' } };
    const result = doGet(e);
    expect(result._mime).toBe('JSON');
  });

  it('preserves special characters in parameters', () => {
    const e = { parameter: { signedIn: '9:05 AM', day: 'Mon & Tue', task: 'Build <API>', notes: '"quoted"' } };
    doGet(e);
    expect(appendedRows[0]).toEqual(['9:05 AM', 'Mon & Tue', 'Build <API>', '"quoted"']);
  });
});
