// script.js
// Single-page app logic using localStorage for persistence

// --- Utility helpers ---
const qs = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);

// --- App state ---
let state = {
  users: JSON.parse(localStorage.getItem('ef_users') || '{}'),
  currentUser: localStorage.getItem('ef_current') || null,
  // data keyed by username
};

// Save helper
function saveState(){
  localStorage.setItem('ef_users', JSON.stringify(state.users));
  if(state.currentUser) localStorage.setItem('ef_current', state.currentUser);
  else localStorage.removeItem('ef_current');
}

// --- UI selectors ---
const showLoginBtn = qs('#show-login');
const showRegisterBtn = qs('#show-register');
const registerSection = qs('#register-section');
const loginSection = qs('#login-section');
const dashboardSection = qs('#dashboard');
dashboardSection.style.display = "none";

// NAV buttons
qsa('#sidebar nav button').forEach(btn => btn.addEventListener('click', e => {
  const target = e.currentTarget.dataset.show;
  showPage(target);
}));

// Auth show links
qs('#to-login-1').addEventListener('click', e=>{e.preventDefault(); showOnly('login');});
qs('#to-register-1').addEventListener('click', e=>{e.preventDefault(); showOnly('register');});
showLoginBtn.addEventListener('click', ()=> showOnly('login'));
showRegisterBtn.addEventListener('click', ()=> showOnly('register'));

function showOnly(panel){
  registerSection.classList.add('hidden');
  loginSection.classList.add('hidden');
  dashboardSection.classList.add('hidden');
  if(panel==='login') loginSection.classList.remove('hidden');
  else if(panel==='register') registerSection.classList.remove('hidden');
  else if(panel==='dashboard') dashboardSection.classList.remove('hidden');
}

function showPage(page){
  qsa('.page').forEach(p=>p.classList.add('hidden'));
  const el = qs('#'+page);
  if(el) el.classList.remove('hidden');
}

// --- Registration & Login ---
qs('#register-form').addEventListener('submit', e=>{
  e.preventDefault();
  const u = qs('#reg-username').value.trim();
  const p = qs('#reg-password').value;
  const p2 = qs('#reg-password2').value;
  if(!u || !p) return alert('Enter username and password');
  if(p !== p2) return alert('Passwords do not match');
  if(state.users[u]) return alert('Username exists');
  state.users[u] = {
    password: p,
    family: [], // {name, password}
    expenses: [], // {date,category,amount,owner}
    budgets: {}, // category: amount
    badges: [],
    reminders: {time: null},
  };
  state.currentUser = u;
  saveState();
  setupForUser();
  dashboardSection.style.display = "flex";
  showOnly('dashboard');
  showPage('profile');
});

qs('#login-form').addEventListener('submit', e=>{
  e.preventDefault();
  const u = qs('#login-username').value.trim();
  const p = qs('#login-password').value;
  if(!state.users[u] || state.users[u].password !== p) return alert('Invalid credentials');
  state.currentUser = u;
  saveState();
  setupForUser();
  dashboardSection.style.display = "flex";
  showOnly('dashboard');
  showPage('profile');
});

// Logout & delete
qs('#logout').addEventListener('click', ()=>{
  state.currentUser = null; saveState(); showOnly('login');
});
qs('#delete-account').addEventListener('click', ()=>{
  if(!confirm('Delete account permanently?')) return;
  delete state.users[state.currentUser];
  state.currentUser = null; 
  saveState(); 
  dashboardSection.style.display = "none";
  showOnly('register');
});

// --- After login setup ---
function setupForUser(){
  if(!state.currentUser) return;
  qs('#user-display').textContent = state.currentUser;
  // populate owner selects (user + family)
  refreshFamilyList();
  refreshOwnerOptions();
  refreshExpensesTable();
  refreshBudgetsTable();
  refreshBadges();
  refreshAlerts();
  refreshMemberSelect();
  restoreReminderUI();
}

// --- Family management ---
qs('#add-member-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = qs('#member-name').value.trim();
  const pass = qs('#member-password').value;
  const pass2 = qs('#member-password2').value;

  if (!name || !pass) return alert('Enter member details');
  if (pass !== pass2) return alert('Passwords do not match');

  // Ensure no duplicate account
  if (state.users[name]) return alert('This username already exists');

  // Create standalone new user
  state.users[name] = {
    password: pass,
    family: [],
    expenses: [],
    budgets: {},
    badges: [],
    reminders: { time: null }
  };

  // Link under parent
  const udata = state.users[state.currentUser];
  if (!udata.family.find(m => m.name === name)) {
    udata.family.push({ name });
  }

  saveState();
  qs('#member-name').value = '';
  qs('#member-password').value = '';
  qs('#member-password2').value = '';

  refreshFamilyList();
  refreshOwnerOptions();
  refreshMemberSelect();
  alert("Family member added successfully!");
});



function refreshFamilyList(){
  const list = qs('#family-list'); 
  list.innerHTML='';

  const udata = state.users[state.currentUser];
  if(!udata) return;

  // Primary account
  const liMain = document.createElement('li');
  liMain.textContent = state.currentUser + ' (you)';
  liMain.classList.add("clickable");
  liMain.onclick = ()=> showFamilyProfile(state.currentUser, udata.password);
  list.appendChild(liMain);

  // Family members
  udata.family.forEach((m, idx) => {
    const li = document.createElement('li');
    li.classList.add("clickable");
    li.textContent = m.name;

    // view profile
    li.onclick = () => showFamilyProfile(m.name, m.password);

    // delete button
    const del = document.createElement('button');
    del.textContent='Remove';
    del.style.marginLeft='8px';
    del.onclick = (e)=>{
      e.stopPropagation(); // prevents opening profile
      if(!confirm('Remove family member?')) return;
      udata.family.splice(idx,1); 
      saveState(); 
      refreshFamilyList(); 
      refreshOwnerOptions(); 
      refreshMemberSelect();
    };

    li.appendChild(del);
    list.appendChild(li);
  });
}


function refreshOwnerOptions(){
  const sel = qs('#expense-owner'); sel.innerHTML='';
  const udata = state.users[state.currentUser];
  const optionYou = document.createElement('option'); optionYou.value=state.currentUser; optionYou.textContent=state.currentUser + ' (you)'; sel.appendChild(optionYou);
  udata.family.forEach(m=>{const o=document.createElement('option');o.value=m.name;o.textContent=m.name;sel.appendChild(o)});
}

// --- Expenses ---
qs('#expense-form').addEventListener('submit', e=>{
  e.preventDefault();
  const date = qs('#expense-date').value;
  const cat = qs('#expense-category').value.trim();
  const amt = Number(qs('#expense-amount').value);
  const owner = qs('#expense-owner').value;
  if(!date || !cat || !amt) return alert('Provide details');
  const udata = state.users[state.currentUser];
  udata.expenses.push({date,category:cat,amount:amt,owner});
  saveState();
  refreshExpensesTable();
  refreshBudgetsTable();
  refreshAlerts();
  maybeAwardBadges();
  qs('#expense-form').reset();
});

function refreshExpensesTable(){
  const tbody = qs('#expenses-table tbody'); tbody.innerHTML='';
  const udata = state.users[state.currentUser];
  udata.expenses.slice().reverse().forEach((ex,idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${ex.date}</td><td>${ex.category}</td><td>${ex.amount}</td><td>${ex.owner}</td><td></td>`;
    const delBtn = document.createElement('button'); delBtn.textContent='Delete';
    delBtn.addEventListener('click', ()=>{
      if(!confirm('Delete this expense?')) return;
      // find real index
      const realIndex = udata.expenses.length - 1 - idx;
      udata.expenses.splice(realIndex,1); saveState(); refreshExpensesTable(); refreshBudgetsTable(); refreshAlerts();
    });
    tr.children[4].appendChild(delBtn);
    tbody.appendChild(tr);
  });
}

// --- Budgets ---
qs('#budget-form').addEventListener('submit', e=>{
  e.preventDefault();
  const cat = qs('#budget-category').value.trim();
  const amt = Number(qs('#budget-amount').value);
  if(!cat || !amt) return alert('Provide budget');
  const udata = state.users[state.currentUser];
  udata.budgets[cat] = amt;
  saveState();
  qs('#budget-form').reset();
  refreshBudgetsTable();
  refreshAlerts();
});

function refreshBudgetsTable(){
  const tbody = qs('#budgets-table tbody'); tbody.innerHTML='';
  const udata = state.users[state.currentUser];
  const sums = {};
  udata.expenses.forEach(e=>{sums[e.category] = (sums[e.category] || 0) + Number(e.amount)});
  for(const cat in udata.budgets){
    const budget = udata.budgets[cat];
    const spent = sums[cat] || 0;
    const rem = budget - spent;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${cat}</td><td>${budget}</td><td>${spent}</td><td>${rem}</td>`;
    tbody.appendChild(tr);
  }
}

// --- Member expenses view ---
function refreshMemberSelect(){
  const sel = qs('#member-select'); 
  sel.innerHTML='';

  let user = state.currentUser;
  let udata = state.users[user];

  // Detect parent (if this user is inside someone else's family)
  let parent = null;
  for (let p in state.users){
    if (state.users[p].family.find(m => m.name === user)){
      parent = p;
      break;
    }
  }

  // Member list
  let members = [];

  if (parent) {
    // Child logged in → family is parent + siblings
    members.push(parent);
    members.push(...state.users[parent].family.map(m => m.name));
  } else {
    // Parent logged in
    members.push(user);
    members.push(...udata.family.map(m => m.name));
  }

  // Fill dropdown
  members.forEach(n => {
    if (state.users[n]) {
      const o = document.createElement("option");
      o.value = n;
      o.textContent = n === user ? `${n} (you)` : n;
      sel.appendChild(o);
    }
  });

  sel.addEventListener('change', () => refreshMemberExpensesTable(sel.value));
  refreshMemberExpensesTable(sel.value || user);
}


function refreshMemberExpensesTable(owner){
  const tbody = qs('#member-expenses-table tbody'); 
  tbody.innerHTML='';

  const rows = state.users[owner]?.expenses || [];

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date}</td><td>${r.category}</td><td>${r.amount}</td>`;
    tbody.appendChild(tr);
  });
}


// --- Overspend alerts ---
function refreshAlerts(){
  const tbody = qs('#alerts-table tbody'); tbody.innerHTML='';
  const udata = state.users[state.currentUser];
  const sums = {};
  udata.expenses.forEach(e=>{sums[e.category] = (sums[e.category] || 0) + Number(e.amount)});
  for(const cat in udata.budgets){
    const budget = udata.budgets[cat];
    const spent = sums[cat] || 0;
    if(spent > budget){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${new Date().toLocaleDateString()}</td><td>${cat}</td><td>${spent}</td><td>${budget}</td><td>${spent - budget}</td>`;
      tbody.appendChild(tr);
    }
  }
}

// --- Badges ---
function maybeAwardBadges(){
  const udata = state.users[state.currentUser];
  // Example badge rules:
  // Saver of the Month: if total saved this month (sum of budgets - sum of spent in those categories) > 1000
  const sums = {};
  udata.expenses.forEach(e=>{sums[e.category] = (sums[e.category] || 0) + Number(e.amount)});
  let saved = 0;
  for(const cat in udata.budgets){
    const budget = udata.budgets[cat];
    const spent = sums[cat] || 0;
    if(budget > spent) saved += (budget - spent);
  }
  if(saved >= 2000 && !udata.badges.includes('Saver of the Month')){
    udata.badges.push('Saver of the Month');
    alert('Badge earned: Saver of the Month');
  }
  saveState(); refreshBadges();
}

function refreshBadges(){
  const list = qs('#badges-list'); list.innerHTML='';
  const udata = state.users[state.currentUser];
  if(!udata || !udata.badges.length) { list.textContent = 'No badges yet'; return; }
  udata.badges.forEach(b=>{
    const d = document.createElement('div'); d.className='badge'; d.textContent = b; list.appendChild(d);
  });
}

// --- Reminders ---
qs('#reminder-form').addEventListener('submit', e=>{
  e.preventDefault();
  const time = qs('#reminder-time').value;
  const udata = state.users[state.currentUser];
  udata.reminders.time = time;
  saveState();
  restoreReminderUI();
  alert('Reminder set for ' + time + ' (works while page is open)');
});

function restoreReminderUI(){
  const udata = state.users[state.currentUser];
  const status = qs('#reminder-status');
  if(udata && udata.reminders && udata.reminders.time){
    qs('#reminder-time').value = udata.reminders.time;
    status.textContent = 'Reminder set at ' + udata.reminders.time;
  } else status.textContent = 'No reminder set';
}

// Reminder runner: check every minute while page is open
setInterval(()=>{
  if(!state.currentUser) return;
  const udata = state.users[state.currentUser];
  if(!udata || !udata.reminders || !udata.reminders.time) return;
  const now = new Date();
  const hhmm = now.toTimeString().slice(0,5);
  if(hhmm === udata.reminders.time){
    // simple de-dupe using lastShown
    if(udata.reminders.lastShown === hhmm) return;
    udata.reminders.lastShown = hhmm; saveState();
    // show notification if permitted
    if(window.Notification && Notification.permission === 'granted'){
      new Notification('Daily Expense Reminder', {body: 'Don\'t forget to log today\'s expenses!'});
    } else if(window.Notification && Notification.permission !== 'denied'){
      Notification.requestPermission().then(per => { if(per==='granted') new Notification('Daily Expense Reminder',{body:'Don\'t forget to log today\'s expenses!'}) });
    } else {
      alert('Reminder: Don\'t forget to log today\'s expenses!');
    }
  }
}, 60000);

// --- Init on load ---
dashboardSection.classList.add('hidden');
window.addEventListener('load', ()=>{
  if(state.currentUser && state.users[state.currentUser]){
    showOnly('dashboard'); setupForUser();
  } else showOnly('register');
});

// Expose small helper for developer testing
window.__ef_state = state;
function showFamilyProfile(name, pass){
  const view = qs("#family-profile-view");
  qs("#fam-name").textContent = name;
  qs("#fam-pass").textContent = pass;

  view.classList.remove("hidden");
}