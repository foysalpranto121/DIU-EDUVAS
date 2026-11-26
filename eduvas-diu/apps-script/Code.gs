/* ============================================================
   Eduvas Affiliate Referral Campaign · DIU
   Backend for the Netlify page.

   Deploy:  Deploy > New deployment > Web app
            Execute as:      Me
            Who has access:  Anyone
   ============================================================ */

const SPREADSHEET_ID = '1o_eACJq4nYDSQoePf8s_Ig6u3TxW8H7fVPLGs166Y8Y';
const SHEET_NAME     = 'Responses';

// Where the form now lives. Used by doGet to forward old QR scans.
const SITE_URL = 'https://eduvas-diu.netlify.app';

const COLUMNS = [
  ['Timestamp', '_ts'],
  ['Referral Code', '_code'],
  ['Full Name', 'name'],
  ['Phone', 'phone'],
  ['Email', 'email'],
  ['University', 'university'],
  ['Department', 'department'],
  ['Student ID', 'studentId'],
  ['Year', 'year'],
  ['Why Joining', 'why'],
  ['Institutions They Can Reach', 'institutions'],
  ['Expected Referrals (3 months)', 'expectedReferrals'],
  ['Connection to Institutions', 'connection'],
  ['Home District', 'district'],
  ['Heard From', 'heardFrom'],
  ['Prior Experience', 'experience'],
  ['Experience Type', 'experienceType'],
  ['Experience Details', 'experienceDetails'],
  ['Communication Skill', 'commSkill'],
  ['Active On', 'social'],
  ['Hours per Week', 'hoursPerWeek'],
  ['Contact Preference', 'contactPref'],
  ['Notes', 'note'],
  ['Status', '_status']
];

/* ------------------------------------------------------------
   GET — anyone who still scans an old poster QR lands here and
   gets forwarded to the Netlify page.
   ------------------------------------------------------------ */
function doGet() {
  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Eduvas Affiliate Referral Campaign · DIU</title>' +
    '<script>location.replace(' + JSON.stringify(SITE_URL) + ');<\/script>' +
    '</head><body style="font-family:system-ui,sans-serif;text-align:center;padding:60px 20px">' +
    '<p>Opening the Eduvas registration form…</p>' +
    '<p><a href="' + SITE_URL + '">Tap here if nothing happens</a></p>' +
    '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('Eduvas Affiliate Referral Campaign · DIU')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ------------------------------------------------------------
   POST — the Netlify page sends JSON as text/plain, which keeps
   the browser from firing a CORS preflight that Apps Script
   cannot answer.
   ------------------------------------------------------------ */
function doPost(e) {
  let out;

  try {
    const body = (e && e.postData && e.postData.contents) || '{}';
    const data = JSON.parse(body);

    if (data.action === 'check') {
      out = checkExisting(data);
    } else {
      out = submitApplication(data);
    }
  } catch (err) {
    out = {
      success: false,
      message: 'Server error: ' + err.message
    };
  }

  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------ */

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  let sh = ss.getSheetByName(SHEET_NAME);

  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
  }

  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUMNS.map(c => c[0]));
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLUMNS.length)
      .setFontWeight('bold')
      .setBackground('#0763B5')
      .setFontColor('#ffffff');
  }

  return sh;
}

// Run this once from the editor to create the header row.
function setup() {
  const sh = getSheet_();
  Logger.log('Sheet ready: ' + sh.getParent().getUrl());
}

function clean_(value, maxLength) {
  let text = String(value || '').trim();

  if (maxLength) {
    text = text.substring(0, maxLength);
  }

  return text;
}

function normPhone_(value) {
  let digits = String(value || '').replace(/\D/g, '');

  if (digits.indexOf('880') === 0) {
    digits = digits.slice(2);
  }

  if (digits.length === 10 && digits[0] === '1') {
    digits = '0' + digits;
  }

  return digits;
}

function makeCode_(name, phone) {
  const firstName = clean_(name)
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 10);

  return 'EDU-' + (firstName || 'STUDENT') + '-' + phone.slice(-4);
}

/* ------------------------------------------------------------
   Reads phone + email columns once and returns them together.
   ------------------------------------------------------------ */
function existingContacts_(sh) {
  const lastRow = sh.getLastRow();

  if (lastRow < 2) {
    return { phones: [], emails: [] };
  }

  const phoneCol = COLUMNS.findIndex(c => c[1] === 'phone') + 1;
  const emailCol = COLUMNS.findIndex(c => c[1] === 'email') + 1;

  const phones = sh.getRange(2, phoneCol, lastRow - 1, 1)
    .getValues()
    .map(r => normPhone_(r[0]));

  const emails = sh.getRange(2, emailCol, lastRow - 1, 1)
    .getValues()
    .map(r => String(r[0] || '').trim().toLowerCase());

  return { phones: phones, emails: emails };
}

/* ------------------------------------------------------------
   Convenience check the form calls while the student is still
   filling the page, so a duplicate is caught early instead of
   at the very end.
   ------------------------------------------------------------ */
function checkExisting(d) {
  const phone = normPhone_(d && d.phone);
  const email = String((d && d.email) || '').trim().toLowerCase();

  const sh = getSheet_();
  const existing = existingContacts_(sh);

  if (phone && existing.phones.indexOf(phone) > -1) {
    return {
      success: true,
      duplicate: true,
      field: 'phone',
      message: 'This phone number is already registered.'
    };
  }

  if (email && existing.emails.indexOf(email) > -1) {
    return {
      success: true,
      duplicate: true,
      field: 'email',
      message: 'This email address is already registered.'
    };
  }

  return { success: true, duplicate: false };
}

/* ------------------------------------------------------------ */

function submitApplication(d) {
  d = d || {};

  const name  = clean_(d.name);
  const phone = normPhone_(d.phone);
  const email = String(d.email || '').trim().toLowerCase();

  if (!name) {
    return { success: false, message: 'Please enter your full name.' };
  }

  if (!/^01[3-9]\d{8}$/.test(phone)) {
    return {
      success: false,
      message: 'Please enter a valid 11-digit Bangladesh mobile number.'
    };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  if (!clean_(d.department)) {
    return { success: false, message: 'Please choose your department.' };
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);
  } catch (err) {
    return {
      success: false,
      message: 'The server is busy. Please try again in a moment.'
    };
  }

  try {
    const sh = getSheet_();
    const existing = existingContacts_(sh);

    if (existing.phones.indexOf(phone) > -1) {
      return {
        success: false,
        duplicate: true,
        field: 'phone',
        message: 'This phone number is already registered. Each student can register only once.'
      };
    }

    if (existing.emails.indexOf(email) > -1) {
      return {
        success: false,
        duplicate: true,
        field: 'email',
        message: 'This email address is already registered. Each student can register only once.'
      };
    }

    const code = makeCode_(name, phone);

    const row = COLUMNS.map(([, key]) => {
      if (key === '_ts')     return new Date();
      if (key === '_code')   return code;
      if (key === '_status') return 'New';
      if (key === 'phone')   return phone;
      if (key === 'email')   return email;
      if (key === 'name')    return name;

      return clean_(
        d[key],
        (key === 'experienceDetails' || key === 'note') ? 2000 : 500
      );
    });

    sh.appendRow(row);

    return {
      success: true,
      duplicate: false,
      code: code,
      message: 'Registration successful!'
    };

  } finally {
    lock.releaseLock();
  }
}
