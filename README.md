# Islamic Baby Clothes — website

Live site: https://abdurryaseen.github.io/islamic-baby-clothes/

## Shopping bag & checkout

Shoppers pick a size, add items to their bag, and check out. The bag is saved in their browser.

**Right now (before Stripe is connected):** "Secure checkout" opens a text message to (313) 455-0054 with the full order filled in, so orders can come in today.

**To turn on card payments with Stripe (about 15 minutes, one time):**

1. **Stripe:** Create or sign in to your account at stripe.com. Go to *Developers → API keys* and copy your **Secret key** (starts with `sk_live_`; use `sk_test_` first to try it out).
2. **Cloudflare (free):** Create an account at cloudflare.com. Go to *Workers & Pages → Create → Create Worker*, name it `ibc-checkout`, and click *Deploy*.
3. Click *Edit code*, delete everything, paste the contents of `worker.js` from this repo, and click *Deploy*.
4. In the Worker, go to *Settings → Variables and Secrets → Add*. Choose type **Secret**, name it `STRIPE_SECRET_KEY`, paste your Stripe secret key, and save.
5. Copy the Worker's address (like `https://ibc-checkout.yourname.workers.dev`).
6. In this repo, edit `index.html`, find `const CHECKOUT_URL='';` and put the address between the quotes. Commit.

That's it — checkout now goes to a secure Stripe payment page, with shipping address and phone collected. Orders and payouts show up in your Stripe dashboard.

**Changing prices:** update the price in both `index.html` (the `products` list) and `worker.js` (the `PRODUCTS` list, in cents), then redeploy the Worker.

**Shipping:** to charge shipping, create a shipping rate in Stripe (*Product catalog → Shipping rates*) and ask for it to be added to `worker.js`.
