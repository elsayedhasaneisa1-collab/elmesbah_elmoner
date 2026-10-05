export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_IDS = (process.env.TELEGRAM_CHAT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

    if (!TOKEN || CHAT_IDS.length === 0) {
      return res.status(500).json({ error: 'Missing config' });
    }

    const esc = (str) => String(str || '').replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');

    const dateStr = new Date().toLocaleString('ar-EG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message =
`🌟 *تسجيل جديد في مسابقة المصباح المنير* 🌟

━━━━━━━━━━━━━━━━━━
👤 *الاسم:*
${esc(data.name)}

📱 *رقم الموبايل:*
\`${esc(data.phone)}\`

🆔 *الرقم القومي:*
\`${esc(data.national_id)}\`

🎓 *المستوى:*
${esc(data.level)}

🎂 *تاريخ الميلاد:*
${esc(data.birth_date)}

⏰ *وقت التسجيل:*
${esc(dateStr)}
━━━━━━━━━━━━━━━━━━

✅ تم التسجيل بنجاح`;

    const sends = CHAT_IDS.map(chatId =>
      fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        })
      }).then(r => r.json()).catch(e => ({ ok: false, error: String(e) }))
    );

    const results = await Promise.all(sends);
    const successCount = results.filter(r => r.ok).length;

    if (successCount === 0) {
      return res.status(500).json({ error: 'All sends failed', results });
    }

    return res.status(200).json({ ok: true, sent: successCount, total: CHAT_IDS.length });

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}