const SUPABASE_URL = 'https://qjamhyzdzztqvycxfjrd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7yGiH_4H9xfUao610PpJhQ_qraS_Ol0';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', (e) => {
  if (e.key === 'F12') { e.preventDefault(); return false; }
  if (e.ctrlKey && ['u','U','s','S','p','P','c','C'].includes(e.key)) { e.preventDefault(); return false; }
  if (e.ctrlKey && e.shiftKey && ['I','J','C','i','j','c'].includes(e.key)) { e.preventDefault(); return false; }
  if (e.key === 'PrintScreen') { navigator.clipboard.writeText(''); e.preventDefault(); return false; }
});

document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());

document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });

const form = document.getElementById('regForm');
const successMsg = document.getElementById('successMsg');
const submitBtn = document.querySelector('.submit-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    name:        document.getElementById('name').value.trim(),
    phone:       document.getElementById('phone').value.trim(),
    national_id: document.getElementById('nationalId').value.trim(),
    level:       document.getElementById('level').value,
    birth_date:  document.getElementById('birthDate').value
  };

  if (!data.name || !data.phone || !data.national_id || !data.level || !data.birth_date) {
    alert('من فضلك اكمل جميع البيانات');
    return;
  }

  if (!/^01[0-9]{9}$/.test(data.phone)) {
    alert('رقم الموبايل غير صحيح');
    return;
  }

  if (!/^[0-9]{14}$/.test(data.national_id)) {
    alert('الرقم القومي يجب أن يكون 14 رقم');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التسجيل...';

  const { error } = await db.from('registrations').insert([data]);

  if (error) {
    console.error(error);
    alert('حصل خطأ، حاول تاني');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> سجّل الآن';
    return;
  }

  form.reset();
  successMsg.style.display = 'block';
  submitBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> سجّل الآن';
  submitBtn.disabled = false;

  setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
  successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
});