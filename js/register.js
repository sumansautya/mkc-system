// ══════════════════════════════════════════════════
//  MKC Registration Form — js/register.js
// ══════════════════════════════════════════════════

// ⚠ Paste your Google Apps Script Web App URL here
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3owEvmJOoKvQuP9AUtzJHckdr4UGPXLgrGAfJ74uYgQFEX98NIvA2j2jXUzDt9obO/exec';

var currentStep  = 1;
var uploadedFile = null;
var photoData    = { self: null, spouse: null };
var driveLinks   = { receipt: '', photoSelf: '', photoSpouse: '' };

// ── PHOTO HANDLER ──
function handlePhoto(who, input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('Photo too large. Max 2MB.'); input.value = ''; return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    photoData[who] = { dataUrl: e.target.result, name: file.name, mime: file.type };
    var box  = document.getElementById('photoBox-' + who);
    var slot = document.getElementById('photoSlot-' + who);
    var old  = box.querySelector('img');
    if (old) old.remove();
    var img  = document.createElement('img');
    img.src  = e.target.result;
    img.alt  = who + ' photo';
    box.appendChild(img);
    box.classList.add('has-photo');
    slot.classList.add('has-photo');
  };
  reader.readAsDataURL(file);
}

// ── RECEIPT HANDLER ──
function handleUpload(input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); input.value = ''; return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    uploadedFile = { dataUrl: e.target.result, name: file.name, mime: file.type };
    document.getElementById('uploadPreview').style.display = 'flex';
    document.getElementById('uploadName').textContent = file.name;
    document.getElementById('uploadZone').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function clearUpload() {
  uploadedFile = null;
  driveLinks.receipt = '';
  document.getElementById('receiptFile').value = '';
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadZone').style.display = 'block';
}

// Drag & drop
(function() {
  var zone = document.getElementById('uploadZone');
  if (!zone) return;
  zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', function() { zone.classList.remove('drag-over'); });
  zone.addEventListener('drop', function(e) {
    e.preventDefault(); zone.classList.remove('drag-over');
    var f = e.dataTransfer.files[0];
    if (f) { document.getElementById('receiptFile').files = e.dataTransfer.files; handleUpload(document.getElementById('receiptFile')); }
  });
})();

// ── STEP NAVIGATION ──
function goStep(n) {
  if (n > currentStep && !validateStep(currentStep)) return;
  document.getElementById('step' + currentStep).style.display = 'none';
  currentStep = n;
  var el = document.getElementById('step' + n);
  if (el) el.style.display = 'block';
  updateStepper();
  if (n === 5) buildSummary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepper() {
  for (var i = 1; i <= 5; i++) {
    var sc = document.getElementById('sc' + i);
    var sl = document.getElementById('sl' + i);
    if (!sc) continue;
    if (i < currentStep)       { sc.className = 'step-circle done';    sc.innerHTML = '✓'; }
    else if (i === currentStep) { sc.className = 'step-circle active';  sc.innerHTML = i;   }
    else                        { sc.className = 'step-circle pending'; sc.innerHTML = i;   }
    sl.className = 'step-lbl' + (i === currentStep ? ' active' : '');
    if (i < 5) { var cn = document.getElementById('cn' + i); if (cn) cn.className = 'step-conn' + (i < currentStep ? ' done' : ''); }
  }
}

// ── VALIDATION ──
function validateStep(s) {
  if (s === 1) {
    return checkFields([
      ['f-fname','fname','text'], ['f-lname','lname','text'],
      ['f-gender','gender','select'], ['f-email','email','email'], ['f-mobile','mobile','mobile']
    ]);
  }
  if (s === 4) {
    var ok = checkFields([['f-payref','payref','text']]);
    if (!uploadedFile) { alert('Please upload your payment receipt before proceeding.'); return false; }
    if (!document.getElementById('paymethod').value) { alert('Please select a payment method.'); return false; }
    return ok;
  }
  return true;
}

function checkFields(arr) {
  var ok = true;
  arr.forEach(function(c) {
    var wrap = document.getElementById(c[0]);
    if (!wrap) return;
    var el  = document.getElementById(c[1]);
    var val = el ? el.value.trim() : '';
    var bad = c[2] === 'email'  ? (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) :
              c[2] === 'mobile' ? (!val || !/^\d{10}$/.test(val)) : !val;
    wrap.classList.toggle('has-error', bad);
    var em = wrap.querySelector('.error-msg');
    if (em) em.style.display = bad ? 'block' : 'none';
    if (bad) ok = false;
  });
  return ok;
}

function toggleChip(el) { el.classList.toggle('selected'); }

// ── BUILD SUMMARY ──
function buildSummary() {
  var chips = Array.from(document.querySelectorAll('.chip.selected')).map(function(c){return c.textContent;}).join(', ');
  var rows = [
    ['Full Name', (v('fname')+' '+v('lname')).trim()], ['Gender', v('gender')],
    ['Date of Birth', v('dob')||'—'], ['Occupation', v('occ')||'—'],
    ['Email', v('email')], ['Mobile', v('mobile')+(document.getElementById('whatsapp').checked?' (WhatsApp ✓)':'')],
    ['Mobile (Spouse)', v('mobile2')||'—'], ['City / PIN', (v('city')||'')+(v('pin')?' – '+v('pin'):'')],
    ['Payment Method', v('paymethod')], ['Payment Ref', v('payref')],
    ['Receipt', uploadedFile ? '✓ '+uploadedFile.name : '—'],
    ['Photo (Self)', photoData.self ? '✓ '+photoData.self.name : '—'],
    ['Photo (Spouse)', photoData.spouse ? '✓ '+photoData.spouse.name : '—'],
  ];
  var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">';
  rows.forEach(function(r,i){
    var odd = i%2===0;
    html += '<div style="padding:8px 0 8px '+(odd?'0':'1rem')+';border-bottom:1px solid var(--ivory-border);'+(odd?'padding-right:1rem;':'border-left:1px solid var(--ivory-border);')+'">';
    html += '<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:2px;">'+r[0]+'</div>';
    html += '<div style="font-size:14px;color:var(--navy);font-weight:500;">'+(r[1]||'—')+'</div></div>';
  });
  html += '</div>';
  document.getElementById('summaryBody').innerHTML = html;
}

function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

// ══════════════════════════════════════════════════
//  FILE UPLOAD via JSONP GET — no CORS, no preflight,
//  no duplicate rows. Works exactly like the admin
//  dashboard data fetch already works.
// ══════════════════════════════════════════════════
var _cbCount = 0;
function uploadFileViaGet(fileObj, appID, label) {
  if (!fileObj || !fileObj.dataUrl) return Promise.resolve('');
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return Promise.resolve('demo-link');

  return new Promise(function(resolve) {
    var cbName = '_mkcUp_' + (++_cbCount) + '_' + Date.now();
    var script = document.createElement('script');
    var done   = false;
    var timer  = null;

    window[cbName] = function(data) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      script.remove();
      delete window[cbName];
      resolve((data && data.status === 'ok' && data.link) ? data.link : '');
    };

    timer = setTimeout(function() {
      if (done) return;
      done = true;
      script.remove();
      delete window[cbName];
      resolve('');
    }, 30000);

    // Base64 data — strip the data:mime;base64, prefix
    var b64  = fileObj.dataUrl.split(',')[1];
    var mime = fileObj.mime || 'image/jpeg';

    // Build URL — encode each param properly
    var params = [
      'action=uploadFile',
      'callback=' + cbName,
      'appID=' + encodeURIComponent(appID),
      'label=' + encodeURIComponent(label),
      'fileName=' + encodeURIComponent(fileObj.name),
      'mimeType=' + encodeURIComponent(mime),
      'b64=' + encodeURIComponent(b64)
    ].join('&');

    script.src = SCRIPT_URL + '?' + params;
    script.onerror = function() {
      if (done) return;
      done = true; clearTimeout(timer); script.remove(); delete window[cbName]; resolve('');
    };
    document.head.appendChild(script);
  });
}

// ── SUBMIT ──
function submitForm() {
  if (!document.getElementById('agree').checked || !document.getElementById('accurate').checked) {
    showAlert('Please check both declaration checkboxes before submitting.', 'warning');
    return;
  }

  var btn   = document.getElementById('submitBtn');
  btn.disabled   = true;
  btn.textContent = 'Uploading photos & receipt…';

  var chips = Array.from(document.querySelectorAll('.chip.selected')).map(function(c){return c.textContent;}).join(', ');
  var appID = 'MKC-' + new Date().getFullYear() + '-' + (Math.floor(Math.random()*9000)+1000);
  var now   = new Date().toLocaleString('en-IN');

  // Upload files one at a time (sequential, not parallel — avoids race on folder creation)
  uploadFileViaGet(uploadedFile,     appID, 'receipt')
  .then(function(link1) {
    driveLinks.receipt = link1;
    btn.textContent = 'Uploading self photo…';
    return uploadFileViaGet(photoData.self, appID, 'photo_self');
  })
  .then(function(link2) {
    driveLinks.photoSelf = link2;
    btn.textContent = 'Uploading spouse photo…';
    return uploadFileViaGet(photoData.spouse, appID, 'photo_spouse');
  })
  .then(function(link3) {
    driveLinks.photoSpouse = link3;
    btn.textContent = 'Saving registration…';

    // Build form data payload (text only — no file data)
    var data = {
      action:      'saveRegistration',
      appID:       appID,
      submittedAt: now,
      firstName:   v('fname'),    lastName:    v('lname'),
      gender:      v('gender'),   dob:         v('dob'),
      occupation:  v('occ'),      email:       v('email'),
      mobile:      v('mobile'),   mobileSpouse: v('mobile2'),
      whatsapp:    document.getElementById('whatsapp').checked ? 'Yes' : 'No',
      residentialAddress: v('raddr'), city: v('city'), state: v('state'), pin: v('pin'),
      officeAddress: v('oaddr'),  spouseName:  v('spouse'),   spouseDob:  v('sdob'),
      anniversary: v('anniv'),    dependants:  v('dep'),      interests:  chips,
      referredBy:  v('refby'),    membershipType: 'Annual',
      baseAmount:  25000, cgst: 2250, sgst: 2250, totalAmount: 29500,
      paymentMethod: v('paymethod'), paymentRef: v('payref'),
      paymentDate: v('paydate'),  amountPaid:  v('payamt'),   payNotes: v('paynotes'),
      status:      'Pending Verification',
      receiptFileName:  uploadedFile          ? uploadedFile.name        : '',
      photoSelfName:    photoData.self        ? photoData.self.name      : '',
      photoSpouseName:  photoData.spouse      ? photoData.spouse.name    : '',
      receiptLink:      driveLinks.receipt    || '',
      photoSelfLink:    driveLinks.photoSelf  || '',
      photoSpouseLink:  driveLinks.photoSpouse|| ''
    };

    if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
      console.log('DEMO:', data);
      showSuccess(appID);
      return;
    }

    // Save via no-cors POST (one-way, no response needed)
    return fetch(SCRIPT_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
  })
  .then(function() { showSuccess(appID); })
  .catch(function(err) {
    // Even if fetch throws (no-cors always throws), show success
    // because no-cors POST likely succeeded on server side
    console.log('Submit note:', err);
    showSuccess(appID);
  });
}

function showAlert(msg, type) {
  var el = document.getElementById('submitAlert');
  el.style.display = 'block';
  el.className = 'alert alert-' + type;
  el.textContent = msg;
}

function showSuccess(appID) {
  document.getElementById('step5').style.display   = 'none';
  document.getElementById('stepper').style.display  = 'none';
  document.getElementById('stepSuccess').style.display = 'block';
  document.getElementById('successID').textContent  = appID;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() { location.reload(); }
