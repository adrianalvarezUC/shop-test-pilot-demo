/**
 * Traffic Simulation Script
 * Paste this in the browser console on sst-sandbox.xyz to fire 100 test transactions.
 *
 * Channel breakdown:
 *   - Google CPC:   30 transactions (google / cpc)
 *   - Paid Social:  30 transactions (facebook, instagram, linkedin / paid_social)
 *   - Organic:      20 transactions (google / organic)
 *   - Referral:     20 transactions (techcrunch.com, reddit.com / referral)
 *
 * NOTE: For channel groupings to appear correctly in GA4 reports, open the site
 * with UTM parameters first (see URLs at the bottom of this file), then paste
 * this script. The UTMs set the session source; events fired afterward inherit it.
 */

(async function simulateTraffic() {

  // ── Products (mirroring src/data/products.ts) ──────────────────────────────
  const products = [
    { item_id: 'e1', item_name: 'Wireless Headphones',  item_category: 'electronics',  item_brand: 'AudioTech',  price: 149.99 },
    { item_id: 'e2', item_name: 'Smart Watch Pro',       item_category: 'electronics',  item_brand: 'WristGear',  price: 299.99 },
    { item_id: 'c1', item_name: 'Classic Denim Jacket',  item_category: 'clothing',     item_brand: 'UrbanWear',  price:  89.99 },
    { item_id: 'c2', item_name: 'Cotton Crew T-Shirt',   item_category: 'clothing',     item_brand: 'BasicCo',    price:  29.99 },
    { item_id: 'a1', item_name: 'Leather Backpack',      item_category: 'accessories',  item_brand: 'CraftBag',   price: 189.99 },
    { item_id: 'h1', item_name: 'Ceramic Table Lamp',    item_category: 'home',         item_brand: 'LumiCraft',  price:  99.99 },
  ];

  // ── Channel distribution ───────────────────────────────────────────────────
  const channels = [
    // Google CPC — 30
    ...Array(30).fill(null).map(() => ({ source: 'google',          medium: 'cpc',         campaign: 'brand_search'  })),
    // Paid Social — 30 (split across platforms)
    ...Array(10).fill(null).map(() => ({ source: 'facebook',        medium: 'paid_social',  campaign: 'prospecting'   })),
    ...Array(10).fill(null).map(() => ({ source: 'instagram',       medium: 'paid_social',  campaign: 'retargeting'   })),
    ...Array(10).fill(null).map(() => ({ source: 'linkedin',        medium: 'paid_social',  campaign: 'awareness'     })),
    // Organic — 20
    ...Array(20).fill(null).map(() => ({ source: 'google',          medium: 'organic',      campaign: ''              })),
    // Referral — 20
    ...Array(10).fill(null).map(() => ({ source: 'techcrunch.com',  medium: 'referral',     campaign: ''              })),
    ...Array(10).fill(null).map(() => ({ source: 'reddit.com',      medium: 'referral',     campaign: ''              })),
  ];

  // Shuffle so channels are interleaved
  channels.sort(() => Math.random() - 0.5);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const delay  = ms  => new Promise(res => setTimeout(res, ms));
  const rand   = arr => arr[Math.floor(Math.random() * arr.length)];
  const randQty = ()  => Math.floor(Math.random() * 3) + 1;

  const userPool = [
    { em: 'alice@example.com',   fn: 'alice',   ln: 'johnson', ph: '16505550001', ge: 'f', db: '19880315', ct: 'losangeles',  st: 'ca', zp: '90001' },
    { em: 'bob@example.com',     fn: 'bob',     ln: 'smith',   ph: '16505550002', ge: 'm', db: '19920722', ct: 'newyork',     st: 'ny', zp: '10001' },
    { em: 'carol@example.com',   fn: 'carol',   ln: 'white',   ph: '16505550003', ge: 'f', db: '19951104', ct: 'chicago',     st: 'il', zp: '60601' },
    { em: 'david@example.com',   fn: 'david',   ln: 'brown',   ph: '16505550004', ge: 'm', db: '19850209', ct: 'houston',     st: 'tx', zp: '77001' },
    { em: 'emma@example.com',    fn: 'emma',    ln: 'jones',   ph: '16505550005', ge: 'f', db: '20000630', ct: 'phoenix',     st: 'az', zp: '85001' },
    { em: 'frank@example.com',   fn: 'frank',   ln: 'davis',   ph: '16505550006', ge: 'm', db: '19780418', ct: 'philadelphia',st: 'pa', zp: '19101' },
    { em: 'grace@example.com',   fn: 'grace',   ln: 'miller',  ph: '16505550007', ge: 'f', db: '19991213', ct: 'sanantonio',  st: 'tx', zp: '78201' },
    { em: 'henry@example.com',   fn: 'henry',   ln: 'wilson',  ph: '16505550008', ge: 'm', db: '19910825', ct: 'sandiego',    st: 'ca', zp: '92101' },
    { em: 'iris@example.com',    fn: 'iris',    ln: 'moore',   ph: '16505550009', ge: 'f', db: '19860511', ct: 'dallas',      st: 'tx', zp: '75201' },
    { em: 'james@example.com',   fn: 'james',   ln: 'taylor',  ph: '16505550010', ge: 'm', db: '19930317', ct: 'sanjose',     st: 'ca', zp: '95101' },
  ];

  // ── Channel label for logging ──────────────────────────────────────────────
  const channelLabel = ch => {
    if (ch.medium === 'cpc')         return '🔵 Google CPC';
    if (ch.medium === 'paid_social') return '🟣 Paid Social';
    if (ch.medium === 'organic')     return '🟢 Organic';
    if (ch.medium === 'referral')    return '🟠 Referral';
    return ch.medium;
  };

  console.log('%c🚀 Starting simulation — 100 transactions', 'font-size:14px;font-weight:bold;color:#4f46e5');
  console.table({ 'Google CPC': 30, 'Paid Social': 30, Organic: 20, Referral: 20 });

  let counts = { cpc: 0, paid_social: 0, organic: 0, referral: 0 };

  for (let i = 0; i < 100; i++) {
    const ch       = channels[i];
    const product  = { ...rand(products) };
    const quantity = randQty();
    const value    = +(product.price * quantity).toFixed(2);
    const tax      = +(value * 0.08).toFixed(2);
    const txId     = `TEST-${ch.source.toUpperCase()}-${Date.now()}-${i}`;
    const user     = { ...rand(userPool), external_id: `user_${i + 1}`, cn: 'us' };

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
      traffic_source:   ch.source,
      traffic_medium:   ch.medium,
      traffic_campaign: ch.campaign,
      user_data: user,
    });

    counts[ch.medium] = (counts[ch.medium] || 0) + 1;
    console.log(
      `${channelLabel(ch)} [${i + 1}/100] ${product.item_name} x${quantity} — $${value} — ${txId}`
    );

    await delay(300); // 300 ms between events to avoid overwhelming the endpoint
  }

  console.log('%c✅ Done! 100 transactions fired.', 'font-size:14px;font-weight:bold;color:#16a34a');
  console.table(counts);

})();

/**
 * ── UTM URLs for proper channel attribution in GA4 ────────────────────────
 * Open one of these URLs before pasting the script above.
 * GA4 will attribute the session to that channel, and all fired events inherit it.
 *
 * Google CPC:
 *   https://sst-sandbox.xyz/?utm_source=google&utm_medium=cpc&utm_campaign=brand_search
 *
 * Paid Social (Facebook):
 *   https://sst-sandbox.xyz/?utm_source=facebook&utm_medium=paid_social&utm_campaign=prospecting
 *
 * Paid Social (Instagram):
 *   https://sst-sandbox.xyz/?utm_source=instagram&utm_medium=paid_social&utm_campaign=retargeting
 *
 * Paid Social (LinkedIn):
 *   https://sst-sandbox.xyz/?utm_source=linkedin&utm_medium=paid_social&utm_campaign=awareness
 *
 * Organic (no UTMs needed — just visit the site directly):
 *   https://sst-sandbox.xyz/
 *
 * Referral:
 *   https://sst-sandbox.xyz/?utm_source=techcrunch.com&utm_medium=referral
 *   https://sst-sandbox.xyz/?utm_source=reddit.com&utm_medium=referral
 */
