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
  ['WhatsApp / Phone', 'phone'],
  ['City', 'city'],
  ['Selected Service/Plan', 'plan'],
  ['Selected Add-ons', 'addons'],
  ['Billing', 'billing'],
  ['Total', 'total'],
  ['Customer Requirements', 'message']
];

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* Trim only. Nothing here truncates: a customer's answer arrives whole,
   however long it is. Oversized bodies are refused with 413 rather than
   quietly shortened, so a message is never half-delivered without anyone
   noticing. */
const clean = (v) => String(v == null ? '' : v).trim();

/* ~100 KB of text, several times longer than any real enquiry. This is an
   abuse ceiling on the whole request, not a limit on the message. */
const MAX_BODY = 100000;

/* Country-agnostic. Accepts +, spaces, brackets, hyphens, dots and slashes in
   any arrangement, and judges the number by its digit count alone — 7 to 20
   spans every national and E.164 international form. No country is assumed. */
const PHONE_SHAPE = /^[+(\d][\d\s()+.\-/]*$/;
const phoneDigits = (v) => v.replace(/\D/g, '').length;

function validate(body) {
  const errors = [];
  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone);
  const message = clean(body.message);

  if (name.length < 2) errors.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email');
  if (!PHONE_SHAPE.test(phone) || phoneDigits(phone) < 7 || phoneDigits(phone) > 20) {
    errors.push('phone');
  }
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

  const at = (key) => clean(body[key]);

  return `<!doctype html><html><body style="margin:0;background:#f6f6f3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f3;padding:28px 12px;">
   <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e6e6e1;border-radius:14px;padding:30px 34px;">
      <tr><td style="font:700 24px/1.25 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;letter-spacing:.02em;color:#101114;">NEW CUSTOMER ENQUIRY</td></tr>
      ${ROWS.map(([l, k]) => cell(l, at(k))).join('')}
      <tr><td style="padding:26px 0 0;border-top:1px solid #e6e6e1;font:400 13px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#7a7d74;">
        Submitted from: SparkUp AI Website
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
    'NEW CUSTOMER ENQUIRY',
    '',
    ...ROWS.slice(0, 8).map(([l, k]) => `${l}: ${at(k)}`),
    '',
    'Customer Requirements:',
    at('message'),
    '',
    'Submitted from: SparkUp AI Website',
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

  /* A plain GET is a health check, so the deployment can be verified from a
     browser address bar without sending an email. It reports whether the
     function is running and whether it is configured — never a secret. If this
     returns 404 or a hosting error page, the function is not deployed at all,
     which is a different problem from a misconfigured one. */
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'enquiry',
      runtime: `node ${process.versions.node}`,
      resendKeyPresent: Boolean(process.env.RESEND_API_KEY),
      deliversTo: TO,
      sendsFrom: FROM,
      usingResendTestSender: FROM.includes('onboarding@resend.dev')
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  /* Hosts differ: some hand the handler a raw string, others a parsed object.
     Size is checked either way, so the ceiling is real rather than a guard that
     silently does nothing on whichever host parsed the body first. */
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  if (raw.length > MAX_BODY) {
    console.error('[enquiry] body too large:', raw.length, 'bytes — refused, not truncated');
    return res.status(413).json({ success: false, message: 'That message is too large to send.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  if (body === null) {
    return res.status(400).json({ success: false, message: 'Malformed request body.' });
  }

  /* Operational diagnostics. Field NAMES and sizes only — never their values,
     and never the key, of which only the presence is reported. */
  console.log('[enquiry] POST received | fields:', Object.keys(body).join(',') ||
              '(none)', '| message chars:', clean(body.message).length,
              '| RESEND_API_KEY present:', Boolean(process.env.RESEND_API_KEY));

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
        subject: `New SparkUp AI Website Enquiry \u2013 ${name}`,
        html: render(body),
        text: renderText(body)
      })
    });

    const out = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('[enquiry] Resend rejected the send:', r.status, out);
      /* The provider's own reason — "domain is not verified", "invalid from
         address" — is what actually identifies the problem, but it describes
         our configuration, so a visitor never sees it. Set ENQUIRY_DEBUG=1
         while setting the site up to have it echoed to the browser console,
         then remove the variable. */
      const detail = process.env.ENQUIRY_DEBUG === '1'
        ? ` (${r.status}: ${out && (out.message || out.name) || 'no reason given'})`
        : '';
      return res.status(502).json({
        success: false, message: `Email provider rejected the message.${detail}`
      });
    }

    console.log('[enquiry] accepted by Resend | id:', out.id || '(none returned)', '| to:', TO);
    return res.status(200).json({ success: true, message: 'Enquiry sent.' });
  } catch (err) {
    console.error('[enquiry] send failed:', err && err.message);
    return res.status(502).json({ success: false, message: 'Could not reach the email provider.' });
  }
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

/* exported for the test harness */
export const __test = { validate, render, renderText, ROWS };
