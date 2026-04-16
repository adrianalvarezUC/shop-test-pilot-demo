/**
 * Playwright Traffic Simulation Script
 * Simulates 100 transactions from 7 separate browser sessions (one per channel/source).
 * Each session loads sst-sandbox.xyz with the correct UTM parameters, accepts consent,
 * then fires its share of purchase events.
 *
 * Run with:
 *   node scripts/simulateTraffic.mjs
 */

import { chromium } from 'playwright';

// ── Config ─────────────────────────────────────────────────────────────────
const BASE_URL = 'https://sst-sandbox.xyz';

const products = [
  { item_id: 'e1', item_name: 'Wireless Headphones',  item_category: 'electronics',  item_brand: 'AudioTech',  price: 149.99 },
  { item_id: 'e2', item_name: 'Smart Watch Pro',       item_category: 'electronics',  item_brand: 'WristGear',  price: 299.99 },
  { item_id: 'c1', item_name: 'Classic Denim Jacket',  item_category: 'clothing',     item_brand: 'UrbanWear',  price:  89.99 },
  { item_id: 'c2', item_name: 'Cotton Crew T-Shirt',   item_category: 'clothing',     item_brand: 'BasicCo',    price:  29.99 },
  { item_id: 'a1', item_name: 'Leather Backpack',      item_category: 'accessories',  item_brand: 'CraftBag',   price: 189.99 },
  { item_id: 'h1', item_name: 'Ceramic Table Lamp',    item_category: 'home',         item_brand: 'LumiCraft',  price:  99.99 },
];

const userPool = [
  { em: 'alice@example.com',  fn: 'alice',  ln: 'johnson', ph: '16505550001', ge: 'f', db: '19880315', ct: 'losangeles',   st: 'ca', zp: '90001', cn: 'us' },
  { em: 'bob@example.com',    fn: 'bob',    ln: 'smith',   ph: '16505550002', ge: 'm', db: '19920722', ct: 'newyork',      st: 'ny', zp: '10001', cn: 'us' },
  { em: 'carol@example.com',  fn: 'carol',  ln: 'white',   ph: '16505550003', ge: 'f', db: '19951104', ct: 'chicago',      st: 'il', zp: '60601', cn: 'us' },
  { em: 'david@example.com',  fn: 'david',  ln: 'brown',   ph: '16505550004', ge: 'm', db: '19850209', ct: 'houston',      st: 'tx', zp: '77001', cn: 'us' },
  { em: 'emma@example.com',   fn: 'emma',   ln: 'jones',   ph: '16505550005', ge: 'f', db: '20000630', ct: 'phoenix',      st: 'az', zp: '85001', cn: 'us' },
  { em: 'frank@example.com',  fn: 'frank',  ln: 'davis',   ph: '16505550006', ge: 'm', db: '19780418', ct: 'philadelphia', st: 'pa', zp: '19101', cn: 'us' },
  { em: 'grace@example.com',  fn: 'grace',  ln: 'miller',  ph: '16505550007', ge: 'f', db: '19991213', ct: 'sanantonio',   st: 'tx', zp: '78201', cn: 'us' },
  { em: 'henry@example.com',  fn: 'henry',  ln: 'wilson',  ph: '16505550008', ge: 'm', db: '19910825', ct: 'sandiego',     st: 'ca', zp: '92101', cn: 'us' },
  { em: 'iris@example.com',   fn: 'iris',   ln: 'moore',   ph: '16505550009', ge: 'f', db: '19860511', ct: 'dallas',       st: 'tx', zp: '75201', cn: 'us' },
  { em: 'james@example.com',  fn: 'james',  ln: 'taylor',  ph: '16505550010', ge: 'm', db: '19930317', ct: 'sanjose',      st: 'ca', zp: '95101', cn: 'us' },
];

// Sessions: each gets its own isolated browser context
const sessions = [
  { label: '🔵 Google CPC',          source: 'google',         medium: 'cpc',         campaign: 'brand_search',  count: 30 },
  { label: '🟣 Facebook Paid Social', source: 'facebook',       medium: 'paid_social',  campaign: 'prospecting',   count: 10 },
  { label: '🟣 Instagram Paid Social',source: 'instagram',      medium: 'paid_social',  campaign: 'retargeting',   count: 10 },
  { label: '🟣 LinkedIn Paid Social', source: 'linkedin',       medium: 'paid_social',  campaign: 'awareness',     count: 10 },
  { label: '🟢 Google Organic',       source: 'google',         medium: 'organic',      campaign: '',              count: 20 },
  { label: '🟠 TechCrunch Referral',  source: 'techcrunch.com', medium: 'referral',     campaign: '',              count: 10 },
  { label: '🟠 Reddit Referral',      source: 'reddit.com',     medium: 'referral',     campaign: '',              count: 10 },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
const rand     = arr => arr[Math.floor(Math.random() * arr.length)];
const randQty  = ()  => Math.floor(Math.random() * 3) + 1;
const delay    = ms  => new Promise(res => setTimeout(res, ms));

function buildUrl(session) {
  if (session.medium === 'organic') return BASE_URL;
  const params = new URLSearchParams({
    utm_source:   session.source,
    utm_medium:   session.medium,
    ...(session.campaign && { utm_campaign: session.campaign }),
  });
  return `${BASE_URL}/?${params.toString()}`;
}

async function preGrantConsent(context) {
  // Block Usercentrics from loading so it cannot override our consent grants.
  await context.route('**usercentrics**', route => route.abort());

  // Pre-grant all consent before any page script runs.
  await context.addInitScript(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('consent', 'default', {
      analytics_storage:  'granted',
      ad_storage:         'granted',
      ad_user_data:       'granted',
      ad_personalization: 'granted',
    });
    // Also update in case GTM fires consent update after load
    gtag('consent', 'update', {
      analytics_storage:  'granted',
      ad_storage:         'granted',
      ad_user_data:       'granted',
      ad_personalization: 'granted',
    });
  });
}

async function firePurchase(page, index, sessionLabel) {
  const product  = { ...rand(products) };
  const quantity = randQty();
  const value    = +(product.price * quantity).toFixed(2);
  const tax      = +(value * 0.08).toFixed(2);
  const txId     = `TEST-${Date.now()}-${index}`;
  const user     = { ...rand(userPool), external_id: `user_${index}` };

  await page.evaluate(({ product, quantity, value, tax, txId, user }) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: txId,
        currency: 'USD',
        value,
        tax,
        shipping: 9.99,
        items: [{
          item_id:       product.item_id,
          item_name:     product.item_name,
          item_category: product.item_category,
          item_brand:    product.item_brand,
          price:         product.price,
          quantity,
          index:         0,
        }],
      },
      user_data: user,
    });
  }, { product, quantity, value, tax, txId, user });

  console.log(`  ${sessionLabel} [${index}] ${product.item_name} x${quantity} — $${value} — ${txId}`);
  return value;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function runSession(browser, session, startIndex) {
  const context = await browser.newContext();
  await preGrantConsent(context);
  const page    = await context.newPage();
  const url     = buildUrl(session);

  console.log(`\n${session.label} — Opening: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await delay(1500); // let GTM/GA4 fully initialize with granted consent

  let total = 0;
  for (let i = 0; i < session.count; i++) {
    const value = await firePurchase(page, startIndex + i, session.label);
    total += value;
    await delay(400);
  }

  await context.close();
  console.log(`${session.label} — Done. ${session.count} transactions, $${total.toFixed(2)} revenue`);
  return { label: session.label, count: session.count, revenue: total };
}

async function main() {
  console.log('🚀 Starting Playwright traffic simulation');
  console.log('   100 transactions across 7 sessions\n');

  const browser = await chromium.launch({ headless: true });

  // Run all sessions in parallel
  let index = 1;
  const promises = sessions.map(session => {
    const startIndex = index;
    index += session.count;
    return runSession(browser, session, startIndex);
  });

  const results = await Promise.all(promises);

  await browser.close();

  console.log('\n🎉 All done!\n');
  console.table(results.map(r => ({
    Channel:      r.label,
    Transactions: r.count,
    Revenue:      `$${r.revenue.toFixed(2)}`,
  })));
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
