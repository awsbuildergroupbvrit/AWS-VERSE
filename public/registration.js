const form = document.querySelector('#signup-form');
const statusLine = document.querySelector('#form-status');
const availability = document.querySelector('#availability');
const submitBtn = document.querySelector('#submit-btn');
const submitBtnText = document.querySelector('#submit-btn-text');
const rollInput = form.querySelector('input[name="rollNumber"]');
const emailInput = form.querySelector('input[name="collegeEmail"]');
const emailHint = document.querySelector('#email-hint');

let pass = null;
let requestKey;

try {
  requestKey = sessionStorage.getItem('verse-request') || crypto.randomUUID();
  sessionStorage.setItem('verse-request', requestKey);
  pass = JSON.parse(sessionStorage.getItem('verse-pass') || 'null');
} catch {
  requestKey = crypto.randomUUID();
}

/**
 * Auto-uppercase roll number
 */
if (rollInput) {
  rollInput.addEventListener('input', () => {
    rollInput.value = rollInput.value.toUpperCase().replace(/\s+/g, '');
  });
}

/**
 * Real-time college email helper / validation
 */
if (emailInput && emailHint) {
  emailInput.addEventListener('input', () => {
    const val = emailInput.value.trim().toLowerCase();
    if (!val) {
      emailHint.textContent = 'Preferably your @bvrit.ac.in student email';
      emailHint.className = 'field-hint';
    } else if (val.endsWith('@bvrit.ac.in')) {
      emailHint.textContent = '✓ Verified BVRIT college domain';
      emailHint.className = 'field-hint';
      emailHint.style.color = '#8dede7';
    } else if (val.includes('@') && !val.endsWith('@bvrit.ac.in')) {
      emailHint.textContent = 'Note: Official @bvrit.ac.in format preferred for workshop check-in';
      emailHint.className = 'field-hint';
      emailHint.style.color = '#ffb368';
    }
  });
}

/**
 * Generate sequential Pass ID: AWSV- + last 4 of Roll Number + seat number (01, 02...)
 */
function generatePassId(rollNumber, seatNumber) {
  const clean = (rollNumber || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const suffix = clean.length >= 4 ? clean.slice(-4) : clean.padStart(4, '0');
  const num = seatNumber || 1;
  const seatStr = String(num).padStart(2, '0');
  return `AWSV-${suffix}-${seatStr}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/**
 * Render confirmed Digital Pass View
 */
function showPass() {
  if (!pass) return;
  document.querySelector('#signup').hidden = true;
  document.querySelector('#confirmed').hidden = false;

  const passIdEl = document.querySelector('#pass-id');
  const passNameEl = document.querySelector('#pass-name');
  const passRollEl = document.querySelector('#pass-roll');
  const passDeptEl = document.querySelector('#pass-dept');
  const passYearEl = document.querySelector('#pass-year');
  const passEmailNotice = document.querySelector('#pass-email-notice');
  const passEmailTarget = document.querySelector('#pass-email-target');

  const pId = pass.passId || pass.code || 'AWSV-PASS';
  if (passIdEl) passIdEl.textContent = pId;
  if (passNameEl) passNameEl.textContent = pass.fullName || pass.name || '';
  if (passRollEl) passRollEl.textContent = pass.rollNumber || '—';
  if (passDeptEl) passDeptEl.textContent = `${pass.branch || 'CSE'} · Sec ${pass.section || 'A'}`;
  if (passYearEl) passYearEl.textContent = pass.yearOfStudy || '—';
  if (passEmailTarget) passEmailTarget.textContent = pass.collegeEmail || pass.email || 'your email';

  if (passEmailNotice) {
    if (pass.emailSent) {
      passEmailNotice.className = 'pass-notice';
      passEmailNotice.innerHTML = `✓ A digital copy has been sent to <strong>${escapeHtml(pass.collegeEmail || pass.email)}</strong>.`;
    } else {
      passEmailNotice.className = 'pass-notice warning';
      passEmailNotice.innerHTML = `<strong>Important:</strong> Please <strong>take a screenshot or click "Save pass (PNG)" below</strong> to keep your pass for check-in on Day 1.`;
    }
  }
}

/**
 * Fetch and update seat availability counter
 */
async function refreshSeats() {
  try {
    const sheetUrl = eventSettings.googleSheetUrl || window.VITE_GOOGLE_SHEET_URL || window.NEXT_PUBLIC_GOOGLE_SHEET_URL || window.GOOGLE_SHEET_URL;
    let remaining = 60;
    let capacity = 60;

    if (sheetUrl && /^https:\/\/script\.google\.com\//.test(sheetUrl)) {
      try {
        const r = await fetch(sheetUrl, { cache: 'no-store' });
        if (r.ok) {
          const data = await r.json();
          if (typeof data.remaining === 'number') {
            remaining = data.remaining;
            capacity = data.capacity || 60;
          }
        }
      } catch {
        /* Fall back to local check */
      }
    } else {
      const r = await fetch('/api/registration', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        remaining = data.remaining;
        capacity = data.capacity || 60;
      }
    }

    if (availability) {
      availability.textContent = remaining > 0
        ? `${remaining} of ${capacity} seats available`
        : 'All 60 seats are booked.';
    }

    if (submitBtn) {
      submitBtn.disabled = remaining === 0;
    }

    const sticker = document.querySelector('.seat-sticker');
    if (sticker && remaining < capacity) {
      const strong = sticker.querySelector('strong');
      const small = sticker.querySelector('small:last-child');
      if (strong) strong.textContent = remaining === 0 ? 'FULL' : `${remaining} LEFT`;
      if (small) small.textContent = remaining === 0 ? 'BOOKED' : 'AVAILABLE!';
      sticker.setAttribute('aria-label', `${remaining} workshop seats available. Open registration.`);
    }
  } catch {
    /* Errors handled when submitting */
  }
}

// Modal open triggers
document.querySelectorAll('[data-details]').forEach(btn => {
  btn.onclick = () => {
    if (eventSettings.registrationUrl && /^https:\/\//.test(eventSettings.registrationUrl)) {
      location.assign(eventSettings.registrationUrl);
      return;
    }
    statusLine.textContent = '';
    statusLine.className = '';
    dialog.showModal();
    if (pass) {
      showPass();
    } else {
      refreshSeats();
    }
  };
});

/**
 * Registration form submission handler
 */
form.addEventListener('submit', async e => {
  e.preventDefault();

  const formData = new FormData(form);
  const fullName = (formData.get('fullName') || '').toString().trim();
  const collegeEmail = (formData.get('collegeEmail') || '').toString().trim().toLowerCase();
  const rollNumber = (formData.get('rollNumber') || '').toString().trim().toUpperCase();
  const branch = (formData.get('branch') || '').toString().trim();
  const yearOfStudy = (formData.get('yearOfStudy') || '').toString().trim();
  const section = (formData.get('section') || '').toString().trim().toUpperCase();

  // Validate fields
  if (fullName.length < 2) {
    statusLine.textContent = 'Please enter your full name (minimum 2 characters).';
    statusLine.className = 'error';
    form.querySelector('input[name="fullName"]').focus();
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(collegeEmail)) {
    statusLine.textContent = 'Please enter a valid college email address.';
    statusLine.className = 'error';
    form.querySelector('input[name="collegeEmail"]').focus();
    return;
  }

  if (!rollNumber) {
    statusLine.textContent = 'Please enter your Roll Number.';
    statusLine.className = 'error';
    form.querySelector('input[name="rollNumber"]').focus();
    return;
  }

  if (!branch) {
    statusLine.textContent = 'Please select your Branch.';
    statusLine.className = 'error';
    form.querySelector('select[name="branch"]').focus();
    return;
  }

  if (!yearOfStudy) {
    statusLine.textContent = 'Please select your Year of Study.';
    statusLine.className = 'error';
    form.querySelector('select[name="yearOfStudy"]').focus();
    return;
  }

  if (!section) {
    statusLine.textContent = 'Please select your Section.';
    statusLine.className = 'error';
    form.querySelector('select[name="section"]').focus();
    return;
  }

  // Double-submission lock & button loading state
  submitBtn.disabled = true;
  submitBtnText.textContent = 'Locking in your seat...';
  statusLine.textContent = 'Locking in your seat...';
  statusLine.className = 'loading';

  const passId = generatePassId(rollNumber);
  const timestamp = new Date().toISOString();

  const payload = {
    timestamp,
    passId,
    fullName,
    collegeEmail,
    rollNumber,
    branch,
    yearOfStudy,
    section
  };

  try {
    let emailSent = false;

    // Priority 1: Save Registrations to Google Sheets
    const sheetUrl = eventSettings.googleSheetUrl ||
      window.VITE_GOOGLE_SHEET_URL ||
      window.NEXT_PUBLIC_GOOGLE_SHEET_URL ||
      window.GOOGLE_SHEET_URL;

    let resData = null;

    if (sheetUrl && /^https:\/\/script\.google\.com\//.test(sheetUrl)) {
      const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      try {
        resData = await response.json();
      } catch {
        resData = { status: 'success' };
      }

      if (resData.status === 'duplicate') {
        throw new Error(resData.error || 'This roll number or email is already registered.');
      }
      if (resData.status === 'full') {
        throw new Error(resData.error || 'All 60 seats are booked. Workshop is full.');
      }
      if (resData.status === 'error') {
        throw new Error(resData.error || 'Failed to record registration in Google Sheet.');
      }
      if (resData.emailSent) {
        emailSent = true;
      }
    } else {
      // Fallback for local preview if Google Sheet URL is not configured yet
      try {
        const r = await fetch('/api/registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fullName, email: collegeEmail, key: requestKey })
        });
        if (!r.ok) {
          const errData = await r.json();
          if (errData.error) throw new Error(errData.error);
        }
      } catch (localErr) {
        // If local D1 endpoint is also unconfigured, allow preview pass generation
        if (!localErr.message?.includes('fetch')) {
          throw localErr;
        }
      }
    }

    // Priority 2: Dispatch Spider-Verse Pass via EmailJS (if not already emailed by Google Sheet)
    if (!emailSent) {
      const emailConfig = eventSettings.emailjs || {};
      const serviceId = emailConfig.serviceId || window.VITE_EMAILJS_SERVICE_ID || window.EMAILJS_SERVICE_ID;
      const templateId = emailConfig.templateId || window.VITE_EMAILJS_TEMPLATE_ID || window.EMAILJS_TEMPLATE_ID;
      const publicKey = emailConfig.publicKey || window.VITE_EMAILJS_PUBLIC_KEY || window.EMAILJS_PUBLIC_KEY;

      if (window.emailjs && serviceId && templateId && publicKey) {
        try {
          await window.emailjs.send(
            serviceId,
            templateId,
            {
              to_name: fullName,
              to_email: collegeEmail,
              pass_id: passId,
              roll_number: rollNumber,
              branch: branch,
              year: yearOfStudy,
              section: section,
              event_name: 'AWS-VERSE',
              event_dates: 'November 27–28, 2026 · 9:00 AM–4:30 PM',
              venue: eventSettings.venue || 'ENL Block Seminar Hall, Ground Floor, BVRIT Narsapur'
            },
            publicKey
          );
          emailSent = true;
        } catch (emailErr) {
          // Fail-safe: If EmailJS fails, DO NOT fail registration. Confirmed pass still displays.
          console.warn('EmailJS pass dispatch failed (fail-safe active):', emailErr);
          emailSent = false;
        }
      }
    }

    // Save pass details in session storage
    const officialPassId = resData?.passId || passId;
    pass = {
      ...payload,
      passId: officialPassId,
      code: officialPassId,
      name: fullName,
      emailSent
    };

    try {
      sessionStorage.setItem('verse-pass', JSON.stringify(pass));
    } catch {}

    showPass();
    statusLine.textContent = 'Registration confirmed for both days!';
    statusLine.className = 'success';
    document.querySelector('#save-pass')?.focus();
    refreshSeats();

  } catch (error) {
    statusLine.textContent = error.message || 'Connection interrupted. You can safely retry.';
    statusLine.className = 'error';
    submitBtn.disabled = false;
    submitBtnText.textContent = 'Lock in your seat';
    refreshSeats();
  }
});

/**
 * Generate and download Spider-Verse Canvas Pass ticket (PNG)
 */
document.querySelector('#save-pass').onclick = async () => {
  if (!pass) return;
  await document.fonts.ready;

  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 660;
  const g = c.getContext('2d');

  // Background
  g.fillStyle = '#110b14';
  g.fillRect(0, 0, 1200, 660);

  // Comic dot pattern
  for (let y = 0; y < 660; y += 8) {
    for (let x = 0; x < 1200; x += 8) {
      g.fillStyle = 'rgba(160, 86, 94, 0.18)';
      g.fillRect(x, y, 1.5, 1.5);
    }
  }

  // Top crimson border line
  g.fillStyle = '#ff4856';
  g.fillRect(0, 0, 1200, 12);

  // Title "AWS-VERSE"
  g.font = 'italic 900 115px Display, Impact, sans-serif';
  g.fillStyle = '#ffffff';
  g.fillText('AWS-VERSE', 64, 150);

  // Monospace Pass Kicker
  g.font = '700 24px Mono, monospace';
  g.fillStyle = '#95e6df';
  g.fillText('TWO-DAY CLOUD WORKSHOP PASS', 68, 204);

  // "ADMIT ONE" badge
  g.save();
  g.translate(1030, 120);
  g.rotate(-0.12);
  g.fillStyle = '#95e6df';
  g.fillRect(-90, -25, 180, 50);
  g.strokeStyle = '#121c1a';
  g.lineWidth = 3;
  g.strokeRect(-90, -25, 180, 50);
  g.font = 'italic 900 24px Display, Impact, sans-serif';
  g.fillStyle = '#101a18';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('ADMIT ONE', 0, 0);
  g.restore();

  // Attendee Full Name
  g.fillStyle = '#faf2e7';
  g.font = '800 58px Head, Impact, sans-serif';
  g.fillText(pass.fullName || pass.name || '', 66, 305, 1060);

  // Student Details: Roll Number & Department
  g.font = '600 28px Body, Arial, sans-serif';
  g.fillStyle = '#ff7580';
  const rollText = `Roll: ${pass.rollNumber || 'N/A'}`;
  g.fillText(rollText, 68, 360);

  g.fillStyle = '#dcd4dc';
  const deptText = `•   ${pass.branch || ''}  (${pass.yearOfStudy || ''}, Sec ${pass.section || ''})`;
  g.fillText(deptText, 68 + g.measureText(rollText).width + 20, 360);

  // Event Date and Venue
  g.font = '500 26px Body, Arial, sans-serif';
  g.fillStyle = '#cec5cb';
  g.fillText('November 27–28, 2026   ·   9:00 AM – 4:30 PM', 68, 424);
  g.fillText(eventSettings.venue || 'ENL Block Seminar Hall, Ground Floor, BVRIT Narsapur', 68, 468);

  // Dashed coupon tear line
  g.setLineDash([9, 9]);
  g.strokeStyle = '#855c65';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 520);
  g.lineTo(1200, 520);
  g.stroke();

  // Bottom Pass ID Code
  g.setLineDash([]);
  g.font = '700 32px Mono, monospace';
  g.fillStyle = '#ff4f5e';
  g.fillText(pass.passId || pass.code || '', 68, 595);

  g.font = '500 20px Mono, monospace';
  g.fillStyle = '#95e6df';
  g.fillText('PRESENT AT CHECK-IN  ·  LIMITED 60 SEATS', 580, 595);

  // Download
  const blob = await new Promise(resolve => c.toBlob(resolve));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AWS-VERSE-${pass.passId || pass.code || 'PASS'}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
};

// Initial seat check
refreshSeats();
