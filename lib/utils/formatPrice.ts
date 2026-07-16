// utils/formatPrice.ts

interface PriceData {
  amount: number | null;
  amount_end: number | null;
  display: string;
  display_end: string;
  currency: string;
  symbol: string;
  is_price_on_request: boolean;
  sale_price: number | null;
  listing_price: number | null;
  rental_price: number | null;
}

export function formatPriceDisplay(price: PriceData | null | undefined): string {
  if (!price) return 'Price on Request';
  
  if (price.is_price_on_request) {
    return 'Price on Request';
  }

  if (price.display && !price.display.includes('null') && !price.display.startsWith('null ')) {
    return price.display;
  }

  const amount = price.amount || price.sale_price;
  if (!amount) return 'Price on Request';

  const currency = price.currency || 'AED';
  const symbol = price.symbol || 'AED';
  const prefix = (symbol && symbol !== 'null') ? symbol : currency;
  const formattedAmount = Number(amount).toLocaleString();
  
  return `${prefix} ${formattedAmount}`;
}

// Fix single property price
export function fixPropertyPrice(property: any): any {
  if (!property) return property;
  if (!property.price) return property;

  const price = property.price;
  
  // Agar display mein "null" hai toh fix karo
  if (price.display && (price.display.includes('null') || price.display.startsWith('null '))) {
    const currency = price.currency || 'AED';
    const symbol = price.symbol || 'AED';
    const amount = price.amount || price.sale_price;
    
    if (amount) {
      const prefix = (symbol && symbol !== 'null') ? symbol : currency;
      price.display = `${prefix} ${Number(amount).toLocaleString()}`;
    } else {
      price.display = 'Price on Request';
    }
  }
  
  // Agar symbol null hai toh fix karo
  if (!price.symbol || price.symbol === 'null') {
    price.symbol = price.currency || 'AED';
  }
  
  // Agar currency null hai toh fix karo
  if (!price.currency || price.currency === 'null') {
    price.currency = 'AED';
  }
  
  return property;
}

// Fix array of properties
export function fixPropertiesPrices(properties: any[]): any[] {
  if (!properties || !Array.isArray(properties)) return properties;
  return properties.map(property => fixPropertyPrice(property));
}