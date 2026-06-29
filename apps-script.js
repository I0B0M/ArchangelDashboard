function doGet(e) {
  try {
    if (!e || !e.parameter) {
      return ContentService.createTextOutput(JSON.stringify({
        status:'error', message:'Missing request parameters'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    const p = e.parameter;
    if (!p.signedIn || !p.day || !p.task) {
      return ContentService.createTextOutput(JSON.stringify({
        status:'error', message:'Required fields missing: signedIn, day, and task are required'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([p.signedIn, p.day, p.task, p.notes || '']);
    return ContentService.createTextOutput(JSON.stringify({status:'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    console.error('doGet error:', err);
    return ContentService.createTextOutput(JSON.stringify({
      status:'error',
      message:err.toString(),
      stack: err.stack || ''
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
