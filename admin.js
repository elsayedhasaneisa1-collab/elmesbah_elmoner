const SUPABASE_URL = 'https://qjamhyzdzztqvycxfjrd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7yGiH_4H9xfUao610PpJhQ_qraS_Ol0';
const ADMIN_PASSWORD = 'S@147258';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let allData = [];

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const tableBody = document.getElementById('tableBody');
const emptyMsg = document.getElementById('emptyMsg');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const refreshBtn = document.getElementById('refreshBtn');
const totalCount = document.getElementById('totalCount');
const beginnerCount = document.getElementById('beginnerCount');
const advancedCount = document.getElementById('advancedCount');

document.addEventListener('contextmenu', e => e.preventDefault());

function checkSession() {
  if (sessionStorage.getItem('admin_logged') === 'true') {
    showDashboard();
  }
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'block';
  loadData();
}

loginBtn.addEventListener('click', () => {
  if (passwordInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_logged', 'true');
    showDashboard();
  } else {
    loginError.textContent = 'كلمة المرور غير صحيحة';
    passwordInput.value = '';
  }
});

passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('admin_logged');
  location.reload();
});

async function loadData() {
  tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">جاري التحميل...</td></tr>';

  const { data, error } = await db
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#E63946;">حدث خطأ في التحميل</td></tr>';
    return;
  }

  allData = data || [];
  updateStats();
  renderTable(allData);
}

function updateStats() {
  totalCount.textContent = allData.length;
  beginnerCount.textContent = allData.filter(d => d.level === 'مبتدئ').length;
  advancedCount.textContent = allData.filter(d => d.level === 'متقدم').length;
}

function renderTable(data) {
  if (data.length === 0) {
    tableBody.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  tableBody.innerHTML = data.map((row, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.phone)}</td>
      <td>${escapeHtml(row.national_id)}</td>
      <td>${escapeHtml(row.level)}</td>
      <td>${row.birth_date || '-'}</td>
      <td>${formatDate(row.created_at)}</td>
      <td>
        <button class="delete-btn" onclick="deleteRow(${row.id})" title="حذف">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG') + ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

window.deleteRow = async function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المتسابق؟')) return;

  const { error } = await db.from('registrations').delete().eq('id', id);
  if (error) {
    alert('حدث خطأ في الحذف');
    return;
  }
  loadData();
};

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) { renderTable(allData); return; }

  const filtered = allData.filter(row =>
    (row.name || '').toLowerCase().includes(q) ||
    (row.phone || '').includes(q) ||
    (row.national_id || '').includes(q)
  );
  renderTable(filtered);
});

refreshBtn.addEventListener('click', loadData);

exportBtn.addEventListener('click', () => {
  if (allData.length === 0) {
    alert('لا يوجد بيانات للتصدير');
    return;
  }

  let csv = '\uFEFF';
  csv += 'م,الاسم,الموبايل,الرقم القومي,المستوى,تاريخ الميلاد,وقت التسجيل\n';

  allData.forEach((row, i) => {
    csv += [
      i + 1,
      row.name,
      row.phone,
      row.national_id,
      row.level,
      row.birth_date,
      formatDate(row.created_at)
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'المتسابقين_' + new Date().toISOString().slice(0,10) + '.csv';
  link.click();
});

checkSession();