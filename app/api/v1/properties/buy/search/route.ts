// app/api/properties/buy/search/route.ts - COMPLETE FIXED VERSION

import { NextRequest, NextResponse } from 'next/server';
import { db, query } from '@/lib/database';

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const DEFAULT_CURRENCY = 'AED';
const DEFAULT_SYMBOL = 'AED';
const FALLBACK_DISPLAY = 'Price on Request';

// ─── STRONG PRICE FIXER ───────────────────────────────────────────────

function fixPropertyPrice(property: any): any {
  if (!property) return property;

  // If price doesn't exist, create it
  if (!property.price) {
    property.price = {
      amount: null,
      amount_end: null,
      display: FALLBACK_DISPLAY,
      display_end: '',
      currency: DEFAULT_CURRENCY,
      symbol: DEFAULT_SYMBOL,
      is_price_on_request: true,
      sale_price: null,
      listing_price: null,
      rental_price: null,
    };
    return property;
  }

  const price = property.price;

  // ─── TRY TO GET AMOUNT ─────────────────────────────────────────────
  let amount = null;
  
  if (price.amount && price.amount !== 'null' && !isNaN(parseFloat(price.amount))) {
    amount = parseFloat(price.amount);
  } else if (price.sale_price && price.sale_price !== 'null' && !isNaN(parseFloat(price.sale_price))) {
    amount = parseFloat(price.sale_price);
  } else if (price.listing_price && price.listing_price !== 'null' && !isNaN(parseFloat(price.listing_price))) {
    amount = parseFloat(price.listing_price);
  } else if (price.rental_price && price.rental_price !== 'null' && !isNaN(parseFloat(price.rental_price))) {
    amount = parseFloat(price.rental_price);
  }

  price.amount = amount;

  // ─── GET CURRENCY AND SYMBOL ──────────────────────────────────────
  let currency = price.currency || DEFAULT_CURRENCY;
  let symbol = price.symbol || DEFAULT_SYMBOL;

  if (currency === 'null' || !currency) currency = DEFAULT_CURRENCY;
  if (symbol === 'null' || !symbol) symbol = DEFAULT_SYMBOL;

  price.currency = currency;
  price.symbol = symbol;

  // ─── GENERATE DISPLAY ─────────────────────────────────────────────
  if (amount && amount > 0) {
    const formattedAmount = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const prefix = (symbol && symbol !== 'null') ? symbol : currency;
    price.display = `${prefix} ${formattedAmount}`;
    price.is_price_on_request = false;
  } else {
    price.display = FALLBACK_DISPLAY;
    price.is_price_on_request = true;
  }

  if (!price.amount_end || price.amount_end === 'null') {
    price.amount_end = null;
  }

  return property;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    console.log("🔍 Search API called with name:", name);
    
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Name parameter required' },
        { status: 400 }
      );
    }
    
    // Option 1: Using raw query function
    const result = await query<any[]>(
      `SELECT * FROM properties 
       WHERE property_name LIKE ? 
       AND listing_type = 'Off plan'
       AND status = 5
       LIMIT 1`,
      [`%${name}%`]
    );
    
    // Fix price if property found
    let fixedProperty = null;
    if (result && result.length > 0) {
      fixedProperty = fixPropertyPrice(result[0]);
    }
   
    return NextResponse.json({
      success: true,
      data: fixedProperty || null,
      meta: {
        searchTerm: name,
        found: result && result.length > 0,
        price_fixed: true,
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error: any) {
    console.error("❌ Search API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: 'Failed to search property',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';