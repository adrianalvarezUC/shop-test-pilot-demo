import { Product } from "@/data/products";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function push(event: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  // Clear previous ecommerce object
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(event);
}

export function pushPageView(url: string, title: string) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "page_view",
    page_location: url,
    page_title: title,
  });
}

function mapItems(items: { product: Product; quantity: number }[]) {
  return items.map((item, index) => ({
    item_id: item.product.id,
    item_name: item.product.name,
    item_category: item.product.category,
    item_brand: item.product.brand,
    price: item.product.price,
    quantity: item.quantity,
    index,
  }));
}

export function pushViewItemList(listName: string, products: Product[]) {
  push({
    event: "view_item_list",
    ecommerce: {
      item_list_name: listName,
      currency: "USD",
      items: products.map((p, index) => ({
        item_id: p.id,
        item_name: p.name,
        item_category: p.category,
        item_brand: p.brand,
        price: p.price,
        quantity: 1,
        index,
      })),
    },
  });
}

export function pushViewItem(product: Product) {
  push({
    event: "view_item",
    ecommerce: {
      currency: "USD",
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand,
          price: product.price,
          quantity: 1,
        },
      ],
    },
  });
}

export function pushAddToCart(product: Product, quantity: number) {
  push({
    event: "add_to_cart",
    ecommerce: {
      currency: "USD",
      value: product.price * quantity,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand,
          price: product.price,
          quantity,
        },
      ],
    },
  });
}

export function pushViewCart(items: { product: Product; quantity: number }[]) {
  const value = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  push({
    event: "view_cart",
    ecommerce: {
      currency: "USD",
      value,
      items: mapItems(items),
    },
  });
}

export function pushBeginCheckout(items: { product: Product; quantity: number }[]) {
  const value = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  push({
    event: "begin_checkout",
    ecommerce: {
      currency: "USD",
      value,
      items: mapItems(items),
    },
  });
}

export function pushPurchase(
  transactionId: string,
  items: { product: Product; quantity: number }[]
) {
  const value = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  push({
    event: "purchase",
    ecommerce: {
      transaction_id: transactionId,
      currency: "USD",
      value,
      tax: +(value * 0.08).toFixed(2),
      shipping: 9.99,
      items: mapItems(items),
    },
    user_data: {
      em: "jsmith@example.com",
      fn: "john",
      ln: "smith",
      ph: "+16505554444",
      external_id: "user_abc123",
      ge: "m",
      db: "19910526",
      ct: "newyork",
      st: "ny",
      zp: "10001",
      cn: "us",
    },
  });
}
