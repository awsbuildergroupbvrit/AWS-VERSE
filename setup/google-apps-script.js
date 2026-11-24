/**
 * AWS-VERSE Workshop Registration - Google Apps Script
 * 
 * Paste this script into Extensions > Apps Script in your Google Sheet.
 * 
 * IMPORTANT: To allow Google to send emails:
 * 1. Select "testSendEmail" from the function dropdown at the top and click "Run".
 * 2. Click "Review permissions" -> select your Google account -> "Advanced" -> "Go to AWS-VERSE (unsafe)" -> "Allow".
 * 3. Click "Deploy" > "Manage deployments" > Edit (pencil) > New version > "Deploy".
 */

const SHEET_NAME = 'Registrations';
const MAX_CAPACITY = 60;

const HEADERS = [
  'Timestamp',
  'Pass ID',
  'Full Name',
  'College Email',
  'Roll Number',
  'Branch',
  'Year',
  'Section'
];

/**
 * One-click test function to authorize Gmail permissions & test email
 */
function testSendEmail() {
  const userEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  const testInfo = {
    passId: 'AWSV-TEST-01',
    fullName: 'Gurrala Rishikesh',
    collegeEmail: userEmail,
    rollNumber: '24211A05L4',
    branch: 'CSE',
    yearOfStudy: '3rd Year',
    section: 'D'
  };
  sendPassEmail(testInfo);
  Logger.log('Test pass email successfully sent to: ' + userEmail);
}

/**
 * Handle GET request (Health check and seat count)
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();
    // Exclude header row
    const count = Math.max(0, lastRow - 1);
    const remaining = Math.max(0, MAX_CAPACITY - count);

    return jsonResponse({
      status: 'success',
      remaining: remaining,
      capacity: MAX_CAPACITY,
      total: count
    });
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Handle POST request (New Registration)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 10 seconds for concurrent requests
  const success = lock.tryLock(10000);
  if (!success) {
    return jsonResponse({
      status: 'error',
      error: 'Server is busy processing registrations. Please try again in a few moments.'
    });
  }

  try {
    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    let passId = (data.passId || '').trim();
    const fullName = (data.fullName || '').trim();
    const collegeEmail = (data.collegeEmail || '').trim().toLowerCase();
    const rollNumber = (data.rollNumber || '').trim().toUpperCase();
    const branch = (data.branch || '').trim();
    const yearOfStudy = (data.yearOfStudy || '').trim();
    const section = (data.section || '').trim().toUpperCase();
    const timestamp = data.timestamp || new Date().toISOString();

    // Field validation
    if (!fullName || !collegeEmail || !rollNumber || !branch || !yearOfStudy || !section) {
      return jsonResponse({
        status: 'error',
        error: 'All fields (Name, Email, Roll Number, Branch, Year, Section) are required.'
      });
    }

    const sheet = getOrCreateSheet();
    const lastRow = sheet.getLastRow();

    // Check capacity (Header is row 1, so row 2 to 61 is 60 students)
    const existingCount = Math.max(0, lastRow - 1);
    if (existingCount >= MAX_CAPACITY) {
      return jsonResponse({
        status: 'full',
        error: 'All 60 seats are booked. Workshop registration is now full.',
        remaining: 0,
        capacity: MAX_CAPACITY
      });
    }

    // Check for duplicates in existing rows
    if (lastRow > 1) {
      const values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
      for (let i = 0; i < values.length; i++) {
        const rowEmail = (values[i][3] || '').toString().trim().toLowerCase();
        const rowRoll = (values[i][4] || '').toString().trim().toUpperCase();

        if (rowRoll === rollNumber) {
          return jsonResponse({
            status: 'duplicate',
            error: 'Roll number ' + rollNumber + ' is already registered! Check your saved pass or email.',
            existingPassId: values[i][1] || ''
          });
        }

        if (rowEmail === collegeEmail) {
          return jsonResponse({
            status: 'duplicate',
            error: 'Email ' + collegeEmail + ' is already registered! Check your saved pass or email.',
            existingPassId: values[i][1] || ''
          });
        }
      }
    }

    // Generate official sequential Pass ID (01, 02, 03 ... 60)
    const seatNumber = existingCount + 1;
    const seatStr = seatNumber < 10 ? '0' + seatNumber : '' + seatNumber;
    const cleanRoll = rollNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const suffix = cleanRoll.length >= 4 ? cleanRoll.slice(-4) : cleanRoll.padStart(4, '0');
    passId = 'AWSV-' + suffix + '-' + seatStr;

    // Append new registration row
    sheet.appendRow([
      timestamp,
      passId,
      fullName,
      collegeEmail,
      rollNumber,
      branch,
      yearOfStudy,
      section
    ]);

    // Format new row nicely (monospace for Pass ID & Roll Number)
    const newRow = sheet.getLastRow();
    sheet.getRange(newRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(newRow, 2).setFontFamily('Consolas');
    sheet.getRange(newRow, 5).setFontFamily('Consolas');

    const newRemaining = Math.max(0, MAX_CAPACITY - (existingCount + 1));

    // Send confirmation email directly to student's email
    let emailSent = false;
    let mailErrorMsg = '';
    try {
      sendPassEmail({
        passId: passId,
        fullName: fullName,
        collegeEmail: collegeEmail,
        rollNumber: rollNumber,
        branch: branch,
        yearOfStudy: yearOfStudy,
        section: section
      });
      emailSent = true;
    } catch (mailErr) {
      mailErrorMsg = mailErr.toString();
      Logger.log('Mail error: ' + mailErrorMsg);
    }

    return jsonResponse({
      status: 'success',
      message: 'Seat confirmed for AWS-VERSE!',
      passId: passId,
      remaining: newRemaining,
      capacity: MAX_CAPACITY,
      emailSent: emailSent,
      mailError: mailErrorMsg
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      error: 'Failed to record registration: ' + err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Send Spider-Verse pass email to the student
 */
function sendPassEmail(info) {
  const subject = "🎟️ Your AWS-VERSE Workshop Pass [" + info.passId + "]";
  const html = getPassEmailHtml(info);
  
  MailApp.sendEmail({
    to: info.collegeEmail,
    subject: subject,
    htmlBody: html,
    name: "AWS-VERSE Workshop"
  });
}

/**
 * Spider-Verse HTML Email Ticket
 */
function getPassEmailHtml(info) {
  return '<!DOCTYPE html>' +
    '<html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:24px 0;background-color:#0b070e;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;color:#f5f0eb;">' +
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b070e;">' +
    '<tr><td align="center" style="padding:10px;">' +
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background:#160e18;border:2px solid #87505a;border-radius:12px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.85);">' +
    '<tr><td style="background:linear-gradient(90deg,#ff4856,#ff7580,#95e6df);height:8px;"></td></tr>' +
    '<tr><td style="padding:28px 28px 16px 28px;background:radial-gradient(ellipse at top right,#381926,#160e18 70%);">' +
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>' +
    '<td><p style="margin:0 0 6px 0;font-family:monospace;font-size:11px;letter-spacing:2px;color:#95e6df;text-transform:uppercase;font-weight:bold;">// WORKSHOP ADMISSION CONFIRMED</p>' +
    '<h1 style="margin:0;font-size:32px;font-weight:900;font-style:italic;color:#ffffff;letter-spacing:-1px;">AWS<span style="color:#ff4856;">-VERSE</span></h1></td>' +
    '<td align="right" valign="top"><div style="display:inline-block;background-color:#95e6df;color:#0f1c1b;font-weight:900;font-style:italic;font-size:12px;padding:6px 12px;border:2px solid #0f1c1b;border-radius:4px;box-shadow:3px 3px 0 #ff4856;">ADMIT ONE</div></td>' +
    '</tr></table></td></tr>' +
    '<tr><td style="padding:0 28px 16px 28px;"><p style="margin:0;font-size:14px;line-height:1.6;color:#c4b9bf;">Hey <strong style="color:#ffffff;">' + info.fullName + '</strong>, your seat for the two-day cloud multiverse workshop is officially confirmed!</p></td></tr>' +
    '<tr><td style="padding:0 28px 20px 28px;">' +
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f0a12;border:1px solid #4a343a;border-radius:8px;padding:16px;">' +
    '<tr><td style="padding:16px;border-bottom:1px dashed #3f2a30;">' +
    '<span style="display:block;font-family:monospace;font-size:11px;color:#95e6df;letter-spacing:1px;">DIGITAL PASS ID</span>' +
    '<span style="font-family:monospace;font-size:22px;font-weight:bold;color:#ff5e6d;letter-spacing:2px;">' + info.passId + '</span></td></tr>' +
    '<tr><td style="padding:16px;"><table role="presentation" width="100%"><tr>' +
    '<td width="50%" valign="top"><span style="display:block;font-family:monospace;font-size:10px;color:#8e8389;">ATTENDEE</span><strong style="font-size:15px;color:#fff;">' + info.fullName + '</strong></td>' +
    '<td width="50%" valign="top"><span style="display:block;font-family:monospace;font-size:10px;color:#8e8389;">ROLL NUMBER</span><strong style="font-family:monospace;font-size:15px;color:#95e6df;">' + info.rollNumber + '</strong></td>' +
    '</tr><tr>' +
    '<td width="50%" valign="top" style="padding-top:10px;"><span style="display:block;font-family:monospace;font-size:10px;color:#8e8389;">BRANCH</span><span style="font-size:14px;color:#e8e0e5;font-weight:600;">' + info.branch + '</span></td>' +
    '<td width="50%" valign="top" style="padding-top:10px;"><span style="display:block;font-family:monospace;font-size:10px;color:#8e8389;">YEAR &amp; SECTION</span><span style="font-size:14px;color:#e8e0e5;font-weight:600;">' + info.yearOfStudy + ' &bull; Sec ' + info.section + '</span></td>' +
    '</tr></table></td></tr></table></td></tr>' +
    '<tr><td style="padding:0 16px;"><div style="border-top:2px dashed #6f4c56;height:1px;"></div></td></tr>' +
    '<tr><td style="padding:20px 28px;background:#130a13;">' +
    '<p style="margin:0 0 8px 0;font-size:13px;color:#fff;"><strong>Date:</strong> November 27–28, 2026 &bull; 9:00 AM – 4:30 PM</p>' +
    '<p style="margin:0;font-size:13px;color:#fff;"><strong>Venue:</strong> ENL Block Seminar Hall, Ground Floor, BVRIT Narsapur</p></td></tr>' +
    '<tr><td style="padding:16px 28px;background:#1a1019;text-align:center;border-top:1px solid #2b1d24;">' +
    '<p style="margin:0;font-size:12px;color:#8a7882;">Please keep this email or your Pass ID ready on your phone at check-in on Day 1.</p></td></tr>' +
    '</table></td></tr></table></body></html>';
}

/**
 * Helper: Find or initialize the Registrations sheet
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // If new or empty, write header row with Spider-Verse styling
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#171115');
    headerRange.setFontColor('#ff5360');
    headerRange.setFontWeight('bold');
    headerRange.setFontFamily('Arial');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }

  return sheet;
}

/**
 * Return JSON response with CORS headers
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
