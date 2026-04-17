// ══════════════════════════════════════════════════
//  MKC Registration Form — js/register.js
// ══════════════════════════════════════════════════

// ⚠ Paste your Google Apps Script Web App URL here
var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzyYtmDzlW4R4wEPHbA4qixVVmHrAZ8dfWWg8kFif_4ab5u9rcjEnkqIREOb2KlV71/exec
';

var currentStep  = 1;
var uploadedFile = null;
var photoData    = { self: null, spouse: null };
var driveLinks   = { receipt: '', photoSelf: '', photoSpouse: '' };

// ── PHOTO HANDLER ──
function handlePhoto(who, input) {
  var file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert('Photo too large. Maximum 2MB allowed.'); input.value=''; return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    photoData[who] = { dataUrl: e.target.result, name: file.name, mime: file.type };
    var box  = document.getElementById('photoBox-' + who);
    var slot = document.getElementById('photoSlot-' + who);
    if (!box || !slot) return;
    // Remove old preview if any
    var old = box.querySelector('img');
    if (old) old.remove();
    // Create new preview image
    var img     = document.createElement('img');
    img.src     = e.target.result;
    img.alt     = who + ' photo';
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:8px;z-index:2;';
    box.appendChild(img);
    box.classList.add('has-photo');
    slot.classList.add('has-photo');
  };
  reader.onerror = function() {
    alert('Could not read the photo file. Please try again.');
  };
  reader.readAsDataURL(file);
}

// Attach change listeners via JS as backup (in addition to onchange attribute)
document.addEventListener('DOMContentLoaded', function() {
  ['self','spouse'].forEach(function(who) {
    var inp = document.getElementById('photoInput-' + who);
    if (inp) {
      inp.addEventListener('change', function() {
        handlePhoto(who, this);
      });
    }
  });
  // Also attach receipt change listener
  var rec = document.getElementById('receiptFile');
  if (rec) {
    rec.addEventListener('change', function() {
      handleUpload(this);
    });
  }
});

// ── RECEIPT HANDLER ──
function handleUpload(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); input.value=''; return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    uploadedFile = { dataUrl: e.target.result, name: file.name, mime: file.type };
    var prev = document.getElementById('uploadPreview');
    var zone = document.getElementById('uploadZone');
    var name = document.getElementById('uploadName');
    if (prev) prev.style.display = 'flex';
    if (zone) zone.style.display = 'none';
    if (name) name.textContent = file.name;
  };
  reader.onerror = function() { alert('Could not read the file. Please try again.'); };
  reader.readAsDataURL(file);
}

function clearUpload() {
  uploadedFile = null; driveLinks.receipt = '';
  document.getElementById('receiptFile').value = '';
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadZone').style.display = 'block';
}

(function() {
  var zone = document.getElementById('uploadZone');
  if (!zone) return;
  zone.addEventListener('dragover', function(e){ e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', function(){ zone.classList.remove('drag-over'); });
  zone.addEventListener('drop', function(e){
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
    if (i < currentStep)        { sc.className='step-circle done';    sc.innerHTML='✓'; }
    else if (i === currentStep)  { sc.className='step-circle active';  sc.innerHTML=i;   }
    else                         { sc.className='step-circle pending'; sc.innerHTML=i;   }
    sl.className = 'step-lbl' + (i === currentStep ? ' active' : '');
    if (i < 5) { var cn = document.getElementById('cn' + i); if (cn) cn.className = 'step-conn' + (i < currentStep ? ' done' : ''); }
  }
}

function validateStep(s) {
  if (s === 1) return checkFields([
    ['f-fname','fname','text'],['f-lname','lname','text'],
    ['f-gender','gender','select'],['f-email','email','email'],['f-mobile','mobile','mobile']
  ]);
  if (s === 4) {
    var ok = checkFields([['f-payref','payref','text']]);
    if (!uploadedFile) { alert('Please upload your payment receipt.'); return false; }
    if (!document.getElementById('paymethod').value) { alert('Please select payment method.'); return false; }
    return ok;
  }
  return true;
}

function checkFields(arr) {
  var ok = true;
  arr.forEach(function(c) {
    var wrap = document.getElementById(c[0]); if (!wrap) return;
    var val  = (document.getElementById(c[1])||{}).value||''; val = val.trim();
    var bad  = c[2]==='email'  ? (!val||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) :
               c[2]==='mobile' ? (!val||!/^\d{10}$/.test(val)) : !val;
    wrap.classList.toggle('has-error', bad);
    var em = wrap.querySelector('.error-msg');
    if (em) em.style.display = bad ? 'block' : 'none';
    if (bad) ok = false;
  });
  return ok;
}

function toggleChip(el) { el.classList.toggle('selected'); }

function buildSummary() {
  var chips = Array.from(document.querySelectorAll('.chip.selected')).map(function(c){return c.textContent;}).join(', ');
  var rows = [
    ['Full Name',(v('fname')+' '+v('lname')).trim()],['Gender',v('gender')],
    ['Date of Birth',v('dob')||'—'],['Occupation',v('occ')||'—'],
    ['Email',v('email')],['Mobile',v('mobile')+(document.getElementById('whatsapp').checked?' (WhatsApp ✓)':'')],
    ['Spouse Name',v('spouse')||'—'],['City / PIN',(v('city')||'')+(v('pin')?' – '+v('pin'):'')],
    ['Payment Method',v('paymethod')],['Payment Ref',v('payref')],
    ['Receipt', uploadedFile?'✓ '+uploadedFile.name:'—'],
    ['Photo (Self)', photoData.self?'✓ '+photoData.self.name:'—'],
    ['Photo (Spouse)', photoData.spouse?'✓ '+photoData.spouse.name:'—'],
  ];
  var html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">';
  rows.forEach(function(r,i){
    var odd=i%2===0;
    html+='<div style="padding:8px 0 8px '+(odd?'0':'1rem')+';border-bottom:1px solid var(--ivory-border);'+(odd?'padding-right:1rem;':'border-left:1px solid var(--ivory-border);')+'">';
    html+='<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:2px;">'+r[0]+'</div>';
    html+='<div style="font-size:14px;color:var(--navy);font-weight:500;">'+(r[1]||'—')+'</div></div>';
  });
  html+='</div>';
  document.getElementById('summaryBody').innerHTML = html;
}

function v(id) { var el=document.getElementById(id); return el?el.value.trim():''; }

// ══════════════════════════════════════════════════
//  CHUNKED FILE UPLOAD via JSONP
//  Splits base64 into 6000-char chunks (safe URL length)
//  Sends each chunk as a separate GET request
//  Server assembles chunks and saves to Drive
// ══════════════════════════════════════════════════
var CHUNK_SIZE = 6000;  // chars of base64 per request — safe for URL length limits
var _cbCount = 0;

function jsonpGet(url, timeoutMs) {
  timeoutMs = timeoutMs || 20000;
  return new Promise(function(resolve) {
    var cbName = '_mkc_' + (++_cbCount) + '_' + Date.now();
    var script = document.createElement('script');
    var done   = false;
    var timer  = setTimeout(function() {
      if (done) return;
      done = true; script.remove(); delete window[cbName];
      resolve({ status: 'timeout' });
    }, timeoutMs);
    window[cbName] = function(data) {
      if (done) return;
      done = true; clearTimeout(timer); script.remove(); delete window[cbName];
      resolve(data);
    };
    script.onerror = function() {
      if (done) return;
      done = true; clearTimeout(timer); script.remove(); delete window[cbName];
      resolve({ status: 'error', message: 'script load failed' });
    };
    script.src = url + '&callback=' + cbName;
    document.head.appendChild(script);
  });
}

function uploadFileInChunks(fileObj, appID, label) {
  if (!fileObj || !fileObj.dataUrl) return Promise.resolve('');
  if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') return Promise.resolve('');

  var b64    = fileObj.dataUrl.split(',')[1];
  var mime   = fileObj.mime   || 'image/jpeg';
  var fname  = fileObj.name   || 'file';
  var total  = Math.ceil(b64.length / CHUNK_SIZE);
  var fileID = appID + '_' + label + '_' + Date.now(); // unique assembly key on server

  // Send chunks sequentially
  var promise = Promise.resolve();
  for (var i = 0; i < total; i++) {
    (function(idx) {
      promise = promise.then(function() {
        var chunk   = b64.substring(idx * CHUNK_SIZE, (idx + 1) * CHUNK_SIZE);
        var url     = SCRIPT_URL
          + '?action=uploadChunk'
          + '&fileID='   + encodeURIComponent(fileID)
          + '&appID='    + encodeURIComponent(appID)
          + '&label='    + encodeURIComponent(label)
          + '&fileName=' + encodeURIComponent(fname)
          + '&mimeType=' + encodeURIComponent(mime)
          + '&chunkIdx=' + idx
          + '&totalChunks=' + total
          + '&chunk='    + encodeURIComponent(chunk);
        return jsonpGet(url, 25000);
      });
    })(i);
  }

  // Final call to assemble chunks into Drive file
  return promise.then(function() {
    var url = SCRIPT_URL
      + '?action=assembleFile'
      + '&fileID='   + encodeURIComponent(fileID)
      + '&appID='    + encodeURIComponent(appID)
      + '&label='    + encodeURIComponent(label)
      + '&fileName=' + encodeURIComponent(fname)
      + '&mimeType=' + encodeURIComponent(mime)
      + '&totalChunks=' + total;
    return jsonpGet(url, 30000);
  }).then(function(resp) {
    if (resp && resp.status === 'ok' && resp.link) return resp.link;
    console.warn('Upload response for ' + label + ':', resp);
    return '';
  });
}

// ── SUBMIT ──
function submitForm() {
  if (!document.getElementById('agree').checked || !document.getElementById('accurate').checked) {
    showAlert('Please check both declaration checkboxes before submitting.', 'warning');
    return;
  }

  var btn = document.getElementById('submitBtn');
  btn.disabled    = true;
  btn.textContent = 'Uploading receipt…';

  var chips = Array.from(document.querySelectorAll('.chip.selected')).map(function(c){return c.textContent;}).join(', ');
  var appID = 'MKC-' + new Date().getFullYear() + '-' + (Math.floor(Math.random()*9000)+1000);
  var now   = new Date().toLocaleString('en-IN');

  // Upload sequentially: receipt → self photo → spouse photo
  uploadFileInChunks(uploadedFile, appID, 'receipt')
  .then(function(lnk) {
    driveLinks.receipt = lnk;
    btn.textContent = 'Uploading self photo…';
    return uploadFileInChunks(photoData.self, appID, 'photo_self');
  })
  .then(function(lnk) {
    driveLinks.photoSelf = lnk;
    btn.textContent = 'Uploading spouse photo…';
    return uploadFileInChunks(photoData.spouse, appID, 'photo_spouse');
  })
  .then(function(lnk) {
    driveLinks.photoSpouse = lnk;
    btn.textContent = 'Saving registration…';

    var data = {
      action: 'saveRegistration', appID: appID, submittedAt: now,
      firstName: v('fname'), lastName: v('lname'), gender: v('gender'),
      dob: v('dob'), occupation: v('occ'), email: v('email'),
      mobile: v('mobile'), mobileSpouse: v('mobile2'),
      whatsapp: document.getElementById('whatsapp').checked ? 'Yes' : 'No',
      residentialAddress: v('raddr'), city: v('city'), state: v('state'), pin: v('pin'),
      officeAddress: v('oaddr'), spouseName: v('spouse'), spouseDob: v('sdob'),
      anniversary: v('anniv'), dependants: v('dep'), interests: chips,
      referredBy: v('refby'), membershipType: 'Annual',
      baseAmount: 25000, cgst: 2250, sgst: 2250, totalAmount: 29500,
      paymentMethod: v('paymethod'), paymentRef: v('payref'),
      paymentDate: v('paydate'), amountPaid: v('payamt'), payNotes: v('paynotes'),
      status: 'Pending Verification',
      receiptFileName:  uploadedFile        ? uploadedFile.name       : '',
      photoSelfName:    photoData.self      ? photoData.self.name     : '',
      photoSpouseName:  photoData.spouse    ? photoData.spouse.name   : '',
      receiptLink:      driveLinks.receipt  || '',
      photoSelfLink:    driveLinks.photoSelf || '',
      photoSpouseLink:  driveLinks.photoSpouse || ''
    };

    if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
      console.log('DEMO:', data); showSuccess(appID); return Promise.resolve();
    }

    return fetch(SCRIPT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  })
  .then(function() { showSuccess(appID); })
  .catch(function(err) {
    console.log('Submit note (no-cors expected):', err);
    showSuccess(appID);
  });
}

function showAlert(msg, type) {
  var el = document.getElementById('submitAlert');
  el.style.display = 'block'; el.className = 'alert alert-' + type; el.textContent = msg;
}

function showSuccess(appID) {
  document.getElementById('step5').style.display   = 'none';
  document.getElementById('stepper').style.display  = 'none';
  document.getElementById('stepSuccess').style.display = 'block';
  document.getElementById('successID').textContent  = appID;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() { location.reload(); }
