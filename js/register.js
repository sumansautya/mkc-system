// ══════════════════════════════════════════════════
//  MKC Registration Form — js/register.js
//  Replace SCRIPT_URL with your Google Apps Script URL
// ══════════════════════════════════════════════════
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyBUtnmezAOThr2vxHfZ6dP3XUbkbHVuhMhqGdD7xnDotCzVKzYySw0KXNlqGs8397Y/exec';

var currentStep = 1;
var uploadedFile = null;

// ── PHOTO UPLOAD ──
var photoData = { self: null, spouse: null };

function handlePhoto(who, input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('Photo too large. Maximum 2MB per photo.'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    photoData[who] = { dataUrl: e.target.result, name: file.name };
    var box = document.getElementById('photoBox-' + who);
    var slot = document.getElementById('photoSlot-' + who);
    // Show preview
    var existing = box.querySelector('img');
    if (existing) existing.remove();
    var img = document.createElement('img');
    img.src = e.target.result;
    img.alt = who + ' photo';
    box.appendChild(img);
    box.classList.add('has-photo');
    slot.classList.add('has-photo');
  };
  reader.readAsDataURL(file);
}


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
    if (i < currentStep) { sc.className = 'step-circle done'; sc.innerHTML = '✓'; }
    else if (i === currentStep) { sc.className = 'step-circle active'; sc.innerHTML = i; }
    else { sc.className = 'step-circle pending'; sc.innerHTML = i; }
    sl.className = 'step-lbl' + (i === currentStep ? ' active' : '');
    if (i < 5) {
      var cn = document.getElementById('cn' + i);
      if (cn) cn.className = 'step-conn' + (i < currentStep ? ' done' : '');
    }
  }
}

// ── VALIDATION ──
function validateStep(s) {
  if (s === 1) {
    return checkFields([
      ['f-fname','fname','text'],['f-lname','lname','text'],
      ['f-gender','gender','select'],['f-email','email','email'],['f-mobile','mobile','mobile']
    ]);
  }
  if (s === 4) {
    var ok = checkFields([['f-payref','payref','text']]);
    if (!uploadedFile) { alert('Please upload your payment receipt before proceeding.'); return false; }
    var pm = document.getElementById('paymethod').value;
    if (!pm) { alert('Please select a payment method.'); return false; }
    return ok;
  }
  return true;
}

function checkFields(arr) {
  var ok = true;
  arr.forEach(function(c) {
    var wrap = document.getElementById(c[0]);
    if (!wrap) return;
    var el = document.getElementById(c[1]);
    var val = el ? el.value.trim() : '';
    var bad = false;
    if (c[2] === 'email') bad = !val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    else if (c[2] === 'mobile') bad = !val || !/^\d{10}$/.test(val);
    else bad = !val;
    wrap.classList.toggle('has-error', bad);
    var em = wrap.querySelector('.error-msg');
    if (em) em.style.display = bad ? 'block' : 'none';
    if (bad) ok = false;
  });
  return ok;
}

// ── CHIPS ──
function toggleChip(el) { el.classList.toggle('selected'); }

// ── FILE UPLOAD ──
function handleUpload(input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return; }
  uploadedFile = file;
  document.getElementById('uploadPreview').style.display = 'flex';
  document.getElementById('uploadName').textContent = file.name;
  document.getElementById('uploadZone').style.display = 'none';
}
function clearUpload() {
  uploadedFile = null;
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
    var file = e.dataTransfer.files[0];
    if (file) { document.getElementById('receiptFile').files = e.dataTransfer.files; handleUpload(document.getElementById('receiptFile')); }
  });
})();

// ── BUILD SUMMARY ──
function buildSummary() {
  var chips = Array.from(document.querySelectorAll('.chip.selected')).map(function(c){return c.textContent;}).join(', ');
  var rows = [
    ['Full Name', (v('fname') + ' ' + v('lname')).trim()],
    ['Gender', v('gender')], ['Date of Birth', v('dob') || '—'], ['Occupation', v('occ') || '—'],
    ['Email', v('email')], ['Mobile', v('mobile') + (document.getElementById('whatsapp').checked ? ' (WhatsApp ✓)' : '')],
    ['Mobile (Spouse)', v('mobile2') || '—'],
    ['Residential Address', v('raddr') || '—'], ['City / PIN', (v('city') || '') + (v('pin') ? ' – ' + v('pin') : '')],
    ['Spouse Name', v('spouse') || '—'], ['Anniversary', v('anniv') || '—'],
    ['Dependants', v('dep') || '—'], ['Interests', chips || '—'],
    ['Referred By', v('refby') || '—'],
    ['Payment Method', v('paymethod')], ['Payment Reference', v('payref')],
    ['Payment Date', v('paydate') || '—'], ['Amount Paid', '₹' + v('payamt')],
    ['Receipt File', uploadedFile ? uploadedFile.name : '—'],
  ];
  var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">';
  rows.forEach(function(r, i) {
    var isOdd = i % 2 === 0;
    html += '<div style="padding:8px 0 8px ' + (isOdd ? '0' : '1rem') + ';border-bottom:1px solid var(--ivory-border);' + (!isOdd ? 'border-left:1px solid var(--ivory-border);padding-right:0;' : 'padding-right:1rem;') + '">';
    html += '<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:2px;">' + r[0] + '</div>';
    html += '<div style="font-size:14px;color:var(--navy);font-weight:500;">' + (r[1] || '—') + '</div></div>';
  });
  html += '</div>';
  document.getElementById('summaryBody').innerHTML = html;
}

function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

// ── SUBMIT ──
function submitForm() {
  if (!document.getElementById('agree').checked || !document.getElementById('accurate').checked) {
    showAlert('Please check both declaration checkboxes before submitting.', 'warning');
    return;
  }
  var chips = Array.from(document.querySelectorAll('.chip.selected')).map(function(c){return c.textContent;}).join(', ');
  var appID = 'MKC-' + new Date().getFullYear() + '-' + (Math.floor(Math.random()*9000)+1000);
  var now = new Date().toLocaleString('en-IN');

  var data = {
    appID: appID, submittedAt: now,
    firstName: v('fname'), lastName: v('lname'), gender: v('gender'),
    dob: v('dob'), occupation: v('occ'),
    email: v('email'), mobile: v('mobile'), mobileSpouse: v('mobile2'),
    whatsapp: document.getElementById('whatsapp').checked ? 'Yes' : 'No',
    residentialAddress: v('raddr'), city: v('city'), state: v('state'), pin: v('pin'),
    officeAddress: v('oaddr'), spouseName: v('spouse'), spouseDob: v('sdob'),
    anniversary: v('anniv'), dependants: v('dep'), interests: chips,
    referredBy: v('refby'), membershipType: 'Annual',
    baseAmount: 25000, cgst: 2250, sgst: 2250, totalAmount: 29500,
    paymentMethod: v('paymethod'), paymentRef: v('payref'),
    paymentDate: v('paydate'), amountPaid: v('payamt'),
    payNotes: v('paynotes'), receiptFileName: uploadedFile ? uploadedFile.name : '',
    status: 'Pending Verification',
    photoSelfName: photoData.self ? photoData.self.name : '',
    photoSpouseName: photoData.spouse ? photoData.spouse.name : ''
  };

  var btn = document.getElementById('submitBtn');
  btn.disabled = true; btn.textContent = 'Submitting...';

  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
    // Demo mode
    console.log('DEMO — would save:', data);
    setTimeout(function() { showSuccess(appID); }, 800);
    return;
  }

  fetch(SCRIPT_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(function() {
    showSuccess(appID);
  }).catch(function(err) {
    btn.disabled = false; btn.textContent = '✓ Submit Application';
    showAlert('Submission failed. Please check your connection and try again.', 'danger');
  });
}

function showAlert(msg, type) {
  var el = document.getElementById('submitAlert');
  el.style.display = 'block';
  el.className = 'alert alert-' + type;
  el.textContent = msg;
}

function showSuccess(appID) {
  document.getElementById('step5').style.display = 'none';
  document.getElementById('stepper').style.display = 'none';
  document.getElementById('stepSuccess').style.display = 'block';
  document.getElementById('successID').textContent = appID;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  location.reload();
}
