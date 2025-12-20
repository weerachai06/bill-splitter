// OCR Text Parser for Receipt Data
// Parses extracted OCR text into structured bill data

import type { LineItem, CreateLineItemData } from '@bill-splitter/shared';
import { toDecimalString } from './calculations';

// Helper function to convert Thai numbers to Arabic numbers
function convertThaiNumbers(text: string): string {
  const thaiToArabic: { [key: string]: string } = {
    '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
    '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
  };
  
  return text.replace(/[๐-๙]/g, (match) => thaiToArabic[match] || match);
}

// Helper function to clean and normalize prices
function cleanAndNormalizePrice(price: string): string {
  let cleaned = price;
  
  // Convert Thai numbers to Arabic
  cleaned = convertThaiNumbers(cleaned);
  
  // Remove currency symbols and extra spaces
  cleaned = cleaned.replace(/[฿$บาท\s]/g, '');
  
  // Normalize decimal separator
  cleaned = cleaned.replace(',', '.');
  
  return cleaned;
}

/**
 * Clean price string and return valid decimal price or null
 */
function cleanPrice(priceStr: string): string | null {
  if (!priceStr) return null;
  
  let cleaned = cleanAndNormalizePrice(priceStr);
  
  // Remove non-numeric characters except decimal point
  cleaned = cleaned.replace(/[^\d.]/g, '');
  
  // Handle multiple decimal points - keep only the last one for price format
  const decimalParts = cleaned.split('.');
  if (decimalParts.length > 2) {
    cleaned = decimalParts.slice(0, -1).join('') + '.' + decimalParts[decimalParts.length - 1];
  }
  
  // Try to parse as number
  let num = parseFloat(cleaned);
  
  // If parsing failed or no decimal, try different strategies
  if (isNaN(num) || !cleaned.includes('.')) {
    // Extract all digits and try to format as price
    const digits = priceStr.replace(/[^\d]/g, '');
    if (digits.length === 0) return null;
    
    if (digits.length <= 2) {
      // Small number, treat as cents
      num = parseInt(digits) / 100;
    } else if (digits.length === 3) {
      // Could be x.xx format
      num = parseInt(digits.substring(0, 1)) + parseInt(digits.substring(1)) / 100;
    } else {
      // Assume last two digits are cents
      const cents = digits.substring(digits.length - 2);
      const dollars = digits.substring(0, digits.length - 2);
      num = parseInt(dollars) + parseInt(cents) / 100;
    }
  }
  
  // Final validation
  if (isNaN(num) || num < 0) return null;
  
  // Format to 2 decimal places
  return num.toFixed(2);
}

// Regular expressions for parsing receipt text (enhanced for Thai and flexibility)
const PATTERNS = {
// Enhanced price patterns: more flexible for various receipt formats
  price: /[฿$]?\s*[\d๐-๙]+[.,]?[\d๐-๙]*\s*[฿$]?|[\d๐-๙]+[.,][\d๐-๙]{2}/g,
  
  // More flexible line item patterns - capture item name and any price-like number
  lineItem: /^(.+?)\s*[.\s]{2,}\s*([฿$]?\s*[\d๐-๙]+[.,]?[\d๐-๙]*\s*[฿$]?)\s*$/gm,
  
  // Alternative: item followed by price at end of line
  lineItemAlt: /^(.+?)\s+([฿$]?\s*[\d๐-๙]+[.,]?[\d๐-๙]*\s*[฿$]?)\s*$/gm,
  
  // Simple pattern: any text followed by numbers (relaxed)
  lineItemSimple: /^([a-zA-Zก-๙\s\-.&'()]+)\s+([\d๐-๙]+[.,]?[\d๐-๙]*)\s*$/gm,
  
  // Thai tax patterns (ภาษี, VAT, etc.)
  tax: /(?:tax|hst|gst|sales tax|vat|ภาษี|ภ\.ม\.)\s*:?\s*([฿$]?\s*[\d๐-๙]+[.,]?[\d๐-๙]*\s*[฿$]?)/i,
  
  // Thai total patterns (รวม, ยอดรวม, total)
  total: /(?:total|amount due|balance|grand total|รวม|ยอดรวม|ยอดสุทธิ|ทั้งหมด)\s*:?\s*([฿$]?\s*[\d๐-๙]+[.,]?[\d๐-๙]*\s*[฿$]?)/i,
  
  // Thai subtotal patterns
  subtotal: /(?:subtotal|sub total|sub-total|รวมย่อย|ยอดย่อย)\s*:?\s*([฿$]?\s*[\d๐-๙]+[.,]?[\d๐-๙]*\s*[฿$]?)/i,
  
  // Tip patterns (เบี้ยเพิ่ม, service charge, etc.)
  tip: /(?:tip|gratuity|service charge|เบี้ยเพิ่ม|ค่าบริการ)\s*:?\s*([฿$]?\s*[\d๐-๙]+[.,][\d๐-๙]{2}|[\d๐-๙]+[.,][\d๐-๙]{2}\s*[฿$]?)/i,
  
  // Enhanced quantity patterns with Thai numbers - supports {qty}x{price}, {qty}x formats
  quantityPrice: /([\d๐-๙]+)\s*[x×]\s*([฿$]?\s*[\d๐-๙]+[.,]?[\d๐-๙]*\s*[฿$]?)/i,
  quantityOnly: /([\d๐-๙]+)\s*[x×]\s*(.+)|(.+)\s*[x×]\s*([\d๐-๙]+)/i,
  
  // Date patterns (including Thai date format)
  date: /[\d๐-๙]{1,2}[\/\-][\d๐-๙]{1,2}[\/\-][\d๐-๙]{2,4}/,
  
  // Enhanced header patterns for Thai text
  header: /^[A-Zก-๙\s&'.-]+$/,
  
  // Pattern to identify potential menu items (letters + numbers/prices)
  menuItem: /^[ก-๙A-Za-z\s\-'&()]+.*[\d๐-๙]/,
  
  // Pattern for Thai baht symbol variations  
  baht: /[฿บาท]/,
};

interface ParsedReceipt {
  lineItems: CreateLineItemData[];
  subtotal: string | null;
  taxAmount: string | null;
  tipAmount: string | null;
  totalAmount: string | null;
  confidence: number;
  rawText: string;
}

/**
 * Parse OCR text into structured receipt data
 */
export function parseReceiptText(ocrText: string): ParsedReceipt {
  console.log('OCR Debug: Starting text parsing for:', ocrText);

  // Handle very short or empty text
  if (!ocrText || ocrText.trim().length === 0) {
    console.log('OCR Debug: No text provided for parsing');
    return {
      lineItems: [],
      subtotal: null,
      taxAmount: null,
      tipAmount: null,
      totalAmount: null,
      confidence: 0,
      rawText: ocrText
    };
  }

  console.log({ocrText})

  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // If we have very little text, try to create at least one item
  if (lines.length === 0 || ocrText.trim().length < 5) {
    console.log('OCR Debug: Very short text, creating basic item');
    
    // Try to find any numbers that could be prices
    const numbers = ocrText.match(/[\d๐-๙]+[.,]?[\d๐-๙]*/g);
    let basicItem: CreateLineItemData | null = null;
    
    if (numbers && numbers.length > 0) {
      const potentialPrice = numbers[numbers.length - 1]; // Take last number as price
      const cleanedPrice = cleanPrice(potentialPrice + (potentialPrice.includes('.') ? '' : '.00'));
      
      if (cleanedPrice) {
        basicItem = {
          name: 'Receipt Item',
          quantity: 1,
          unitPrice: cleanedPrice,
          totalPrice: cleanedPrice,
          category: null,
          isShared: false,
          extractedText: ocrText.trim(),
          manuallyEdited: false
        };
      }
    }
    
    return {
      lineItems: basicItem ? [basicItem] : [],
      subtotal: null,
      taxAmount: null,
      tipAmount: null,
      totalAmount: basicItem ? basicItem.totalPrice : null,
      confidence: 10, // Low confidence for minimal parsing
      rawText: ocrText
    };
  }

  const lineItems: CreateLineItemData[] = [];
  let subtotal: string | null = null;
  let taxAmount: string | null = null;
  let tipAmount: string | null = null;
  let totalAmount: string | null = null;

  // First pass: Extract totals and summary amounts
  for (const line of lines) {
    // Extract subtotal
    const subtotalMatch = line.match(PATTERNS.subtotal);
    if (subtotalMatch && subtotalMatch[1] && !subtotal) {
      subtotal = cleanPrice(subtotalMatch[1]);
      console.log('OCR Debug: Found subtotal:', subtotal);
      continue;
    }

    // Extract tax
    const taxMatch = line.match(PATTERNS.tax);
    if (taxMatch && taxMatch[1] && !taxAmount) {
      taxAmount = cleanPrice(taxMatch[1]);
      console.log('OCR Debug: Found tax:', taxAmount);
      continue;
    }

    // Extract tip
    const tipMatch = line.match(PATTERNS.tip);
    if (tipMatch && tipMatch[1] && !tipAmount) {
      tipAmount = cleanPrice(tipMatch[1]);
      console.log('OCR Debug: Found tip:', tipAmount);
      continue;
    }

    // Extract total
    const totalMatch = line.match(PATTERNS.total);
    if (totalMatch && totalMatch[1] && !totalAmount) {
      totalAmount = cleanPrice(totalMatch[1]);
      console.log('OCR Debug: Found total:', totalAmount);
      continue;
    }
  }

  // Second pass: Extract line items with enhanced detection
  for (const line of lines) {
    // Skip if this line contains summary amounts
    if (
      line.match(PATTERNS.subtotal) ||
      line.match(PATTERNS.tax) ||
      line.match(PATTERNS.tip) ||
      line.match(PATTERNS.total)
    ) {
      continue;
    }
    
    // Skip very short lines (likely not items)
    if (line.length < 3) {
      continue;
    }

    // Try to parse as line item using multiple strategies
    let lineItem = parseLineItem(line);
    
    // If standard parsing failed, try aggressive parsing
    if (!lineItem) {
      lineItem = parseLineItemAggressive(line);
    }
    
    if (lineItem) {
      lineItems.push(lineItem);
      console.log('OCR Debug: Found line item:', lineItem);
    }
  }
  
  // If still no items found, try to extract from any line with numbers
  if (lineItems.length === 0) {
    console.log('OCR Debug: No items found, trying fallback parsing...');
    for (const line of lines) {
      const fallbackItem = parseLineItemFallback(line);
      if (fallbackItem) {
        lineItems.push(fallbackItem);
        console.log('OCR Debug: Fallback found item:', fallbackItem);
      }
    }
  }

  // Calculate confidence based on successful parsing
  const confidence = calculateParsingConfidence(lineItems, subtotal, taxAmount, totalAmount);

  const result: ParsedReceipt = {
    lineItems,
    subtotal,
    taxAmount,
    tipAmount,
    totalAmount,
    confidence,
    rawText: ocrText
  };

  console.log('OCR Debug: Parsing complete:', result);
  return result;
}

/**
 * Parse a single line as a potential line item
 */
function parseLineItem(line: string): CreateLineItemData | null {
  // Skip obviously non-item lines
  if (isHeaderLine(line) || isFooterLine(line)) {
    return null;
  }

  // First, try to extract quantity and price patterns
  const qtyPriceResult = extractQuantityAndPrice(line);
  
  // If we found a unit price from quantity pattern, use it
  if (qtyPriceResult.unitPrice && qtyPriceResult.totalPrice) {
    return {
      name: qtyPriceResult.name,
      quantity: qtyPriceResult.quantity,
      unitPrice: qtyPriceResult.unitPrice,
      totalPrice: qtyPriceResult.totalPrice,
      category: null,
      isShared: false,
      extractedText: line,
      manuallyEdited: false
    };
  }

  // Try different line item patterns
  let match = line.match(PATTERNS.lineItem);
  if (!match) {
    match = line.match(PATTERNS.lineItemAlt);
  }

  if (match && match[1] && match[2]) {
    const nameText = match[1].trim();
    const priceStr = match[2].trim();

    // Extract quantity and name
    const qtyResult = extractQuantityAndPrice(nameText);

    const price = cleanPrice(priceStr);
    if (!price || parseFloat(price) <= 0) {
      console.log('OCR Debug: Item rejected - no valid price:', line);
      return null; // Remove items without valid prices
    }

    // Validate the name (should not be too short or contain only numbers)
    if (qtyResult.name.length < 2 || /^\d+$/.test(qtyResult.name)) {
      console.log('OCR Debug: Item rejected - invalid name:', line);
      return null;
    }

    return {
      name: qtyResult.name,
      quantity: qtyResult.quantity,
      unitPrice: toDecimalString(parseFloat(price) / qtyResult.quantity),
      totalPrice: price,
      category: null,
      isShared: false,
      extractedText: line,
      manuallyEdited: false
    };
  }

  return null;
}

/**
 * Extract quantity and price from item text if present
 * Handles patterns like "2x$10.50", "3x Burger", etc.
 */
function extractQuantityAndPrice(text: string): { 
  name: string; 
  quantity: number; 
  unitPrice?: string;
  totalPrice?: string;
} {
  // First try to match quantity with price pattern: "2x$10.50"
  const qtyPriceMatch = text.match(PATTERNS.quantityPrice);
  if (qtyPriceMatch && qtyPriceMatch[1] && qtyPriceMatch[2]) {
    const quantity = parseInt(convertThaiNumbers(qtyPriceMatch[1]));
    const price = cleanPrice(qtyPriceMatch[2]);
    
    if (quantity > 0 && price && parseFloat(price) > 0) {
      // Extract item name from remaining text
      let name = text.replace(qtyPriceMatch[0], '').trim();
      if (!name) name = 'Item';
      
      return {
        name: name,
        quantity: quantity,
        unitPrice: price,
        totalPrice: toDecimalString(parseFloat(price) * quantity)
      };
    }
  }
  
  // Then try quantity only patterns: "2x Item" or "Item x2"
  const qtyOnlyMatch = text.match(PATTERNS.quantityOnly);
  if (qtyOnlyMatch) {
    if (qtyOnlyMatch[1] && qtyOnlyMatch[2]) {
      // "2x Item" format
      const quantity = parseInt(convertThaiNumbers(qtyOnlyMatch[1]));
      const name = qtyOnlyMatch[2].trim();
      
      if (quantity > 0 && name) {
        return { name, quantity };
      }
    } else if (qtyOnlyMatch[3] && qtyOnlyMatch[4]) {
      // "Item x2" format
      const name = qtyOnlyMatch[3].trim();
      const quantity = parseInt(convertThaiNumbers(qtyOnlyMatch[4]));
      
      if (quantity > 0 && name) {
        return { name, quantity };
      }
    }
  }

  return { name: text, quantity: 1 };
}

/**
 * Aggressive line item parsing for difficult OCR text
 */
function parseLineItemAggressive(line: string): CreateLineItemData | null {
  // Look for any line that contains both text and numbers
  const priceMatches = line.match(PATTERNS.price);
  
  if (!priceMatches || priceMatches.length === 0) {
    console.log('OCR Debug: Aggressive parsing - no prices found:', line);
    return null; // Must have a price
  }
  
  // Take the last price match (usually the item price)
  const priceStr = priceMatches[priceMatches.length - 1];
  const price = cleanPrice(priceStr);
  
  if (!price || parseFloat(price) <= 0) {
    console.log('OCR Debug: Aggressive parsing - invalid price:', line, price);
    return null; // Remove items without valid prices
  }
  
  // Extract name as everything before the price
  const priceIndex = line.lastIndexOf(priceStr);
  let nameText = line.substring(0, priceIndex).trim();
  
  // Clean up the name
  nameText = nameText.replace(/[.\s]+$/, '').trim();
  
  if (nameText.length < 2) {
    nameText = `Item (${line.substring(0, 20)}...)`;
  }
  
  // Extract quantity and clean name
  const qtyResult = extractQuantityAndPrice(nameText);
  
  return {
    name: qtyResult.name,
    quantity: qtyResult.quantity,
    unitPrice: toDecimalString(parseFloat(price) / qtyResult.quantity),
    totalPrice: price,
    category: null,
    isShared: false,
    extractedText: line,
    manuallyEdited: false
  };
}

/**
 * Fallback parsing for any line with recognizable patterns
 */
function parseLineItemFallback(line: string): CreateLineItemData | null {
  // Skip lines that are clearly not items
  if (line.length < 4 || 
      line.match(/^[\d\s.,-]+$/) || // Only numbers and punctuation
      line.match(/^[.\s-]+$/) ||    // Only dots and spaces
      line.match(PATTERNS.date) ||  // Dates
      line.toLowerCase().includes('receipt') ||
      line.toLowerCase().includes('thank') ||
      line.toLowerCase().includes('welcome')) {
    return null;
  }
  
  // Look for any numbers that might be prices
  const numbers = line.match(/[\d๐-๙]+[.,][\d๐-๙]{2}|[\d๐-๙]+/g);
  
  if (!numbers) {
    console.log('OCR Debug: Fallback parsing - no numbers found:', line);
    return null; // Must have numbers that could be prices
  }
  
  // Try to find the most price-like number
  let bestPrice: string | null = null;
  
  for (const num of numbers) {
    const normalized = convertThaiNumbers(num);
    if (normalized.includes('.') || normalized.includes(',')) {
      // Decimal number - likely a price
      bestPrice = num;
      break;
    } else if (parseFloat(normalized) > 5) {
      // Whole number > 5 - could be a price in baht
      bestPrice = num + '.00';
    }
  }
  
  if (!bestPrice) {
    console.log('OCR Debug: Fallback parsing - no valid price found:', line);
    return null; // Remove items without valid prices
  }
  
  const price = cleanPrice(bestPrice);
  if (!price || parseFloat(price) <= 0) {
    console.log('OCR Debug: Fallback parsing - price validation failed:', line, price);
    return null; // Remove items without valid prices
  }
  
  // Create a item name from remaining text
  let nameText = line.replace(/[\d๐-๙.,฿$]+/g, '').trim();
  nameText = nameText.replace(/\s+/g, ' ');
  
  if (nameText.length < 2) {
    nameText = 'Menu Item';
  }
  
  // Extract quantity if present
  const qtyResult = extractQuantityAndPrice(nameText);
  
  return {
    name: qtyResult.name,
    quantity: qtyResult.quantity,
    unitPrice: toDecimalString(parseFloat(price) / qtyResult.quantity),
    totalPrice: price,
    category: null,
    isShared: false,
    extractedText: line,
    manuallyEdited: false
  };
}

/**
 * Check if a line looks like a header (store name, address, etc.)
 */
function isHeaderLine(line: string): boolean {
  // All caps lines are often headers
  if (line === line.toUpperCase() && line.length > 5) {
    return true;
  }

  // Lines with addresses
  if (line.match(/\d+\s+[A-Za-z\s]+(?:st|ave|rd|blvd|drive|street)/i)) {
    return true;
  }

  // Phone numbers
  if (line.match(/\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/)) {
    return true;
  }

  return false;
}

/**
 * Check if a line looks like footer content
 */
function isFooterLine(line: string): boolean {
  // Thank you messages
  if (line.match(/thank you|thanks|visit|welcome|receipt/i)) {
    return true;
  }

  // Website/email patterns
  if (line.match(/www\.|\.com|@/)) {
    return true;
  }

  return false;
}

/**
 * Calculate confidence score based on parsing success
 */
function calculateParsingConfidence(
  lineItems: CreateLineItemData[],
  subtotal: string | null,
  taxAmount: string | null,
  totalAmount: string | null
): number {
  let score = 0;

  // Line items found
  if (lineItems.length > 0) {
    score += Math.min(lineItems.length * 20, 60); // Up to 60 points for items
  }

  // Subtotal found
  if (subtotal) score += 15;

  // Tax found
  if (taxAmount) score += 10;

  // Total found
  if (totalAmount) score += 15;

  // Bonus for mathematical consistency
  if (subtotal && totalAmount) {
    const calculatedTotal = parseFloat(subtotal) + (taxAmount ? parseFloat(taxAmount) : 0);
    const actualTotal = parseFloat(totalAmount);
    if (Math.abs(calculatedTotal - actualTotal) < 0.01) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

/**
 * Generate a unique ID for line items
 */
export function generateLineItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create line items with proper IDs from parsed data
 */
export function createLineItemsFromParsed(
  parsedData: ParsedReceipt,
  receiptId: string
): LineItem[] {
  return parsedData.lineItems.map((item, index) => ({
    id: `${receiptId}-item-${index + 1}`,
    receiptId,
    ...item
  }));
}

/**
 * Validate parsed receipt data for completeness
 */
export function validateParsedReceipt(parsed: ParsedReceipt): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Filter out items without valid prices (additional safety check)
  const validItems = parsed.lineItems.filter(item => {
    const hasValidPrice = item.unitPrice && parseFloat(item.unitPrice) > 0;
    if (!hasValidPrice) {
      console.log('OCR Debug: Filtering out item without valid price:', item);
    }
    return hasValidPrice;
  });

  if (validItems.length === 0) {
    warnings.push('No valid priced items found - you may need to add them manually');
  } else if (validItems.length < parsed.lineItems.length) {
    warnings.push(`${parsed.lineItems.length - validItems.length} items without prices were removed`);
    // Update the parsed data to remove invalid items
    parsed.lineItems = validItems;
  }

  if (!parsed.subtotal && !parsed.totalAmount) {
    warnings.push('No total amounts found - please verify the extracted data');
  }

  if (parsed.confidence < 50) {
    warnings.push('Low confidence in OCR results - please review all extracted data carefully');
  }

  return {
    isValid: parsed.lineItems.length > 0 || parsed.totalAmount !== null,
    warnings
  };
}