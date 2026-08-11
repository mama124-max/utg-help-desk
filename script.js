/* ================================================================
   1. REUSABLE UI COMPONENTS
   ================================================================ */

function Button({ label, variant = 'primary', size = '', onClick, loading = false, disabled = false, type = 'button' }) {
  const btn = document.createElement('button');
  btn.type = type;
  btn.className = `btn btn-${variant} ${size ? 'btn-' + size : ''}`;
  btn.disabled = disabled || loading;
  btn.setAttribute('aria-busy', loading ? 'true' : 'false');
  btn.innerHTML = loading
    ? `<span class="spinner ${variant === 'secondary' || variant === 'ghost' ? 'spinner-dark' : ''}"></span><span>${label}</span>`
    : label;
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}

const STATUS_META = {
  pending:   { cls: 'badge-pending',   text: 'Pending' },
  review:    { cls: 'badge-review',    text: 'In review' },
  resolved:  { cls: 'badge-resolved',  text: 'Resolved' },
  escalated: { cls: 'badge-escalated', text: 'Escalated' },
};

function Badge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const span = document.createElement('span');
  span.className = `badge ${meta.cls}`;
  span.innerHTML = `<span class="badge-dot" aria-hidden="true"></span>${meta.text}`;
  return span;
}

function StatusTrail({ status }) {
  const stages = ['Submitted', 'Lecturer review', 'Resolved'];
  const stageIndex = { pending: 0, review: 1, resolved: 2, escalated: 1 }[status] || 0;

  const wrap = document.createElement('div');
  const trail = document.createElement('div');
  trail.className = 'trail';
  trail.setAttribute('role', 'img');
  trail.setAttribute('aria-label', `Complaint stage: ${stages[stageIndex]} of ${stages.length}`);

  stages.forEach((_, i) => {
    const step = document.createElement('div');
    step.className = 'trail-step';
    const node = document.createElement('div');
    node.className = 'trail-node' + (i < stageIndex ? ' done' : i === stageIndex ? ' current' : '');
    step.appendChild(node);
    if (i < stages.length - 1) {
      const line = document.createElement('div');
      line.className = 'trail-line' + (i < stageIndex ? ' done' : '');
      step.appendChild(line);
    }
    trail.appendChild(step);
  });

  const labels = document.createElement('div');
  labels.className = 'trail-labels';
  labels.innerHTML = stages.map(s => `<span>${s}</span>`).join('');

  wrap.append(trail, labels);
  return wrap;
}

function ComplaintCard({ id, title, course, category, description, status, date, onOpen }) {
  const card = document.createElement('article');
  card.className = 'complaint-card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');

  const top = document.createElement('div');
  top.className = 'cc-top';
  const metaWrap = document.createElement('div');
  metaWrap.innerHTML = `
    <div class="cc-meta">${id} · ${category} · ${date}</div>
    <div class="cc-title">${title}</div>
  `;
  top.appendChild(metaWrap);
  top.appendChild(Badge({ status }));

  const desc = document.createElement('p');
  desc.className = 'cc-desc';
  desc.textContent = description;

  const footer = document.createElement('div');
  footer.className = 'cc-footer';
  footer.innerHTML = `<span class="cc-course">${course}</span>`;
  const viewBtn = Button({ label: 'View details', variant: 'ghost', size: 'sm' });
  footer.appendChild(viewBtn);

  card.append(top, desc, StatusTrail({ status }), footer);

  const open = () => onOpen && onOpen({ id, title, course, category, description, status, date });
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

  return card;
}

function showToast(message, variant = 'default') {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = `toast ${variant}`;
  toast.textContent = message;
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ================================================================
   2. DATABASE & AUTHENTICATION CONFIGURATION
   ================================================================ */

const SUPABASE_URL = 'https://wcmswcchshdppaxrocpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rMzgvrNyWbWNsE_gSqqUTg_ojwj0imc';
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;

let session = null;
let isSignUpMode = false;
let selectedRole = 'student';

function authHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${session ? session.access_token : SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
}

/* ================================================================
   3. SCREEN RENDERERS
   ================================================================ */

function renderAuthScreen() {
  const authContainer = document.getElementById('authScreen');
  const appContainer = document.getElementById('appScreen');

  if (!authContainer || !appContainer) return;

  authContainer.classList.remove('hidden');
  appContainer.classList.add('hidden');

  authContainer.innerHTML = `
    <div class="auth-wrap">
      <h2>${isSignUpMode ? 'Create Account' : 'Welcome Back'}</h2>
      <p class="sub">${isSignUpMode ? 'Sign up to submit and track complaints.' : 'Sign in to access your portal.'}</p>
      
      <form id="authForm">
        ${isSignUpMode ? `
          <div class="role-pick">
            <button type="button" class="${selectedRole === 'student' ? 'active' : ''}" id="btnRoleStudent">Student</button>
            <button type="button" class="${selectedRole === 'lecturer' ? 'active' : ''}" id="btnRoleLecturer">Lecturer</button>
          </div>
          <div class="field">
            <label for="fullName">Full Name</label>
            <input type="text" id="fullName" required placeholder="e.g. Lamin Jarju">
          </div>
          ${selectedRole === 'student' ? `
            <div class="field">
              <label for="matricNo">Matriculation Number</label>
              <input type="text" id="matricNo" required placeholder="e.g. 22426047">
            </div>
          ` : ''}
        ` : ''}

        <div class="field">
          <label for="email">Email Address</label>
          <input type="email" id="email" required placeholder="you@utg.edu.gm">
        </div>
        
        <div class="field">
          <label for="password">Password</label>
          <input type="password" id="password" required placeholder="••••••••">
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px;">
          ${isSignUpMode ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div class="auth-switch">
        <span>${isSignUpMode ? 'Already have an account?' : "Don't have an account?"}</span>
        <button type="button" id="toggleAuthBtn">${isSignUpMode ? 'Sign In' : 'Sign Up'}</button>
      </div>
    </div>
  `;

  document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
  document.getElementById('toggleAuthBtn').addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    renderAuthScreen();
  });

  if (isSignUpMode) {
    document.getElementById('btnRoleStudent').addEventListener('click', () => {
      selectedRole = 'student';
      renderAuthScreen();
    });
    document.getElementById('btnRoleLecturer').addEventListener('click', () => {
      selectedRole = 'lecturer';
      renderAuthScreen();
    });
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    if (isSignUpMode) {
      const res = await fetch(`${AUTH_URL}/signup`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Sign up failed');
      
      showToast('Account created! Please sign in.', 'success');
      isSignUpMode = false;
      renderAuthScreen();
    } else {
      const res = await fetch(`${AUTH_URL}/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || 'Login failed');

      session = { access_token: data.access_token, user: data.user };
      showToast('Signed in successfully!', 'success');
      
      document.getElementById('authScreen').classList.add('hidden');
      document.getElementById('appScreen').classList.remove('hidden');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ================================================================
   4. INITIALIZATION & EVENT LISTENERS
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderAuthScreen();

  // Handle Semester Pills
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      showToast(`Filtered for Semester ${e.target.dataset.sem}`);
    });
  });

  // Handle Academic Year Selector
  document.getElementById('academicYearSelect')?.addEventListener('change', (e) => {
    showToast(`Academic Year set to ${e.target.value}`);
  });
});
