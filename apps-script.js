function doGet(e) {
  try {
    const p = e.parameter;

    // Validate required fields
    if (!p.signedIn || !p.day || !p.task) {
      return ContentService.createTextOutput(JSON.stringify({status:'error',message:'Missing required fields: signedIn, day, task'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Enforce maximum input length to prevent abuse
    var MAX_LEN = 500;
    var signedIn = String(p.signedIn).substring(0, 50);
    var day = String(p.day).substring(0, 20);
    var task = String(p.task).substring(0, MAX_LEN);
    var notes = String(p.notes || '').substring(0, MAX_LEN);

    // Sanitize inputs: strip HTML tags and control characters
    signedIn = signedIn.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F]/g, '');
    day = day.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F]/g, '');
    task = task.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F]/g, '');
    notes = notes.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F]/g, '');

    // Validate day format (only allow common day names or short date strings)
    var validDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    if (validDays.indexOf(day.toLowerCase()) === -1 && !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(day)) {
      return ContentService.createTextOutput(JSON.stringify({status:'error',message:'Invalid day format'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([signedIn, day, task, notes]);
    return ContentService.createTextOutput(JSON.stringify({status:'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status:'error',message:'Internal error'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
