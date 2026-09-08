/**
 * POST /api/enquiry — receives a quote request and emails it to the studio.
 *
 * Runs as a serverless function (Vercel's `api/` convention; Netlify and
 * Cloudflare need only a different export wrapper). It exists because the
 * Resend API key must never reach the browser: the page posts here, and this
 * function — holding the key in an environment variable — talks to Resend.
 *
 * Environment variables:
 *   RESEND_API_KEY   required. Secret. From https://resend.com/api-keys
 *   ENQUIRY_TO       optional. Defaults to sparkup.ai@consultant.com
 *   ENQUIRY_FROM     optional. Defaults to Resend's shared testing sender.
 *                    Set to an address on a domain you have verified before
 *                    going live, or Resend will only deliver to your own
 *                    account address.
 *   ALLOWED_ORIGIN   optional. Comma-separated origins allowed to POST here.
 *                    Only needed when the site is served from a different
 *                    origin than this function (e.g. site on GitHub Pages,
 *                    function on Vercel). Same-origin needs nothing.
 */

const RESEND_ENDPOINT = process.env.RESEND_ENDPOINT || 'https://api.resend.com/emails';
const TO = process.env.ENQUIRY_TO || 'sparkup.ai@consultant.com';
const FROM = process.env.ENQUIRY_FROM || 'SparkUP AI <onboarding@resend.dev>';

/* The email the studio receives. Headings and order are fixed here rather than
   derived from the payload, so a malformed or hostile request cannot reshape
   the message. */
const ROWS = [
  ['Name', 'name'],
  ['Email', 'email'],
  ['WhatsApp Number', 'phone'],
  ['City', 'city'],
  ['Selected Plan', 'plan'],
  ['Selected Add-ons', 'addons'],
  ['Billing', 'billing'],
  ['Total', 'total'],
  ['What are they trying to fix?', 'message']
];

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* Values are trimmed and length-capped: the browser already validates, but a
   request can reach this function without going through the page at all. */
const clean = (v, max = 4000) => String(v == null ? '' : v).trim().slice(0, max);

function validate(body) {
  const errors = [];
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const message = clean(body.message, 4000);

  if (name.length < 2) errors.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email');
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) errors.push('phone');
  if (message.length < 5) errors.push('message');

  return { errors, name, email, phone, message };
}

function render(body) {
  const cell = (label, value) => `
      <tr>
        <td style="padding:14px 0 4px;font:600 12px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7a7d74;">${esc(label)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 10px;font:400 16px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#101114;white-space:pre-wrap;">${esc(value) || '<span style="color:#9a9d94;">Not provided</span>'}</td>
      </tr>`;

  const group = (title) => `
      <tr>
        <td style="padding:26px 0 2px;border-top:1px solid #e6e6e1;font:700 13px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#101114;">${title}</td>
      </tr>`;

  const at = (key) => clean(body[key]);

  return `<!doctype html><html><body style="margin:0;background:#f6f6f3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f3;padding:28px 12px;">
   <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e6e6e1;border-radius:14px;padding:30px 34px;">
      <tr><td style="font:700 24px/1.25 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#101114;">New Quote Request</td></tr>
      <tr><td style="padding-top:10px;font:400 15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#55584f;">You have received a new project enquiry through the SparkUP AI website.</td></tr>
      ${group('Customer details')}
      ${ROWS.slice(0, 4).map(([l, k]) => cell(l, at(k))).join('')}
      ${group('Project details')}
      ${ROWS.slice(4).map(([l, k]) => cell(l, at(k))).join('')}
      <tr><td style="padding:26px 0 0;border-top:1px solid #e6e6e1;font:400 13px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#7a7d74;">
        This enquiry was submitted through the SparkUP AI website quote form.
      </td></tr>
      <tr><td style="padding-top:18px;font:400 13px/1.7 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#55584f;">
        <strong style="color:#101114;">SparkUP AI</strong><br />
        Web Design &middot; AI Agents &middot; Motion Videos<br />
        <a href="mailto:sparkup.ai@consultant.com" style="color:#5c7f00;">sparkup.ai@consultant.com</a><br />
        <a href="https://wa.me/447984826727" style="color:#5c7f00;">+44 7984 826727</a>
      </td></tr>
    </table>
   </td></tr>
  </table>
  </body></html>`;
}

function renderText(body) {
  const at = (key) => clean(body[key]) || 'Not provided';
  return [
    'New Quote Request',
    '',
    'You have received a new project enquiry through the SparkUP AI website.',
    '',
    'CUSTOMER DETAILS',
    ...ROWS.slice(0, 4).map(([l, k]) => `\n${l}:\n${at(k)}`),
    '',
    'PROJECT DETAILS',
    ...ROWS.slice(4).map(([l, k]) => `\n${l}:\n${at(k)}`),
    '',
    'This enquiry was submitted through the SparkUP AI website quote form.',
    '',
    'SparkUP AI',
    'Web Design · AI Agents · Motion Videos',
    'sparkup.ai@consultant.com',
    '+44 7984 826727'
  ].join('\n');
}

function cors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGIN || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  if (body === null) {
    return res.status(400).json({ success: false, message: 'Malformed request body.' });
  }

  /* the honeypot: a real visitor never sees the field, so anything in it is a bot.
     Answer 200 so the bot believes it succeeded and does not retry. */
  if (clean(body.botcheck)) return res.status(200).json({ success: true });

  const { errors, name, email } = validate(body);
  if (errors.length) {
    return res.status(422).json({
      success: false, message: 'Some fields need attention.', fields: errors
    });
  }

  if (!process.env.RESEND_API_KEY) {
    /* Logged for the operator; the visitor is never told how the server is wired. */
    console.error('[enquiry] RESEND_API_KEY is not set — the enquiry was NOT sent.');
    return res.status(500).json({ success: false, message: 'Email service is not configured.' });
  }

  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,          /* replying to the alert answers the customer */
        subject: `New Project Quote Request — ${name}`,
        html: render(body),
        text: renderText(body)
      })
    });

    const out = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('[enquiry] Resend rejected the send:', r.status, out);
      return res.status(502).json({ success: false, message: 'Email provider rejected the message.' });
    }

    console.log('[enquiry] sent', out.id || '(no id)', 'to', TO);
    return res.status(200).json({ success: true, message: 'Enquiry sent.' });
  } catch (err) {
    console.error('[enquiry] send failed:', err && err.message);
    return res.status(502).json({ success: false, message: 'Could not reach the email provider.' });
  }
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

/* exported for the test harness */
export const __test = { validate, render, renderText, ROWS };
