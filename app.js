// ═══════════════════════════════════════════════════════
//  DigiBus – app.js
//  All app logic: auth, data, UI rendering
// ═══════════════════════════════════════════════════════

// ── API CONFIGURATION ──────────────────────────────────────
const API_URL = 'http://localhost:3000/api';

async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'API Error');
    }
    return await response.json();
  } catch (err) {
    console.error(`Fetch error (${endpoint}):`, err);
    throw err;
  }
}

// ── DYNAMIC ROUTES ─────────────────────────────────────────
async function getRoutes() {
  try {
    const routes = await apiFetch('/routes');
    if (Object.keys(routes).length === 0) {
      return {
        'Route A – City Center': ['Main Stop', 'Park Lane', 'Market Square', 'City Hall', 'Central Station'],
        'Route B – University': ['Campus Gate', 'Library', 'Science Block', 'Hostel Block', 'Sports Complex'],
        'Route C – Suburb': ['Suburb East', 'Suburb West', 'Shopping Mall', 'Hospital', 'Airport Road'],
        'Route D – Industrial': ['Factory Area', 'Warehouse Stop', 'Tech Park', 'Business Hub', 'Main Gate'],
      };
    }
    return routes;
  } catch (e) { return {}; }
}

async function saveRoutes(name, stops) {
  return await apiFetch('/routes', { method: 'POST', body: JSON.stringify({ name, stops }) });
}

async function deleteRoute(name) {
  return await apiFetch(`/routes/${name}`, { method: 'DELETE' });
}

// ── FEEDBACK STORAGE ───────────────────────────────────────
async function getFeedback() { return await apiFetch('/feedback'); }
async function addFeedback(fb) {
  const id = 'FB_' + Date.now();
  return await apiFetch('/feedback', { method: 'POST', body: JSON.stringify({ ...fb, id }) });
}

// ── SETTINGS STORAGE ───────────────────────────────────────
async function getSettings() {
  const defaults = {
    collegeName: 'Graphic Era',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 90 * 864e5).toISOString().split('T')[0],
    collegeStamp: null,
    collegeLogo: null,
    bankAccount: ''
  };
  try {
    const s = await apiFetch('/settings');
    return { ...defaults, ...s };
  } catch (e) { return defaults; }
}

async function saveSettings(s) {
  return await apiFetch('/settings', { method: 'POST', body: JSON.stringify(s) });
}

const ADMIN_ACCESS_CODE = 'BA2026PPG';

// ── STORAGE ──────────────────────────────────────────────
async function getReqs() { return await apiFetch('/requests'); }
async function getReqById(id) {
  const reqs = await getReqs();
  return reqs.find(r => r.id === id);
}

async function updateReq(id, patch) {
  return await apiFetch(`/requests/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
}

async function deleteReq(id) {
  return await apiFetch(`/requests/${id}`, { method: 'DELETE' });
}

async function deleteAllReqs() {
  return await apiFetch('/requests', { method: 'DELETE' });
}

// ── USER ACCOUNTS STORAGE ─────────────────────────────────
async function addUser(user) {
  return await apiFetch('/register', { method: 'POST', body: JSON.stringify(user) });
}


// ── TOAST ────────────────────────────────────────────────
function toast(msg, type = 'green') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show toast-' + type;
  setTimeout(() => t.className = 'toast', 3000);
}

// ── CRYPTO UTILITY ───────────────────────────────────────
async function secureHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── IMAGE COMPRESSION ────────────────────────────────────
function compressImage(file, maxWidth = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality JPEG
      };
    };
  });
}

// ── GLOBAL STATE ──────────────────────────────────────────
let currentRole = 'admin';
let currentStudentId = '';
let activeFeeReqId = '';
let activeRecReqId = '';

const DEMO_ACCOUNTS = {
  admin: { id: 'admin', pass: 'admin123' },
  staff: { id: 'staff', pass: 'staff123' },
  student: { id: 'student', pass: 'student123' }
};

// ── SCREENS ──────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
}

// ── AUTH MODE SWITCHER ───────────────────────────────────
let authMode = 'login'; // 'login' | 'register' | 'forgot'

function switchAuthMode(mode) {
  authMode = mode;
  document.getElementById('login-form-section').style.display = (mode === 'login') ? '' : 'none';
  document.getElementById('register-form-section').style.display = (mode === 'register') ? '' : 'none';
  const fgt = document.getElementById('forgot-form-section');
  if (fgt) fgt.style.display = (mode === 'forgot') ? '' : 'none';

  document.getElementById('lerr').classList.remove('show');
  const rerr = document.getElementById('rerr');
  if (rerr) rerr.classList.remove('show');
  const rsuccess = document.getElementById('rsuccess');
  if (rsuccess) rsuccess.classList.remove('show');
  const ferr = document.getElementById('ferr');
  if (ferr) ferr.classList.remove('show');
  const fsuccess = document.getElementById('fsuccess');
  if (fsuccess) fsuccess.classList.remove('show');
}

// ── LOGIN ────────────────────────────────────────────────
async function doLogin() {
  const uid = document.getElementById('uid').value.trim();
  const pwd = document.getElementById('upwd').value;
  const err = document.getElementById('lerr');
  if (!uid || !pwd) { err.textContent = 'Please fill in all fields.'; err.classList.add('show'); return; }

  toggleLoading(true);
  const pwdHash = await secureHash(pwd);

  try {
    const data = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ uid, pass: pwdHash }) });
    const user = data.user;
    currentRole = user.role;
    if (currentRole === 'admin') {
      showScreen('admin'); refreshAdmin();
    } else if (currentRole === 'staff') {
      showScreen('staff'); refreshStaff();
    } else {
      currentStudentId = user.studentId || user.id;
      document.getElementById('stu-badge').textContent = currentStudentId;
      showScreen('student');
      refreshStudent();
    }
  } catch (e) {
    // Check demo credentials
    let role = null;
    if (uid.toLowerCase() === DEMO_ACCOUNTS.admin.id.toLowerCase() && pwd === DEMO_ACCOUNTS.admin.pass) role = 'admin';
    else if (uid.toLowerCase() === DEMO_ACCOUNTS.staff.id.toLowerCase() && pwd === DEMO_ACCOUNTS.staff.pass) role = 'staff';
    else if (uid.toLowerCase() === DEMO_ACCOUNTS.student.id.toLowerCase() && pwd === DEMO_ACCOUNTS.student.pass) role = 'student';

    if (role) {
      currentRole = role;
      if (role === 'admin') { showScreen('admin'); refreshAdmin(); }
      else if (role === 'staff') { showScreen('staff'); refreshStaff(); }
      else {
        currentStudentId = uid;
        document.getElementById('stu-badge').textContent = currentStudentId;
        showScreen('student');
        refreshStudent();
      }
    } else {
      err.textContent = e.message || 'Invalid credentials.';
      err.classList.add('show');
    }
  } finally {
    toggleLoading(false);
  }
}

// ── REGISTER ────────────────────────────────────────
async function doRegister() {
  const err = document.getElementById('rerr');
  const succ = document.getElementById('rsuccess');
  err.classList.remove('show');
  succ.classList.remove('show');

  const studentId = document.getElementById('reg-id').value.trim();
  const pass = document.getElementById('reg-pwd').value;
  const dob = document.getElementById('reg-dob').value;

  if (!studentId || !pass || !dob) {
    err.textContent = 'All fields are required.'; err.classList.add('show');
    return;
  }

  toggleLoading(true);
  try {
    const hashedPassword = await secureHash(pass);
    await addUser({ role: 'student', id: studentId, studentId: studentId, dob, pass: hashedPassword });

    succ.textContent = 'Account created! Signing you in...';
    succ.classList.add('show');

    setTimeout(() => {
      document.getElementById('uid').value = studentId;
      document.getElementById('upwd').value = pass;
      doLogin();
    }, 600);
  } catch (e) {
    err.textContent = e.message || 'Registration failed.';
    err.classList.add('show');
  } finally {
    toggleLoading(false);
  }
}

// ── CHANGE PASSWORD ─────────────────────────────────
function logout() {
  currentStudentId = '';
  document.getElementById('uid').value = '';
  document.getElementById('upwd').value = '';
  showScreen('login');
}

function openFeedbackModule() {
  document.getElementById('fb-name').value = '';
  document.getElementById('fb-email').value = '';
  document.getElementById('fb-note').value = '';
  openModule('module-feedback');
}

async function submitFeedback() {
  const name = document.getElementById('fb-name').value.trim();
  const email = document.getElementById('fb-email').value.trim();
  const note = document.getElementById('fb-note').value.trim();
  if (!note) { toast('Please enter your feedback.', 'red'); return; }
  await addFeedback({ name, email, note });
  closeModule('module-feedback');
  toast('Thank you for your feedback!', 'green');
}



// ── Module ────────────────────────────────────────────────
function openModule(id) { document.getElementById(id).classList.add('open'); }
function closeModule(id) { document.getElementById(id).classList.remove('open'); }

function toggleLoading(show) {
  document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

// ══════════════════════════════════════════════════════════
//  ADMIN MODULE
// ══════════════════════════════════════════════════════════
async function aNav(btn, panel) {
  document.querySelectorAll('#admin .sitem').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#admin .panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panel).classList.add('active');
  if (panel === 'a-req') await renderAdminRequests();
  if (panel === 'a-receipt') await renderAdminReceipts();
  if (panel === 'a-cards') await renderAdminCards();
  if (panel === 'a-routes') await renderAdminRoutes();
  if (panel === 'a-feedback') await renderAdminFeedback();
  if (panel === 'a-settings') await renderAdminSettings();
}

async function refreshAdminDashboard() {
  const activePanel = document.querySelector('#admin .panel.active')?.id;
  await refreshAdmin();
  if (activePanel === 'a-req') await renderAdminRequests();
  if (activePanel === 'a-receipt') await renderAdminReceipts();
  if (activePanel === 'a-cards') await renderAdminCards();
  if (activePanel === 'a-routes') await renderAdminRoutes();
  if (activePanel === 'a-feedback') await renderAdminFeedback();
  if (activePanel === 'a-settings') await renderAdminSettings();
  toast('Dashboard Refreshed', 'blue');
}

async function refreshAdmin() {
  const reqs = await getReqs();
  const pending = reqs.filter(r => r.status === 'pending').length;
  const receipts = reqs.filter(r => r.status === 'payment_submitted').length;
  const active = reqs.filter(r => r.status === 'approved').length;
  document.getElementById('a-req-badge').textContent = pending;
  document.getElementById('a-receipt-badge').textContent = receipts;
  document.getElementById('a-cards-badge').textContent = active;
  document.getElementById('st-pending').textContent = pending;
  document.getElementById('st-receipt').textContent = receipts;
  document.getElementById('st-active').textContent = active;
}

function deleteAllRequests() {
  openSecurityModule(
    'This will permanently delete ALL student requests and bus pass records. This action cannot be undone.',
    async () => {
      await deleteAllReqs();
      await refreshAdmin();
      await renderAdminRequests();
      await renderAdminReceipts();
      await renderAdminCards();
      toast('All records deleted.', 'red');
      closeModule('module-security');
    }
  );
}

function deleteAllActiveCards() {
  openSecurityModule(
    'Delete ALL active student bus cards? Students will lose access immediately.',
    async () => {
      const reqs = await getReqs();
      const approved = reqs.filter(r => r.status === 'approved');
      for (const r of approved) {
        await deleteReq(r.id);
      }
      await refreshAdmin();
      await renderAdminCards();
      toast('All active cards deleted.', 'red');
      closeModule('module-security');
    }
  );
}

function openSecurityModule(msg, onConfirm) {
  document.getElementById('msec-msg').textContent = msg;
  document.getElementById('msec-code').value = '';
  const btn = document.getElementById('msec-btn');
  btn.onclick = () => {
    const entered = document.getElementById('msec-code').value;
    if (entered === ADMIN_ACCESS_CODE) {
      onConfirm();
    } else {
      toast('Invalid Admin Access Code!', 'red');
    }
  };
  openModule('module-security');
}

async function deleteIndividualReq(reqId) {
  if (!confirm('Delete this request/card?')) return;
  await deleteReq(reqId);
  await refreshAdmin();
  await renderAdminRequests();
  await renderAdminReceipts();
  await renderAdminCards();
  toast('Record deleted.', 'yellow');
}

async function renderAdminRequests() {
  const reqs = await getReqs();
  const list = reqs.filter(r => r.status === 'pending');
  const el = document.getElementById('a-req-list');
  if (!list.length) { el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>No pending requests.</div>'; return; }
  el.innerHTML = list.map(r => `
    <div class="req-item" style="cursor:default">

      <div class="req-info" onclick="openFeeModule('${r.id}')" style="cursor:pointer">
        <div class="req-name">${r.studentName}</div>
        <div class="req-meta">ID: ${r.studentId} &nbsp;|&nbsp; ${r.route} → ${r.stop}</div>
        <div class="req-meta" style="margin-top:2px">Submitted: ${fmtDate(r.createdAt)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
        <span class="status-pill s-pending">Pending</span>
        <button class="btn btn-red btn-sm" style="width:auto;padding:2px 8px;font-size:10px" onclick="deleteIndividualReq('${r.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function renderAdminReceipts() {
  const reqs = await getReqs();
  const list = reqs.filter(r => r.status === 'payment_submitted');
  const el = document.getElementById('a-receipt-list');
  if (!list.length) { el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>No receipts to review.</div>'; return; }
  el.innerHTML = list.map(r => `
    <div class="req-item" style="cursor:default">

      <div class="req-info" onclick="openReceiptModule('${r.id}')" style="cursor:pointer">
        <div class="req-name">${r.studentName}</div>
        <div class="req-meta">ID: ${r.studentId} &nbsp;|&nbsp; Fee: PKR ${r.fee} &nbsp;|&nbsp; ${r.route}</div>
        <div class="req-meta" style="margin-top:2px">Receipt submitted: ${fmtDate(r.updatedAt)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
        <span class="status-pill s-receipt">Review</span>
        <button class="btn btn-red btn-sm" style="width:auto;padding:2px 8px;font-size:10px" onclick="deleteIndividualReq('${r.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function renderAdminCards() {
  const reqs = await getReqs();
  const list = reqs.filter(r => r.status === 'approved');
  const el = document.getElementById('a-cards-list');
  if (!list.length) { el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>No active cards yet.</div>'; return; }
  el.innerHTML = list.map(r => `
    <div class="req-item" style="cursor:default">

      <div class="req-info" onclick="viewCardModule('${r.id}')" style="cursor:pointer">
        <div class="req-name">${r.studentName}</div>
        <div class="req-meta">ID: ${r.studentId} &nbsp;|&nbsp; ${r.route} → ${r.stop}</div>
        <div class="req-meta" style="margin-top:2px">Expires: ${r.busCardExpiry}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
        <span class="status-pill s-approved">Active</span>
        <button class="btn btn-red btn-sm" style="width:auto;padding:2px 8px;font-size:10px" onclick="deleteIndividualReq('${r.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function openFeeModule(reqId) {
  activeFeeReqId = reqId;
  const r = await getReqById(reqId);
  document.getElementById('mfee-info').innerHTML = infoGrid([
    ['Name', r.studentName], ['Student ID', r.studentId], ['Route', r.route], ['Stop', r.stop]
  ]);
  document.getElementById('mfee-amount').value = '';
  openModule('module-fee');
}

async function assignFee() {
  const fee = document.getElementById('mfee-amount').value.trim();
  const busNo = document.getElementById('mfee-busno').value.trim();
  if (!fee || isNaN(fee)) { toast('Enter a valid fee amount.', 'red'); return; }

  await updateReq(activeFeeReqId, { status: 'fee_assigned', fee, busNo });
  closeModule('module-fee');
  await refreshAdmin();
  await renderAdminRequests();
  toast('Fee assigned successfully.', 'green');
}

async function openReceiptModule(reqId) {
  activeRecReqId = reqId;
  const r = await getReqById(reqId);
  document.getElementById('mrec-info').innerHTML = infoGrid([
    ['Name', r.studentName], ['Student ID', r.studentId], ['Fee (PKR)', r.fee], ['Bus No', r.busNo || '—'], ['Route', r.route]
  ]);
  document.getElementById('mrec-note').textContent = r.receiptNote || '(No note/ID)';
  const imgEl = document.getElementById('mrec-img');
  if (r.receiptImage) {
    imgEl.src = r.receiptImage;
    imgEl.style.display = 'block';
  } else {
    imgEl.style.display = 'none';
  }
  openModule('module-receipt');
}

async function approveCard() {
  const settings = await getSettings();
  const expiry = new Date(settings.validTo).toLocaleDateString('en-GB');
  await updateReq(activeRecReqId, { status: 'approved', busCardExpiry: expiry });
  closeModule('module-receipt');
  await refreshAdmin();
  await renderAdminReceipts();
  toast('Bus card approved and issued to student!', 'green');
}

async function rejectReceipt() {
  await updateReq(activeRecReqId, { status: 'rejection', receiptNote: '' });
  closeModule('module-receipt');
  await refreshAdmin();
  await renderAdminReceipts();
  toast('Receipt rejected. Student notified.', 'red');
}

function getBusCardHtml(r, settings) {
  return `
    <div class="bus-card" id="bus-card-el" style="margin: 0 auto; position: relative;">
      <div class="bc-header" style="justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div class="bc-logo">
                ${settings.collegeLogo ? `<img src="${settings.collegeLogo}" style="width:100%; height:100%; object-fit:contain; border-radius:10px;" />` : ``}
            </div>
            <div>
                <div class="bc-title">${settings.collegeName}</div>
                <div class="bc-sub">Official Digital Bus Pass</div>
            </div>
        </div>
        <div style="width:55px; height:55px; opacity:0.8;">
             ${settings.collegeStamp ? `<img src="${settings.collegeStamp}" style="max-width:100%; max-height:100%; object-fit:contain;" />` : ``}
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <div style="flex:1">
          <div class="bc-name">${r.studentName}</div>
          <div class="bc-id">ID: ${r.studentId}</div>
          <div class="bc-id" style="margin-top:-10px; font-size:11px;">PH: ${r.studentPhone || '—'}</div>
        </div>
        <div style="width:70px; height:85px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; background:#f8fafc; margin-left:15px; flex-shrink:0;">
          ${r.studentPhoto ? `<img src="${r.studentPhoto}" style="width:100%; height:100%; object-fit:cover;" />` : `<div style="height:100%; display:flex; align-items:center; justify-content:center; font-size:10px; color:#94a3b8;">PHOTO</div>`}
        </div>
      </div>
      <div class="bc-row" style="grid-template-columns: 1fr 1fr 1fr;">
        <div class="bc-field"><div class="bl">Route</div><div class="bv">${r.route}</div></div>
        <div class="bc-field"><div class="bl">Stop</div><div class="bv">${r.stop}</div></div>
        <div class="bc-field"><div class="bl">Bus No</div><div class="bv">${r.busNo || '—'}</div></div>
      </div>
      <div class="bc-exp">
        <div class="bc-exp-txt">From: ${fmtDate(settings.validFrom)}</div>
        <div class="bc-exp-txt">Until: ${fmtDate(settings.validTo)}</div>
      </div>
    </div>`;
}

async function viewCardModule(reqId) {
  const r = await getReqById(reqId);
  const settings = await getSettings();
  document.getElementById('module-card-content').innerHTML = getBusCardHtml(r, settings);
  openModule('module-card');
}

// ── ADMIN ROUTES MANAGEMENT ──────────────────────────────
async function renderAdminRoutes() {
  const routes = await getRoutes();
  const el = document.getElementById('a-routes-list');
  el.innerHTML = Object.keys(routes).map(r => `
    <div class="req-item" style="cursor:default">

      <div class="req-info">
        <div class="req-name">${r}</div>
        <div class="req-meta">${routes[r].length} stops: ${routes[r].join(', ')}</div>
      </div>
      <button class="btn btn-red btn-sm" style="width:auto" onclick="doDeleteRoute('${r}')">Delete</button>
    </div>`).join('');
}

function openAddRouteModule() {
  document.getElementById('nr-name').value = '';
  document.getElementById('nr-stops').value = '';
  openModule('module-add-route');
}

async function addRoute() {
  const name = document.getElementById('nr-name').value.trim();
  const stopsRaw = document.getElementById('nr-stops').value.trim();
  if (!name || !stopsRaw) { toast('Please fill all fields.', 'red'); return; }
  const stops = stopsRaw.split(',').map(s => s.trim()).filter(s => s);

  await saveRoutes(name, stops);
  closeModule('module-add-route');
  await renderAdminRoutes();
  toast('Bus route added successfully!', 'green');
}

async function doDeleteRoute(name) {
  if (!confirm(`Delete route "${name}"?`)) return;
  await deleteRoute(name);
  await renderAdminRoutes();
  toast('Route deleted.', 'yellow');
}

// ── ADMIN FEEDBACK VIEW ───────────────────────────────────
async function renderAdminFeedback() {
  const feedback = await getFeedback();
  const el = document.getElementById('a-feedback-list');
  if (!feedback.length) { el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>No feedback received yet.</div>'; return; }
  el.innerHTML = feedback.map(f => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <div style="font-weight:700">${f.name || 'Anonymous'} <span style="font-weight:400;color:var(--muted);font-size:12px">(${f.email || 'No email'})</span></div>
      <div style="font-size:11px;color:var(--muted)">${fmtDate(f.createdAt)}</div>
      </div>
      <div style="font-size:13px;line-height:1.5">${f.note || '—'}</div>
    </div>`).join('');
}

// ── ADMIN SETTINGS ───────────────────────────────────────
async function renderAdminSettings() {
  const s = await getSettings();
  document.getElementById('set-college-name').value = s.collegeName;
  document.getElementById('set-valid-from').value = s.validFrom;
  document.getElementById('set-valid-to').value = s.validTo;
  if (document.getElementById('set-bank-account')) {
    document.getElementById('set-bank-account').value = s.bankAccount || '';
  }

  const stampPreview = document.getElementById('set-stamp-preview');
  if (s.collegeStamp) {
    stampPreview.querySelector('img').src = s.collegeStamp;
    stampPreview.style.display = 'block';
  } else {
    stampPreview.style.display = 'none';
  }

  const logoPreview = document.getElementById('set-logo-preview');
  if (s.collegeLogo) {
    logoPreview.querySelector('img').src = s.collegeLogo;
    logoPreview.style.display = 'block';
  } else {
    logoPreview.style.display = 'none';
  }
}

async function saveAdminSettings() {
  const collegeName = document.getElementById('set-college-name').value.trim();
  const validFrom = document.getElementById('set-valid-from').value;
  const validTo = document.getElementById('set-valid-to').value;
  const bankAccount = document.getElementById('set-bank-account') ? document.getElementById('set-bank-account').value.trim() : '';
  const stampFile = document.getElementById('set-college-stamp').files[0];
  const logoFile = document.getElementById('set-college-logo').files[0];

  if (!collegeName) { toast('Please enter a college name.', 'red'); return; }

  const currentSettings = await getSettings();
  let stampData = currentSettings.collegeStamp;
  let logoData = currentSettings.collegeLogo;

  if (stampFile) {
    stampData = await compressImage(stampFile, 400);
  }
  if (logoFile) {
    logoData = await compressImage(logoFile, 200);
  }

  await saveSettings({
    collegeName,
    validFrom,
    validTo,
    collegeStamp: stampData,
    collegeLogo: logoData,
    bankAccount
  });

  await renderAdminSettings();
  document.getElementById('set-college-stamp').value = '';
  document.getElementById('set-college-logo').value = '';
  toast('Settings saved successfully!', 'green');
}

// ══════════════════════════════════════════════════════════
//  STUDENT MODULE
// ══════════════════════════════════════════════════════════
async function sNav(btn, panel) {
  document.querySelectorAll('#student .sitem').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#student .panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panel).classList.add('active');
  if (panel === 's-home') await renderStudentHome();
  if (panel === 's-req') await renderStudentReq();
  if (panel === 's-pay') await renderStudentPay();
  if (panel === 's-card') await renderStudentCard();
}

async function refreshStudent() {
  await renderStudentHome();
  await renderStudentReq();
  await renderStudentPay();
  await renderStudentCard();
}

async function getMyReq() {
  const reqs = await getReqs();
  return reqs.find(r => r.studentId === currentStudentId);
}

async function renderStudentHome() {
  const r = await getMyReq();
  const el = document.getElementById('s-home-content');
  const steps = [
    { label: 'Submit Request', done: !!r, active: !r },
    { label: 'Pay Fee', done: r && ['payment_submitted', 'approved'].includes(r.status), active: r?.status === 'fee_assigned' },
    { label: 'Approval', done: r?.status === 'approved', active: r?.status === 'payment_submitted' },
    { label: 'Bus Card Ready', done: r?.status === 'approved', active: false },
  ];
  const stepHtml = `<div class="steps">${steps.map((s, i) => `
    <div class="step-wrap">
      <div class="step-circle ${s.done ? 'done' : s.active ? 'active' : ''}">${s.done ? 'Done' : (i + 1)}</div>
      <div class="step-label">${s.label}</div>
    </div>
    ${i < steps.length - 1 ? `<div class="step-line ${s.done ? 'done' : ''}"></div>` : ''}`).join('')}
  </div>`;

  let statusCard = '';
  if (!r) {
    statusCard = `<div class="card"><div class="card-title">Get Started</div>
      <div style="color:var(--muted);font-size:13px;margin-bottom:12px">You haven't submitted a bus pass request yet.</div>
      <button class="btn btn-green btn-sm" style="width:auto" onclick="sNav(document.querySelector('#student .sitem[data-panel=s-req]'),'s-req')">Submit Request</button>
    </div>`;
  } else if (r.status === 'pending') {
    statusCard = `<div class="card"><div class="card-title">Request Under Review</div>
      <div style="color:var(--muted);font-size:13px">Your request is pending. Admin will assign your fee shortly.</div>
      ${reqSummaryHtml(r)}</div>`;
  } else if (r.status === 'fee_assigned') {
    statusCard = `<div class="card" style="border-color:var(--primary)"><div class="card-title">Fee Assigned — Action Required</div>
      <div style="font-size:13px;margin-bottom:8px">Admin has assigned your fee. Please pay and submit your receipt.</div>
      <div style="font-size:20px;font-weight:800;color:var(--primary);margin-bottom:10px">PKR ${r.fee}</div>
      <button class="btn btn-primary btn-sm" style="width:auto" onclick="sNav(document.querySelector('#student .sitem[data-panel=s-pay]'),'s-pay')">Go to Payment</button>
    </div>`;
  } else if (r.status === 'payment_submitted') {
    statusCard = `<div class="card" style="border-color:var(--purple)"><div class="card-title">Receipt Submitted — Awaiting Approval</div>
      <div style="font-size:13px;color:var(--muted)">Admin is reviewing your payment receipt. You'll be notified once approved.</div>
    </div>`;
  } else if (r.status === 'approved') {
    statusCard = `<div class="card" style="border-color:var(--green)"><div class="card-title">Bus Card Approved!</div>
      <div style="font-size:13px;margin-bottom:10px">Your bus card is ready. Download it and show it to bus staff.</div>
      <button class="btn btn-green btn-sm" style="width:auto" onclick="sNav(document.querySelector('#student .sitem[data-panel=s-card]'),'s-card')">View Bus Card</button>
    </div>`;
  }
  el.innerHTML = `<div class="page-title">My Status</div><div class="page-sub">Track your bus pass application.</div>${stepHtml}${statusCard}`;
}

function reqSummaryHtml(r) {
  return `<div class="info-grid" style="margin-top:12px">
    ${infoGrid([['Name', r.studentName], ['Student ID', r.studentId], ['Route', r.route], ['Stop', r.stop]])}
  </div>`;
}

async function renderStudentReq() {
  const r = await getMyReq();
  const el = document.getElementById('s-req-content');
  if (r) {
    el.innerHTML = `<div class="card" style="border-color:var(--green)">
      <div class="card-title">Request Already Submitted</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px">You have an active request. Current status: <b>${statusLabel(r.status)}</b></div>
      ${reqSummaryHtml(r)}
    </div>`;
    return;
  }
  const routes = await getRoutes();
  const routeOptions = Object.keys(routes).map(k => `<option value="${k}">${k}</option>`).join('');
  el.innerHTML = `
    <div class="card">
      <div class="mfld"><label>Full Name</label>
        <div class="iw"><span class="ic"></span><input type="text" id="sn-name" placeholder="Your full name"/></div>
      </div>
      <div class="mfld"><label>Student ID</label>
        <div class="iw"><span class="ic"></span><input type="text" id="sn-sid" placeholder="Your University ID" value="${currentStudentId}" readonly/></div>
      </div>
      <div class="mfld"><label>Phone Number</label>
        <div class="iw"><span class="ic"></span><input type="text" id="sn-phone" placeholder="Enter phone number"/></div>
      </div>
      <div class="mfld"><label>Student Photo (for Bus Pass)</label>
        <div class="iw"><span class="ic"></span><input type="file" id="sn-photo" accept="image/*" style="padding-top:10px; font-size:12px; color:var(--muted)"/></div>
      </div>
      <div class="mfld"><label>Select Route</label>
        <select id="sn-route">${routeOptions}</select>
      </div>
      <div class="mfld"><label>Stop / Landmark</label>
        <div class="iw"><span class="ic"></span><input type="text" id="sn-stop" placeholder="Type your stop or nearest landmark..."/></div>
      </div>
      <button class="btn btn-green" onclick="submitRequest()">Submit Bus Pass Request</button>
    </div>`;
}

async function submitRequest() {
  const name = document.getElementById('sn-name').value.trim();
  const sid = document.getElementById('sn-sid').value.trim();
  const phone = document.getElementById('sn-phone').value.trim();
  const route = document.getElementById('sn-route').value;
  const stop = document.getElementById('sn-stop').value;
  const photoFile = document.getElementById('sn-photo').files[0];

  if (!name || !sid || !phone) {
    toast('Please fill all required fields.', 'red');
    return;
  }

  toggleLoading(true);
  let photoData = null;
  if (photoFile) {
    photoData = await compressImage(photoFile, 300);
  }

  const reqData = {
    id: 'REQ_' + Date.now(),
    studentName: name, studentId: sid, studentPhone: phone,
    route, stop,
    status: 'pending', fee: null,
    receiptImage: null,
    busCardExpiry: null,
    studentPhoto: photoData
  };

  try {
    await apiFetch('/requests', { method: 'POST', body: JSON.stringify(reqData) });
    currentStudentId = sid;
    document.getElementById('stu-badge').textContent = sid;
    await refreshStudent();
    sNav(document.querySelector('#student .sitem[data-panel=s-home]'), 's-home');
    toast('Request submitted! Awaiting admin fee assignment.', 'green');
  } catch (e) {
    toast('Error submitting request: ' + e.message, 'red');
  } finally {
    toggleLoading(false);
  }
}

async function renderStudentPay() {
  const r = await getMyReq();
  const el = document.getElementById('s-pay-content');
  if (!r) { el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>Submit a request first.</div>'; return; }
  if (r.status === 'pending') { el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>Waiting for admin to assign your fee...</div>'; return; }
  if (r.status === 'payment_submitted') { el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>Receipt submitted! Awaiting admin approval.</div>'; return; }
  if (r.status === 'approved') { el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>All done! Your bus card is ready.</div>'; return; }
  if (r.status === 'fee_assigned') {
    const settings = await getSettings();
    el.innerHTML = `
      <div class="card">
        <div class="card-title">💳 Bank Details & Fee Info</div>
        <div class="info-grid">${infoGrid([['Route', r.route], ['Stop', r.stop], ['Fee Amount', 'PKR ' + r.fee], ['Bus No', r.busNo || '—']])}</div>
        <div style="margin: 15px 0; padding: 10px; border-radius: 8px; background: rgba(139,92,246,0.1); border: 1px dashed var(--purple); color: var(--purple); text-align: center; font-weight: 600; display: flex; justify-content: center; gap: 10px; align-items: center; flex-wrap: wrap;">
          <span>Bank Account / UPI ID:</span>
          <span style="font-size: 16px;">${settings.bankAccount || 'Not configured by Admin'}</span>
        </div>
        <hr>
        <div class="card-title" style="margin-top:0">📤 Submit Payment Receipt</div>
        <div class="mfld"><label>Receipt / Transaction ID (for manual verification)</label>
          <textarea id="rec-note" placeholder="Enter transaction ID, bank ref, etc."></textarea>
        </div>
        <div class="mfld"><label>Upload Receipt Image (JPEG/PNG)</label>
          <input type="file" id="rec-file" accept="image/*" style="margin-top:5px; color:var(--muted); font-size:12px;" />
        </div>
        <button class="btn btn-purple" onclick="submitReceipt()">🧾 Submit Receipt to Admin</button>
      </div>`;
  }
}

async function submitReceipt() {
  const note = document.getElementById('rec-note').value.trim();
  const fileInput = document.getElementById('rec-file');
  const r = await getMyReq();

  if (!note && !fileInput.files[0]) {
    toast('Please enter a reference ID or upload a receipt image.', 'red');
    return;
  }

  toggleLoading(true);
  let receiptData = null;
  if (fileInput.files[0]) {
    receiptData = await compressImage(fileInput.files[0], 600);
  }

  try {
    await updateReq(r.id, {
      status: 'payment_submitted',
      receiptNote: note,
      receiptImage: receiptData
    });
    await refreshStudent();
    toast('Receipt submitted! Admin will review and issue your bus card.', 'green');
  } catch (e) {
    toast('Error submitting receipt: ' + e.message, 'red');
  } finally {
    toggleLoading(false);
  }
}

async function renderStudentCard() {
  const r = await getMyReq();
  const el = document.getElementById('s-card-content');
  if (!r || r.status !== 'approved') {
    el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>Your bus card will appear here once approved.</div>';
    return;
  }
  const settings = await getSettings();
  el.innerHTML = getBusCardHtml(r, settings) + `
    <div style="margin-top:14px;display:flex;gap:10px;justify-content:center;">
      <button class="btn btn-green btn-sm" onclick="downloadCard()">Download Bus Card</button>
      <button class="btn btn-outline btn-sm" onclick="refreshStudent()">Refresh</button>
    </div>`;
}

async function downloadCard() {
  const r = await getMyReq();
  if (!r) return;
  const settings = await getSettings();
  const cardHtml = getBusCardHtml(r, settings);

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Bus Pass – ${r.studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    :root { --primary: #0ea5e9; }
    body { font-family: 'Inter', sans-serif; background: #f1f5f9; display: flex; justify-content: center; padding: 40px; color: #1e293b; -webkit-print-color-adjust: exact; }
    .bus-card {
        background: #ffffff; border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; width: 380px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); color: #1a202c;
    }
    .bc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .bc-logo { width: 45px; height: 45px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 3px; display: flex; align-items: center; justify-content: center; }
    .bc-title { font-size: 16px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: var(--primary); }
    .bc-sub { font-size: 10px; font-weight: 600; color: #64748b; letter-spacing: 0.5px; }
    .bc-name { font-size: 22px; font-weight: 800; margin-bottom: 4px; color: #0f172a; }
    .bc-id { font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 15px; }
    .bc-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; background: #f1f5f9; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; }
    .bc-field .bl { font-size: 9px; color: var(--primary); text-transform: uppercase; font-weight: 800; margin-bottom: 2px; }
    .bc-field .bv { font-size: 12px; font-weight: 700; color: #1e293b; }
    .bc-exp { display: flex; align-items: center; justify-content: space-between; margin-top: 15px; padding: 10px 14px; background: #ecfdf5; border-radius: 10px; border: 1px solid #10b981; }
    .bc-exp-txt { font-size: 11px; color: #059669; font-weight: 700; }
    @media print { body { background: white; padding: 0; } .bus-card { box-shadow: none; } }
  </style>
  </head><body>
  ${cardHtml}
  <script>window.onload = function() { setTimeout(()=>window.print(), 800); };<\/script>
  </body></html>`);
  w.document.close();
}

// ── BUS STAFF MODULE ──────────────────────────────────────
async function sfNav(btn, panel) {
  document.querySelectorAll('#staff .sitem').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#staff .panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panel).classList.add('active');

  if (panel === 'sf-list') await renderStaffList();
}

async function refreshStaff() { await renderStaffList(); }

async function renderStaffList() {
  const reqs = await getReqs();
  const list = reqs.filter(r => r.status === 'approved');
  const el = document.getElementById('sf-list-content');
  if (!list.length) { el.innerHTML = '<div class="no-req"><div class="nr-icon"></div>No active cards found.</div>'; return; }
  el.innerHTML = list.map(r => `
    <div class="req-item" onclick="viewCardModule('${r.id}')">

      <div class="req-info">
        <div class="req-name">${r.studentName}</div>
        <div class="req-meta">ID: ${r.studentId} &nbsp;|&nbsp; ${r.route} → ${r.stop}</div>
        <div class="req-meta">Valid until: ${r.busCardExpiry}</div>
      </div>
      <button class="btn btn-primary btn-sm" style="width:auto">View Pass</button>
    </div>`).join('');
}

// ── UTILITIES ─────────────────────────────────────────────
function infoGrid(pairs) {
  return pairs.map(([l, v]) => `<div class="info-cell"><div class="lbl">${l}</div><div class="val">${v || '—'}</div></div>`).join('');
}
function fmtDate(ts) { return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
function statusLabel(s) {
  return { pending: 'Pending Review', fee_assigned: 'Fee Assigned', payment_submitted: 'Receipt Submitted', approved: 'Approved', rejection: 'Rejected' }[s] || s;
}

async function cleanupExpiredCards() {
  const reqs = await getReqs();
  if (!reqs.length) return;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const r of reqs) {
    if (r.status !== 'approved' || !r.busCardExpiry) continue;

    const parts = r.busCardExpiry.split('/');
    if (parts.length !== 3) continue;

    const expiryDate = new Date(parts[2], parts[1] - 1, parts[0]);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < now) {
      // Logic for cleanup could be delete or status update
      // For now, let's just log or delete
      // await deleteReq(r.id); 
    }
  }
}

// ── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // await cleanupExpiredCards();
  // Optional: Load initial data if needed
});
