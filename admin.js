const SUPABASE_URL = 'https://qjamhyzdzztqvycxfjrd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7yGiH_4H9xfUao610PpJhQ_qraS_Ol0';
const ADMIN_PASSWORD = 'E@147250';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let allData = [];
let filteredData = [];
let sortField = 'created_at';
let sortAsc = false;

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const tableBody = document.getElementById('tableBody');
const emptyMsg = document.getElementById('emptyMsg');
const searchInput = document.getElementById('searchInput');
const filterLevel = document.getElementById('filterLevel');
const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const refreshBtn = document.getElementById('refreshBtn');
const totalCount = document.getElementById('totalCount');
const beginnerCount = document.getElementById('beginnerCount');
const midCount = document.getElementById('midCount');
const advancedCount = document.getElementById('advancedCount');

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const modalTitle = document.getElementById('modalTitle');
const editId = document.getElementById('editId');
const editName = document.getElementById('editName');
const editPhone = document.getElementById('editPhone');
const editNationalId = document.getElementById('editNationalId');
const editLevel = document.getElementById('editLevel');
const editBirthDate = document.getElementById('editBirthDate');
const cancelBtn = document.getElementById('cancelBtn');

document.addEventListener('contextmenu', e => e.preventDefault());

function checkSession() {
  if (sessionStorage.getItem('admin_logged') === 'true') showDashboard();
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
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#E63946;">حدث خطأ في التحميل</td></tr>';
    return;
  }

  allData = data || [];
  updateStats();
  applyFilters();
}

function updateStats() {
  totalCount.textContent = allData.length;
  beginnerCount.textContent = allData.filter(d => d.level === 'مبتدئ').length;
  midCount.textContent = allData.filter(d => d.level === 'متوسط').length;
  advancedCount.textContent = allData.filter(d => d.level === 'متقدم').length;
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const lvl = filterLevel.value;

  filteredData = allData.filter(row => {
    const matchSearch = !q ||
      (row.name || '').toLowerCase().includes(q) ||
      (row.phone || '').includes(q) ||
      (row.national_id || '').includes(q);
    const matchLevel = !lvl || row.level === lvl;
    return matchSearch && matchLevel;
  });

  sortData();
  renderTable();
}

function sortData() {
  filteredData.sort((a, b) => {
    let va = a[sortField] || '';
    let vb = b[sortField] || '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });
}

function renderTable() {
  if (filteredData.length === 0) {
    tableBody.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  tableBody.innerHTML = filteredData.map((row, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.phone)}</td>
      <td>${escapeHtml(row.national_id)}</td>
      <td>${escapeHtml(row.level)}</td>
      <td>${row.birth_date || '-'}</td>
      <td>${formatDate(row.created_at)}</td>
      <td>
        <button class="action-btn edit" onclick="editRow(${row.id})" title="تعديل">
          <i class="fa-solid fa-pen"></i>
        </button>
        <a class="action-btn whatsapp" href="https://wa.me/2${row.phone}?text=${encodeURIComponent('السلام عليكم ' + row.name + '، بخصوص مسابقة المصباح المنير')}" target="_blank" title="واتساب">
          <i class="fa-brands fa-whatsapp"></i>
        </a>
        <button class="action-btn delete" onclick="deleteRow(${row.id})" title="حذف">
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
  if (error) { alert('حدث خطأ في الحذف'); return; }
  loadData();
};

window.editRow = function(id) {
  const row = allData.find(r => r.id === id);
  if (!row) return;
  modalTitle.textContent = 'تعديل بيانات المتسابق';
  editId.value = row.id;
  editName.value = row.name || '';
  editPhone.value = row.phone || '';
  editNationalId.value = row.national_id || '';
  editLevel.value = row.level || 'مبتدئ';
  editBirthDate.value = row.birth_date || '';
  editModal.classList.add('active');
};

addBtn.addEventListener('click', () => {
  modalTitle.textContent = 'إضافة متسابق جديد';
  editForm.reset();
  editId.value = '';
  editModal.classList.add('active');
});

cancelBtn.addEventListener('click', () => editModal.classList.remove('active'));

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) editModal.classList.remove('active');
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: editName.value.trim(),
    phone: editPhone.value.trim(),
    national_id: editNationalId.value.trim(),
    level: editLevel.value,
    birth_date: editBirthDate.value
  };

  if (!data.name || !data.phone || !data.national_id || !data.level || !data.birth_date) {
    alert('من فضلك اكمل جميع البيانات');
    return;
  }

  let error;
  if (editId.value) {
    ({ error } = await db.from('registrations').update(data).eq('id', editId.value));
  } else {
    ({ error } = await db.from('registrations').insert([data]));
  }

  if (error) { alert('حدث خطأ، حاول تاني'); return; }

  editModal.classList.remove('active');
  loadData();
});

searchInput.addEventListener('input', applyFilters);
filterLevel.addEventListener('change', applyFilters);
refreshBtn.addEventListener('click', loadData);

document.querySelectorAll('thead th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const field = th.dataset.sort;
    if (sortField === field) sortAsc = !sortAsc;
    else { sortField = field; sortAsc = true; }
    sortData();
    renderTable();
  });
});

exportBtn.addEventListener('click', () => {
  if (filteredData.length === 0) { alert('لا يوجد بيانات للتصدير'); return; }
  let csv = '\uFEFF';
  csv += 'م,الاسم,الموبايل,الرقم القومي,المستوى,تاريخ الميلاد,وقت التسجيل\n';
  filteredData.forEach((row, i) => {
    csv += [
      i + 1, row.name, row.phone, row.national_id, row.level, row.birth_date, formatDate(row.created_at)
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'المتسابقين_' + new Date().toISOString().slice(0,10) + '.csv';
  link.click();
});

exportPdfBtn.addEventListener('click', () => {
  if (filteredData.length === 0) { alert('لا يوجد بيانات للتصدير'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(16);
  doc.text('قائمة المتسابقين - مسابقة المصباح المنير', 150, 15, { align: 'center' });
  doc.autoTable({
    startY: 25,
    head: [['م', 'الاسم', 'الموبايل', 'الرقم القومي', 'المستوى', 'تاريخ الميلاد']],
    body: filteredData.map((row, i) => [i + 1, row.name, row.phone, row.national_id, row.level, row.birth_date]),
    styles: { font: 'helvetica', fontSize: 10, halign: 'center' },
    headStyles: { fillColor: [15, 59, 76], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 249, 244] }
  });
  doc.save('المتسابقين_' + new Date().toISOString().slice(0,10) + '.pdf');
});

checkSession();