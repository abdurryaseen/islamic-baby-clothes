// Cloudflare Worker: turns the website's shopping bag into a Stripe Checkout session.
// Setup steps are in README.md. Your Stripe secret key is stored as a Worker secret
// (STRIPE_SECRET_KEY) — never put it in index.html.

// Prices live here (in cents) so shoppers can't change them in their browser.
// Keep these in sync with the prices shown on the website.
const PRODUCTS = {
  'hooded-thobe':     { name: 'Decorative Hooded Thobe', cents: 1899 },
  'collar-thobe':     { name: 'Collar Style Thobe',      cents: 1899 },
  'vneck-thobe':      { name: 'V-Neck Style Thobe',      cents: 1895 },
  'decorative-thobe': { name: 'Decorative Thobe',        cents: 1895 },
  'khimar':           { name: 'Baby Khimar',             cents: 796 },
  'girls-pants':      { name: 'Girls Pants',             cents: 795 },
  'kufi':             { name: 'Baby & Kids Kufi',        cents: 595 },
  'izar':             { name: 'Baby Izar',               cents: 790 },
  'boys-pants':       { name: 'Boys Pants',              cents: 725 },
};

// The website address allowed to use this checkout.
const ALLOWED_ORIGIN = 'https://abdurryaseen.github.io';

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
    const items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
    if (!items.length) return json({ error: 'Your bag is empty' }, 400);

    const returnUrl = typeof body.origin === 'string' && body.origin.startsWith(ALLOWED_ORIGIN)
      ? body.origin : ALLOWED_ORIGIN + '/islamic-baby-clothes/';

    const form = new URLSearchParams();
    form.append('mode', 'payment');
    form.append('success_url', returnUrl + '?order=success');
    form.append('cancel_url', returnUrl);
    form.append('shipping_address_collection[allowed_countries][0]', 'US');
    form.append('phone_number_collection[enabled]', 'true');

    let n = 0;
    for (const it of items) {
      const p = PRODUCTS[it.id];
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 0), 20);
      if (!p || !qty) continue;
      const size = String(it.size || '').slice(0, 40);
      form.append(`line_items[${n}][quantity]`, String(qty));
      form.append(`line_items[${n}][price_data][currency]`, 'usd');
      form.append(`line_items[${n}][price_data][unit_amount]`, String(p.cents));
      form.append(`line_items[${n}][price_data][product_data][name]`, `${p.name} — Size ${size}`);
      n++;
    }
    if (!n) return json({ error: 'No valid items' }, 400);

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data.error?.message || 'Stripe error' }, 502);
    return json({ url: data.url });
  },
};
