// ══════════════════════════════════════════════════
//  MKC Admin Dashboard — js/admin.js
// ══════════════════════════════════════════════════

// ── ADMIN CREDENTIALS ──
// To change: update USERNAME and PASSWORD below, then re-upload this file to GitHub
var ADMIN_USERNAME = 'mkc_admin';
var ADMIN_PASSWORD = 'Manthan@2026';

// ── LOGIN STATE ──
var MAX_ATTEMPTS = 5;
var LOCKOUT_SECONDS = 30;
var SESSION_KEY = 'mkc_admin_session';
var failedAttempts = 0;
var lockoutTimer = null;
var isLocked = false;

function doLogin() {
  if (isLocked) return;
  var user = document.getElementById('loginUser').value.trim();
  var pass = document.getElementById('loginPass').value;
  var errorEl = document.getElementById('loginError');
  var attemptsEl = document.getElementById('attemptsMsg');

  if (!user || !pass) {
    showLoginError('Please enter both username and password.');
    return;
  }

  if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
    // ✅ SUCCESS
    failedAttempts = 0;
    sessionStorage.setItem(SESSION_KEY, 'authenticated');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';
    document.getElementById('adminAvatar').textContent = user.substring(0,2).toUpperCase();
    errorEl.style.display = 'none';
    attemptsEl.textContent = '';
    loadMembers(renderDashboard);
  } else {
    // ❌ FAILED
    failedAttempts++;
    var remaining = MAX_ATTEMPTS - failedAttempts;
    if (failedAttempts >= MAX_ATTEMPTS) {
      startLockout();
    } else {
      showLoginError('Incorrect username or password. Please try again.');
      attemptsEl.textContent = remaining + ' attempt' + (remaining === 1 ? '' : 's') + ' remaining before lockout.';
    }
    // Shake the card
    var card = document.querySelector('.login-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'shake 0.4s ease';
  }
}

function showLoginError(msg) {
  var el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.display = 'block';
}

function startLockout() {
  isLocked = true;
  var btn = document.getElementById('loginBtn');
  var lockedEl = document.getElementById('loginLocked');
  var errorEl = document.getElementById('loginError');
  var attemptsEl = document.getElementById('attemptsMsg');
  errorEl.style.display = 'none';
  lockedEl.style.display = 'block';
  btn.disabled = true;
  btn.style.opacity = '0.4';
  btn.style.cursor = 'not-allowed';
  attemptsEl.textContent = '';

  var secs = LOCKOUT_SECONDS;
  document.getElementById('lockTimer').textContent = secs;
  lockoutTimer = setInterval(function() {
    secs--;
    document.getElementById('lockTimer').textContent = secs;
    if (secs <= 0) {
      clearInterval(lockoutTimer);
      isLocked = false;
      failedAttempts = 0;
      lockedEl.style.display = 'none';
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      document.getElementById('loginPass').value = '';
      document.getElementById('loginUser').focus();
    }
  }, 1000);
}

function togglePwd() {
  var inp = document.getElementById('loginPass');
  var btn = document.getElementById('eyeBtn');
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

function doLogout() {
  if (!confirm('Sign out of Admin Panel?')) return;
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('attemptsMsg').textContent = '';
  failedAttempts = 0;
}

// ── CHECK SESSION ON LOAD ──
document.addEventListener('DOMContentLoaded', function() {
  // Add shake animation style
  var st = document.createElement('style');
  st.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}';
  document.head.appendChild(st);

  // Auto-login if session exists
  if (sessionStorage.getItem(SESSION_KEY) === 'authenticated') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';
    loadMembers(renderDashboard);
  } else {
    document.getElementById('loginUser').focus();
  }

  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(function(b){
    b.addEventListener('click', function(e){ if(e.target===b) b.classList.remove('open'); });
  });
});


// ── GOOGLE APPS SCRIPT URL ──
// Paste your deployed Web App URL here (same URL used in register.js)
var GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';

// ── LIVE DATA ──
var MEMBERS = [];           // filled by loadMembers()
var dataLoaded = false;
var currentFilter = 'All';
var currentSort = 'newest';
var selectedInvMember = null;
var invoiceCounter = 100;

// ── LOAD MEMBERS FROM GOOGLE SHEETS ──
function loadMembers(callback) {
  if (GAS_URL === 'https://script.google.com/macros/s/AKfycbyBUtnmezAOThr2vxHfZ6dP3XUbkbHVuhMhqGdD7xnDotCzVKzYySw0KXNlqGs8397Y/exec') {
    // Demo mode — no URL set yet
    MEMBERS = DEMO_MEMBERS.slice();
    dataLoaded = true;
    if (callback) callback();
    return;
  }
  showLoadingState('Loading members from database...');
  fetch(GAS_URL + '?action=getMembers', { method: 'GET' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.status === 'ok') {
        MEMBERS = data.members || [];
        dataLoaded = true;
        hideLoadingState();
        if (callback) callback();
      } else {
        showDataError('Could not load data: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(function(err) {
      showDataError('Network error. Check your internet connection and try again.');
      console.error(err);
    });
}

function showLoadingState(msg) {
  var pages = document.querySelectorAll('[id^="page-"]');
  pages.forEach(function(p) {
    if (p.style.display !== 'none') {
      var ex = p.querySelector('.loading-overlay');
      if (!ex) {
        var div = document.createElement('div');
        div.className = 'loading-overlay';
        div.style.cssText = 'text-align:center;padding:3rem;color:var(--text-muted);font-size:14px;';
        div.innerHTML = '<div style="font-size:32px;margin-bottom:12px;">⏳</div><div>' + msg + '</div>';
        p.insertBefore(div, p.firstChild);
      }
    }
  });
}
function hideLoadingState() {
  document.querySelectorAll('.loading-overlay').forEach(function(el){ el.remove(); });
}
function showDataError(msg) {
  hideLoadingState();
  var pages = document.querySelectorAll('[id^="page-"]');
  pages.forEach(function(p) {
    if (p.style.display !== 'none') {
      var div = document.createElement('div');
      div.style.cssText = 'background:#FEE2E2;border:1px solid #FCA5A5;border-radius:10px;padding:1rem 1.25rem;margin-bottom:1rem;font-size:13px;color:#991B1B;display:flex;align-items:center;gap:10px;';
      div.innerHTML = '<span style="font-size:20px;">⚠️</span><div>' + msg + '<br/><button onclick="location.reload()" style="margin-top:6px;background:none;border:1px solid #FCA5A5;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:12px;color:#991B1B;">Retry</button></div>';
      p.insertBefore(div, p.firstChild);
    }
  });
}

// ── DEMO DATA (shown when GAS_URL is not set yet) ──
var DEMO_MEMBERS = [
  { appID:'DEMO-001', firstName:'Demo', lastName:'Member', gender:'Male', dob:'1980-01-01', occupation:'Business', email:'demo@example.com', mobile:'9999999999', whatsapp:'Yes', residentialAddress:'Demo Address', city:'New Delhi', pin:'110001', spouseName:'', anniversary:'', interests:'Classical Music', referredBy:'', paymentMethod:'UPI', paymentRef:'DEMO123', paymentDate:'2026-04-01', amountPaid:29500, receiptFileName:'demo_receipt.jpg', status:'Pending Verification', membershipNo:'', invoiceSent:false, submittedAt:'Demo data — connect Google Sheets to see real members', serialNo:'' }
];


// ── PAGE SWITCHING ──
function showPage(name) {
  document.querySelectorAll('[id^="page-"]').forEach(function(p){ p.style.display='none'; });
  document.getElementById('page-' + name).style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  var titles = { dashboard:'Dashboard', members:'Members', invoices:'Tax Invoices', reports:'Reports', email:'Send Emails', settings:'Settings' };
  document.getElementById('topbarTitle').textContent = titles[name] || name;

  // Always reload live data then render
  loadMembers(function() {
    if (name === 'dashboard') renderDashboard();
    if (name === 'members')   renderMembersTable();
    if (name === 'invoices')  renderInvoiceList();
    if (name === 'reports')   renderReports();
    if (name === 'email')     renderEmailRecipients();
  });
  return false;
}

// ── DASHBOARD ──
function renderDashboard() {
  var total   = MEMBERS.length;
  var pending = MEMBERS.filter(function(m){ return isPending(m.status); }).length;
  var active  = MEMBERS.filter(function(m){ return isActive(m.status); }).length;
  var revenue = active * 29500;
  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statActive').textContent  = active;
  document.getElementById('statRevenue').textContent = '₹' + revenue.toLocaleString('en-IN');
  document.getElementById('pendingBadge').textContent = pending;
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', {weekday:'long',year:'numeric',month:'long',day:'numeric'});

  if (pending > 0) {
    document.getElementById('pendingAlert').style.display = 'block';
    document.getElementById('pendingAlertText').textContent = pending + ' application(s) are waiting for your review.';
  } else {
    document.getElementById('pendingAlert').style.display = 'none';
  }

  // Recent list
  var recent = MEMBERS.slice().sort(function(a,b){ return b.appID.localeCompare(a.appID); }).slice(0,4);
  document.getElementById('recentList').innerHTML = recent.map(function(m){
    return '<div class="flex-center gap-12" style="padding:10px 0;border-bottom:1px solid var(--ivory-border);">' +
      '<div class="avatar avatar-sm ' + (isActive(m.status)?'avatar-navy':'avatar-blue') + '">' + (m.firstName||'?')[0] + (m.lastName||'?')[0] + '</div>' +
      '<div style="flex:1;"><div style="font-size:13px;font-weight:500;color:var(--navy);">' + m.firstName + ' ' + m.lastName + '</div>' +
      '<div style="font-size:11px;color:var(--text-muted);">' + m.appID + '</div></div>' +
      '<span class="badge badge-' + statusClass(m.status) + '">' + statusLabel(m.status) + '</span></div>';
  }).join('');

  // Status chart
  var statusGroups = [
    { label:'Active',               fn: isActive,   color:'var(--success)' },
    { label:'Pending Verification', fn: isPending,   color:'var(--gold)'    },
    { label:'Rejected',             fn: isRejected,  color:'var(--danger)'  }
  ];
  var max = Math.max.apply(null, statusGroups.map(function(sg){ return MEMBERS.filter(function(m){ return sg.fn(m.status); }).length; })) || 1;
  document.getElementById('statusChart').innerHTML = statusGroups.map(function(sg){
    var cnt = MEMBERS.filter(function(m){ return sg.fn(m.status); }).length;
    var pct = Math.round((cnt/max)*100);
    return '<div class="chart-bar-row"><div class="chart-bar-label" style="width:110px;font-size:11px;">' + sg.label + '</div>' +
      '<div class="chart-bar-bg"><div class="chart-bar-fill" style="width:'+pct+'%;background:'+sg.color+'"></div></div>' +
      '<div class="chart-bar-val">' + cnt + '</div></div>';
  }).join('');
}

// ── MEMBERS TABLE ──
function renderMembersTable() {
  var filtered = MEMBERS.filter(function(m){
    if (currentFilter === 'All') return true;
    if (currentFilter === 'Pending') return isPending(m.status);
    if (currentFilter === 'Active')  return isActive(m.status);
    if (currentFilter === 'Rejected') return isRejected(m.status);
    return true;
  });
  if (currentSort === 'newest') filtered.sort(function(a,b){ return b.appID.localeCompare(a.appID); });
  else if (currentSort === 'oldest') filtered.sort(function(a,b){ return a.appID.localeCompare(b.appID); });
  else if (currentSort === 'name') filtered.sort(function(a,b){ return (a.firstName||'').localeCompare(b.firstName||''); });

  var tbody = document.getElementById('membersTable');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🔍</div><p>No members found</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(function(m){
    var id = m.appID.replace(/'/g, "\\'");
    var pending  = isPending(m.status);
    var active   = isActive(m.status);
    return '<tr>' +
      '<td><div class="member-avatar-wrap">' +
        '<div class="avatar avatar-sm avatar-navy">' + (m.firstName||'?')[0] + (m.lastName||'?')[0] + '</div>' +
        '<div><div class="td-name">' + m.firstName + ' ' + m.lastName + '</div>' +
        '<div class="td-id">' + m.appID + '</div></div></div></td>' +
      '<td><div style="font-size:13px;">' + m.email + '</div><div class="td-id">' + m.mobile + '</div></td>' +
      '<td><div style="font-size:13px;">Annual</div><div class="td-id">₹29,500</div></td>' +
      '<td><div style="font-size:13px;">' + (m.paymentMethod||'—') + '</div><div class="td-id">' + (m.paymentRef||'—') + '</div></td>' +
      '<td><span class="badge badge-' + statusClass(m.status) + '">' + statusLabel(m.status) + '</span></td>' +
      '<td style="white-space:nowrap;">' +
        '<button class="action-btn" title="View Details" onclick="viewMember(\'' + id + '\')">👁</button>' +
        (pending ? ' <button class="action-btn" title="Approve & Activate" onclick="approveMember(\'' + id + '\')" style="font-size:18px;">✅</button>' +
                   ' <button class="action-btn" title="Reject" onclick="rejectMember(\'' + id + '\')" style="font-size:18px;">❌</button>' : '') +
        (active  ? ' <button class="action-btn" title="Send Tax Invoice" onclick="openInvoice(\'' + id + '\')" style="font-size:18px;">🧾</button>' : '') +
      '</td></tr>';
  }).join('');
}

function filterStatus(status, el) {
  currentFilter = status;
  document.querySelectorAll('.quick-filter').forEach(function(f){ f.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderMembersTable();
}

function sortMembers(val) { currentSort = val; renderMembersTable(); }

function globalSearchFn(q) {
  if (!q) { renderMembersTable(); return; }
  q = q.toLowerCase();
  var filtered = MEMBERS.filter(function(m){
    return (m.firstName+' '+m.lastName+' '+m.email+' '+m.mobile+' '+m.appID).toLowerCase().includes(q);
  });
  var tbody = document.getElementById('membersTable');
  if (tbody) { /* update if members page visible */ }
}

// ── MEMBER DETAIL MODAL ──
function viewMember(appID) {
  var m = MEMBERS.find(function(x){ return x.appID===appID; });
  if (!m) return;
  _detCount = 0;
  document.getElementById('modalTitle').textContent = m.firstName + ' ' + m.lastName + ' — ' + appID;
  document.getElementById('modalBody').innerHTML =
    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:1.5rem;">' +
    '<div class="avatar avatar-lg avatar-navy">' + (m.firstName||'?')[0] + (m.lastName||'?')[0] + '</div>' +
    '<div><div style="font-size:18px;font-weight:600;color:var(--navy);">' + m.firstName + ' ' + m.lastName + '</div>' +
    '<div style="font-size:13px;color:var(--text-muted);">' + m.email + ' &nbsp;|&nbsp; ' + m.mobile + '</div>' +
    '<span class="badge badge-' + statusClass(m.status) + '" style="margin-top:6px;">' + statusLabel(m.status) + '</span>' +
    (m.membershipNo ? '&nbsp;<span class="badge badge-info">Member No: '+m.membershipNo+'</span>' : '') +
    '</div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">' +
    detRow('App ID', m.appID)                    + detRow('Date of Birth', m.dob||'—') +
    detRow('Gender', m.gender||'—')              + detRow('Occupation', m.occupation||'—') +
    detRow('City / PIN', (m.city||'') + (m.pin?' – '+m.pin:'')) + detRow('WhatsApp', m.whatsapp||'—') +
    detRow('Spouse', m.spouseName||'—')          + detRow('Anniversary', m.anniversary||'—') +
    detRow('Interests', m.interests||'—')        + detRow('Referred By', m.referredBy||'—') +
    detRow('Payment Method', m.paymentMethod||'—') + detRow('Payment Ref', m.paymentRef||'—') +
    detRow('Payment Date', m.paymentDate||'—')   + detRow('Amount Paid', '₹'+Number(m.amountPaid||0).toLocaleString('en-IN')) +
    detRow('Receipt File', m.receiptFileName||'(not uploaded)') + detRow('Invoice Sent', m.invoiceSent ? 'Yes ✓' : 'No') +
    detRow('Submitted At', m.submittedAt||'—')   + detRow('Serial No.', m.serialNo||'—') +
    '</div>' +
    (isPending(m.status) ? '<div class="alert alert-warning" style="margin-top:1rem;">⚠ Awaiting verification. Review payment receipt before approving.</div>' : '') +
    (isActive(m.status)  ? '<div class="alert alert-success" style="margin-top:1rem;">✅ Member is active. You can send the Tax Invoice below.</div>' : '') +
    (m.receiptFileName   ? '<div style="margin-top:1rem;padding:10px 14px;background:var(--ivory-dark);border-radius:var(--radius);font-size:13px;display:flex;align-items:center;gap:8px;"><span>📎</span><span>'+m.receiptFileName+'</span><span style="color:var(--text-muted);font-size:11px;">(payment receipt uploaded)</span></div>' : '');

  var id = appID.replace(/'/g, "\\'");
  var footer = '';
  if (isPending(m.status)) {
    footer += '<button class="btn btn-danger" onclick="rejectMember(\''+id+'\');closeModal(\'memberModal\')">❌ Reject</button>';
    footer += '<button class="btn btn-primary" onclick="approveMember(\''+id+'\');closeModal(\'memberModal\')">✅ Approve &amp; Activate</button>';
  }
  if (isActive(m.status)) {
    footer += '<button class="btn btn-gold" onclick="closeModal(\'memberModal\');openInvoice(\''+id+'\')">🧾 Send Tax Invoice</button>';
  }
  footer += '<button class="btn btn-outline" onclick="closeModal(\'memberModal\')">Close</button>';
  document.getElementById('modalFooter').innerHTML = footer;
  openModal('memberModal');
}

function detRow(label, val, right) {
  var isRight = right;
  return '<div style="padding:8px 0 8px '+(isRight?'1rem':'0')+';border-bottom:1px solid var(--ivory-border);'+(isRight?'border-left:1px solid var(--ivory-border);padding-right:0;':'padding-right:1rem;')+'">' +
    '<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:2px;">'+label+'</div>' +
    '<div style="font-size:13.5px;color:var(--navy);font-weight:500;">'+(val||'—')+'</div></div>';
}
// Rewrite detRow to alternate left/right via counter
var _detCount = 0;
function detRow(label, val) {
  _detCount++;
  var isRight = _detCount % 2 === 0;
  return '<div style="padding:8px 0 8px '+(isRight?'1rem':'0')+';border-bottom:1px solid var(--ivory-border);'+(isRight?'border-left:1px solid var(--ivory-border);':'padding-right:1rem;')+'">' +
    '<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:2px;">'+label+'</div>' +
    '<div style="font-size:13.5px;color:var(--navy);font-weight:500;">'+(val||'—')+'</div></div>';
}

// ── APPROVE / REJECT ──
function approveMember(appID) {
  var m = MEMBERS.find(function(x){ return x.appID===appID; });
  if (!m) return;
  invoiceCounter++;
  var newMemberNo = String(300 + invoiceCounter);

  // Update locally immediately
  m.status = 'Active';
  m.membershipNo = newMemberNo;
  renderMembersTable();
  renderDashboard();

  // Write back to Google Sheets
  if (GAS_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
    fetch(GAS_URL + '?action=updateStatus&appID=' + encodeURIComponent(appID) + '&status=Active&memberNo=' + newMemberNo)
      .then(function(r){ return r.json(); })
      .then(function(d){ console.log('Approve result:', d); })
      .catch(function(e){ console.error('Approve error:', e); });
  }

  if (confirm('Member approved! Send Tax Invoice email to ' + m.email + ' now?')) {
    sendInvoiceToMember(m);
  }
}

function rejectMember(appID) {
  var m = MEMBERS.find(function(x){ return x.appID===appID; });
  if (!m) return;
  if (!confirm('Reject application for ' + m.firstName + ' ' + m.lastName + '?\nThis action will notify the member.')) return;
  m.status = 'Rejected';
  renderMembersTable();
  renderDashboard();

  if (GAS_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
    fetch(GAS_URL + '?action=updateStatus&appID=' + encodeURIComponent(appID) + '&status=Rejected')
      .then(function(r){ return r.json(); })
      .catch(function(e){ console.error('Reject error:', e); });
  }
}

// ── INVOICE ──
function renderInvoiceList() {
  var active = MEMBERS.filter(function(m){ return isActive(m.status); });
  _detCount = 0;
  document.getElementById('invMemberList').innerHTML = active.map(function(m){
    return '<div class="flex-center gap-10" style="padding:10px 12px;border-radius:8px;cursor:pointer;transition:background 0.15s;margin-bottom:4px;" ' +
      'onmouseover="this.style.background=\'var(--ivory)\'" onmouseout="this.style.background=\'\';" onclick="selectInvMember(\''+m.appID+'\')">' +
      '<div class="avatar avatar-sm avatar-navy">'+m.firstName[0]+m.lastName[0]+'</div>' +
      '<div><div style="font-size:13px;font-weight:500;color:var(--navy);">'+m.firstName+' '+m.lastName+'</div>' +
      '<div style="font-size:11px;color:var(--text-muted);">'+m.appID + (m.invoiceSent?' · ✉ Sent':'')+'</div></div>' +
      (m.invoiceSent ? '<span class="badge badge-success" style="margin-left:auto;">Sent</span>' : '<span class="badge badge-warning" style="margin-left:auto;">Pending</span>') +
      '</div>';
  }).join('') || '<div class="empty-state"><p>No active members yet</p></div>';
}

function filterInvMembers(q) {
  var items = document.querySelectorAll('#invMemberList > div');
  items.forEach(function(el){ el.style.display = el.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none'; });
}

function selectInvMember(appID) {
  selectedInvMember = MEMBERS.find(function(m){ return m.appID===appID; });
  document.getElementById('invPreviewWrap').innerHTML = buildInvoiceHTML(selectedInvMember);
  document.getElementById('invPreviewWrap').insertAdjacentHTML('beforeend',
    '<div style="margin-top:1rem;display:flex;gap:10px;justify-content:flex-end;">' +
    '<button class="btn btn-outline" onclick="window.print()">🖨 Print</button>' +
    '<button class="btn btn-gold" onclick="sendInvoiceEmail()">📧 Send Invoice to Member</button></div>');
}

function openInvoice(appID) {
  var m = MEMBERS.find(function(x){ return x.appID===appID; });
  if (!m) return;
  selectedInvMember = m;
  document.getElementById('invoiceBody').innerHTML = buildInvoiceHTML(m);
  document.getElementById('sendInvBtn').onclick = function(){ sendInvoiceEmail(); closeModal('invoiceModal'); };
  openModal('invoiceModal');
}

function buildInvoiceHTML(m) {
  var today = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'});
  var dueDate = '15/05/2026';
  return '<div class="invoice-preview">' +
    '<div class="inv-header">' +
      '<div class="inv-org">॥ मंथन ॥ MANTHAN</div>' +
      '<div class="inv-org-sub">MANTHAN KALA CENTRE (REGD.)</div>' +
      '<div class="inv-org-addr">A-62, Mayfair Garden, New Delhi-110016</div>' +
      '<div class="inv-org-addr" style="margin-top:4px;">Ph: 011-26850232 | M: 8527922395 | manthantree@gmail.com</div>' +
    '</div>' +
    '<div class="inv-meta">' +
      '<div class="inv-meta-block"><div class="inv-meta-label">Serial No.</div><div class="inv-meta-val">' + (m.serialNo||'—') + '</div></div>' +
      '<div class="inv-meta-block"><div class="inv-meta-label">Date</div><div class="inv-meta-val">' + today + '</div></div>' +
      '<div class="inv-meta-block"><div class="inv-meta-label">PAN</div><div class="inv-meta-val">AABTM****E</div></div>' +
      '<div class="inv-meta-block"><div class="inv-meta-label">GSTIN</div><div class="inv-meta-val">07AABTM****D2Z9</div></div>' +
    '</div>' +
    '<div class="inv-bill-to">' +
      '<div class="lbl">Bill To</div>' +
      '<div style="font-weight:600;color:var(--navy);font-size:14px;">Membership No. ' + (m.membershipNo||'—') + '</div>' +
      '<div style="font-size:13px;color:var(--text-mid);margin-top:4px;">' + m.firstName+' '+m.lastName + '</div>' +
      '<div style="font-size:13px;color:var(--text-mid);">' + (m.residentialAddress||'') + '</div>' +
      '<div style="font-size:13px;color:var(--text-mid);">' + (m.city||'') + (m.pin?' – '+m.pin:'') + '</div>' +
      '<div style="font-size:13px;color:var(--text-mid);">' + m.mobile + '</div>' +
    '</div>' +
    '<div class="inv-section-title">TAX INVOICE</div>' +
    '<table class="inv-table">' +
      '<thead><tr><th style="width:70%;">Particulars</th><th>Amount (₹)</th></tr></thead>' +
      '<tbody>' +
        '<tr><td>Yearly Subscription for the Year 2026-27<br/><span style="font-size:11px;color:var(--text-muted);">HSN CODE-999599</span></td><td>25,000</td></tr>' +
        '<tr><td>CGST @ 9%</td><td>2,250</td></tr>' +
        '<tr><td>SGST @ 9%</td><td>2,250</td></tr>' +
        '<tr class="total-row"><td>Total</td><td>29,500</td></tr>' +
      '</tbody>' +
    '</table>' +
    '<div class="inv-words">Rupees Twenty-Nine Thousand Five Hundred Only</div>' +
    '<div class="inv-note">Payment should be made before 15th May 2026, after that interest will be payable @ RS. 500 Per month till date of payment received. &nbsp;|&nbsp; Please confirm the detail of NEFT with their name on the Manthan WhatsApp number: 8527922395</div>' +
    '<div class="inv-bank">' +
      '<strong>Bank Account Details:</strong>' +
      '<div>Punjab National Bank — 05622011010738</div>' +
      '<div>RTGS/NEFT/IFSC CODE: PUNB0035610 | Branch: New Delhi, Saket 110017</div>' +
    '</div>' +
    '<div class="inv-sign">' +
      '<div></div>' +
      '<div class="inv-sign-line">For Manthan Kala Centre<br/><br/>(Authorised Signatory)</div>' +
    '</div>' +
    '<div class="inv-footer">Ph.: 011-26850232 | M: 8527922395 | Email: manthantree@gmail.com</div>' +
  '</div>';
}

function sendInvoiceToMember(m) {
  if (!m) return;
  if (GAS_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
    fetch(GAS_URL + '?action=sendInvoice&appID=' + encodeURIComponent(m.appID))
      .then(function(r){ return r.json(); })
      .then(function(d){
        m.invoiceSent = true;
        renderInvoiceList();
        document.getElementById('emailSentMsg').textContent = 'Invoice sent to ' + m.email + ' successfully!';
        openModal('emailSentModal');
      })
      .catch(function(e){
        alert('Could not send invoice email. Please try again.\n' + e);
      });
  } else {
    // Demo mode
    m.invoiceSent = true;
    renderInvoiceList();
    document.getElementById('emailSentMsg').textContent = 'Invoice sent to ' + m.email + ' (demo mode)';
    openModal('emailSentModal');
  }
}

function sendInvoiceEmail() {
  if (!selectedInvMember) return;
  sendInvoiceToMember(selectedInvMember);
}

// ── REPORTS ──
function renderReports() {
  var active = MEMBERS.filter(function(m){ return isActive(m.status); });
  var gross = active.length * 29500;
  var base = active.length * 25000;
  var gst = active.length * 2250;
  document.getElementById('rptTotal').textContent = '₹' + gross.toLocaleString('en-IN');
  document.getElementById('rptBase').textContent = '₹' + base.toLocaleString('en-IN');
  document.getElementById('rptCGST').textContent = '₹' + gst.toLocaleString('en-IN');
  document.getElementById('rptSGST').textContent = '₹' + gst.toLocaleString('en-IN');

  // Interest chart
  var interestMap = {};
  MEMBERS.forEach(function(m){ (m.interests||'').split(',').forEach(function(i){ var t=i.trim(); if(t){ interestMap[t]=(interestMap[t]||0)+1; } }); });
  var interestArr = Object.keys(interestMap).map(function(k){ return {k:k,v:interestMap[k]}; }).sort(function(a,b){ return b.v-a.v; }).slice(0,6);
  var imax = interestArr.length ? interestArr[0].v : 1;
  document.getElementById('interestChart').innerHTML = interestArr.map(function(item){
    return '<div class="chart-bar-row"><div class="chart-bar-label" style="width:130px;font-size:11px;">'+item.k+'</div>' +
      '<div class="chart-bar-bg"><div class="chart-bar-fill" style="width:'+Math.round((item.v/imax)*100)+'%;background:var(--blue-accent);"></div></div>' +
      '<div class="chart-bar-val">'+item.v+'</div></div>';
  }).join('');

  // Payment method chart
  var payMap = {};
  MEMBERS.forEach(function(m){ var p=m.paymentMethod||'Unknown'; payMap[p]=(payMap[p]||0)+1; });
  var payArr = Object.keys(payMap).map(function(k){ return {k:k,v:payMap[k]}; }).sort(function(a,b){ return b.v-a.v; });
  var pmax = payArr.length ? payArr[0].v : 1;
  document.getElementById('paymentChart').innerHTML = payArr.map(function(item){
    return '<div class="chart-bar-row"><div class="chart-bar-label" style="width:130px;font-size:11px;">'+item.k+'</div>' +
      '<div class="chart-bar-bg"><div class="chart-bar-fill" style="width:'+Math.round((item.v/pmax)*100)+'%;background:var(--gold);"></div></div>' +
      '<div class="chart-bar-val">'+item.v+'</div></div>';
  }).join('');

  // Full table
  document.getElementById('reportTableBody').innerHTML = MEMBERS.map(function(m){
    return '<tr><td class="td-id">'+m.appID+'</td><td class="td-name">'+m.firstName+' '+m.lastName+'</td>' +
      '<td>'+m.email+'</td><td>'+m.mobile+'</td><td>'+m.city+'</td>' +
      '<td>Annual</td><td>₹25,000</td><td>₹4,500</td><td>₹29,500</td>' +
      '<td><span class="badge badge-'+statusClass(m.status)+'">'+statusLabel(m.status)+'</span></td>' +
      '<td style="font-size:12px;">'+m.submittedAt+'</td></tr>';
  }).join('');
}

function exportCSV() {
  var headers = ['App ID','First Name','Last Name','Email','Mobile','City','PIN','Membership','Base Amount','CGST','SGST','Total','Payment Method','Payment Ref','Status','Date'];
  var rows = MEMBERS.map(function(m){
    return [m.appID, m.firstName, m.lastName, m.email, m.mobile, m.city, m.pin, 'Annual', 25000, 2250, 2250, 29500, m.paymentMethod, m.paymentRef, m.status, m.submittedAt];
  });
  var csv = [headers].concat(rows).map(function(r){ return r.map(function(c){ return '"'+String(c||'').replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  var blob = new Blob([csv], {type:'text/csv'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href=url; a.download='MKC_Members.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── EMAIL ──
function renderEmailRecipients() {
  var sel = document.getElementById('emailRecipients');
  MEMBERS.filter(function(m){ return m.status==='Active'; }).forEach(function(m){
    var opt = new Option(m.firstName+' '+m.lastName+' <'+m.email+'>', m.appID);
    sel.appendChild(opt);
  });
}

var EMAIL_TEMPLATES = {
  verify: { subject:'Your Manthan Kala Centre Membership is Activated!', body:'Dear {name},\n\nWe are pleased to inform you that your membership with Manthan Kala Centre (Regd.) has been verified and activated.\n\nMembership No: {memberNo}\nApplication ID: {appID}\n\nPlease find your Tax Invoice attached.\n\nWe look forward to your active participation in our cultural activities.\n\nWarm regards,\nManthan Kala Centre\nA-62, Mayfair Garden, New Delhi-110016\nPh: 011-26850232 | M: 8527922395' },
  welcome: { subject:'Welcome to Manthan Kala Centre!', body:'Dear {name},\n\nA warm welcome to the Manthan Kala Centre family!\n\nWe are a registered cultural organization dedicated to promotion of Indian arts and culture.\n\nYour membership opens doors to exclusive cultural events, workshops, and performances.\n\nWarm regards,\nManthan Kala Centre' },
  renewal: { subject:'Membership Renewal Reminder — Manthan Kala Centre', body:'Dear {name},\n\nThis is a friendly reminder that your annual membership subscription is due.\n\nPlease make payment of ₹29,500 (incl. GST) before 15th May 2026 to avoid late charges.\n\nBank: Punjab National Bank | A/C: 05622011010738 | IFSC: PUNB0035610\n\nPlease WhatsApp payment confirmation to 8527922395.\n\nWarm regards,\nManthan Kala Centre' },
  receipt: { subject:'Payment Received — Manthan Kala Centre', body:'Dear {name},\n\nWe have received your payment of ₹29,500 for Annual Membership 2026-27.\n\nYour membership is being processed. You will receive your Tax Invoice shortly.\n\nFor any queries: manthantree@gmail.com\n\nWarm regards,\nManthan Kala Centre' },
};
function loadTemplate(key) {
  var t = EMAIL_TEMPLATES[key];
  if (!t) return;
  document.getElementById('emailSubject').value = t.subject;
  document.getElementById('emailBody').value = t.body;
  previewEmail();
}
function previewEmail() {
  var subj = document.getElementById('emailSubject').value;
  var body = document.getElementById('emailBody').value.replace(/\n/g,'<br/>');
  document.getElementById('emailPreview').innerHTML =
    '<div style="background:var(--navy);color:var(--gold);padding:10px 14px;border-radius:6px 6px 0 0;font-size:13px;font-weight:600;margin:-1.25rem -1.25rem 1rem;">' + subj + '</div>' +
    '<div style="font-size:13.5px;line-height:1.8;color:var(--text-mid);">' + body + '</div>';
}
function sendEmail() { openModal('emailSentModal'); document.getElementById('emailSentMsg').textContent = 'Email sent to selected recipients!'; }

// ── SETTINGS ──
function saveSettings() { alert('Settings saved! (In production, this updates your configuration.)'); }

// ── MODAL HELPERS ──
function openModal(id) { document.getElementById(id).classList.add('open'); _detCount=0; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── STATUS HELPERS ──
// Google Sheets stores "Pending Verification", form uses "Pending" — normalise both
function isPending(s) {
  s = (s || '').toLowerCase().trim();
  return s === 'pending' || s === 'pending verification';
}
function isActive(s)   { return (s || '').toLowerCase().trim() === 'active'; }
function isRejected(s) { return (s || '').toLowerCase().trim() === 'rejected'; }

function statusClass(s) {
  if (isActive(s))   return 'success';
  if (isPending(s))  return 'warning';
  if (isRejected(s)) return 'danger';
  return 'info';
}

// Normalise status for consistent display
function statusLabel(s) {
  if (isActive(s))   return 'Active';
  if (isPending(s))  return 'Pending Verification';
  if (isRejected(s)) return 'Rejected';
  return s || 'Unknown';
}

