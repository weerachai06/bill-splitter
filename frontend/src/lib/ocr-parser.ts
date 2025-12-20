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

// Regular expressions for parsing receipt text (enhanced for Thai)
const PATTERNS = {
  // Enhanced price patterns: $12.34, 12.34, ฿12.34, 12,34, Thai numbers
  price: /[฿$]?\s*[\d๐-๙]+[.,][\d๐-๙]{2}|[\d๐-๙]+[.,][\d๐-๙]{2}\s*[฿$]?/g,
  
  // Thai-aware line item patterns
  lineItem: /^(.+?)\s*[.\s]{2,}\s*([฿$]?\s*[\d๐-๙]+[.,][\d๐-๙]{2}|[\d๐-๙]+[.,][\d๐-๙]{2}\s*[฿$]?)\s*$/gm,
  
  // Alternative line item pattern for Thai receipts
  lineItemAlt: /^(.+?)\s+([฿$]?\s*[\d๐-๙]+[.,][\d๐-๙]{2}|[\d๐-๙]+[.,][\d๐-๙]{2}\s*[฿$]?)\s*$/gm,
  
  // Thai tax patterns (ภาษี, VAT, etc.)
  tax: /(?:tax|hst|gst|sales tax|vat|ภาษี|ภ\.ม\.)\s*:?\s*([฿$]?\s*[\d๐-๙]+[.,][\d๐-๙]{2}|[\d๐-๙]+[.,][\d๐-๙]{2}\s*[฿$]?)/i,
  
  // Thai total patterns (รวม, ยอดรวม, total)
  total: /(?:total|amount due|balance|grand total|รวม|ยอดรวม|ยอดสุทธิ)\s*:?\s*([฿$]?\s*[\d๐-๙]+[.,][\d๐-๙]{2}|[\d๐-๙]+[.,][\d๐-๙]{2}\s*[฿$]?)/i,
  
  // Thai subtotal patterns
  subtotal: /(?:subtotal|sub total|sub-total|รวมย่อย|ยอดย่อย)\s*:?\s*([฿$]?\s*[\d๐-๙]+[.,][\d๐-๙]{2}|[\d๐-๙]+[.,][\d๐-๙]{2}\s*[฿$]?)/i,
  
  // Tip patterns (เบี้ยเพิ่ม, service charge, etc.)
  tip: /(?:tip|gratuity|service charge|เบี้ยเพิ่ม|ค่าบริการ)\s*:?\s*([฿$]?\s*[\d๐-๙]+[.,][\d๐-๙]{2}|[\d๐-๙]+[.,][\d๐-๙]{2}\s*[฿$]?)/i,
  
  // Quantity patterns with Thai numbers
  quantity: /([\d๐-๙]+)\s*[x×]\s*(.+)|(.+)\s*[x×]\s*([\d๐-๙]+)/i,
  
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
    if (subtotalMatch && !subtotal) {
      subtotal = cleanPrice(subtotalMatch[1]);
      console.log('OCR Debug: Found subtotal:', subtotal);
      continue;
    }

    // Extract tax
    const taxMatch = line.match(PATTERNS.tax);
    if (taxMatch && !taxAmount) {
      taxAmount = cleanPrice(taxMatch[1]);
      console.log('OCR Debug: Found tax:', taxAmount);
      continue;
    }

    // Extract tip
    const tipMatch = line.match(PATTERNS.tip);
    if (tipMatch && !tipAmount) {
      tipAmount = cleanPrice(tipMatch[1]);
      console.log('OCR Debug: Found tip:', tipAmount);
      continue;
    }

    // Extract total
    const totalMatch = line.match(PATTERNS.total);
    if (totalMatch && !totalAmount) {
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

  // Try different line item patterns
  let match = line.match(PATTERNS.lineItem);
  if (!match) {
    match = line.match(PATTERNS.lineItemAlt);
  }

  if (match) {
    const name = match[1].trim();
    const priceStr = match[2];

    // Validate the name (should not be too short or contain only numbers)
    if (name.length < 2 || /^\d+$/.test(name)) {
      return null;
    }

    const price = cleanPrice(priceStr);
    if (!price || parseFloat(price) <= 0) {
      return null;
    }

    // Check for quantity in the name
    const { name: cleanName, quantity } = extractQuantity(name);

    return {
      name: cleanName,
      quantity: quantity,
      unitPrice: toDecimalString(parseFloat(price) / quantity),
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
 * Extract quantity from item name if present
 */
function extractQuantity(name: string): { name: string; quantity: number } {
  const quantityMatch = name.match(PATTERNS.quantity);
  
  if (quantityMatch) {
    if (quantityMatch[1] && quantityMatch[2]) {
      // "2x Item" format
      return {
        name: quantityMatch[2].trim(),
        quantity: parseInt(quantityMatch[1])
      };
    } else if (quantityMatch[3] && quantityMatch[4]) {
      // "Item x2" format
      return {
        name: quantityMatch[3].trim(),
        quantity: parseInt(quantityMatch[4])
      };
    }
  }

  return { name, quantity: 1 };
}

/**
 * Aggressive line item parsing for difficult OCR text
 */
function parseLineItemAggressive(line: string): CreateLineItemData | null {
  // Look for any line that contains both text and numbers
  const priceMatches = line.match(PATTERNS.price);
  
  if (!priceMatches || priceMatches.length === 0) {
    return null;
  }
  
  // Take the last price match (usually the item price)
  const priceStr = priceMatches[priceMatches.length - 1];
  const price = cleanPrice(priceStr);
  
  if (!price || parseFloat(price) <= 0) {
    return null;
  }
  
  // Extract name as everything before the price
  const priceIndex = line.lastIndexOf(priceStr);
  let name = line.substring(0, priceIndex).trim();
  
  // Clean up the name
  name = name.replace(/[.\s]+$/, '').trim();
  
  if (name.length < 2) {
    name = `Item (${line.substring(0, 20)}...)`;
  }
  
  const { name: cleanName, quantity } = extractQuantity(name);
  
  return {
    name: cleanName,
    quantity: quantity,
    unitPrice: toDecimalString(parseFloat(price) / quantity),
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
    return null;
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
    return null;
  }
  
  const price = cleanPrice(bestPrice);
  if (!price || parseFloat(price) <= 0) {
    return null;
  }
  
  // Create a generic item name
  let name = line.replace(/[\d๐-๙.,฿$]+/g, '').trim();
  name = name.replace(/\s+/g, ' ');
  
  if (name.length < 2) {
    name = 'Menu Item';
  }
  
  return {
    name: name,
    quantity: 1,
    unitPrice: price,
    totalPrice: price,
    category: null,
    isShared: false,
    extractedText: line,
    manuallyEdited: false
  };
}

/**
 * Clean and normalize price strings
 */
function cleanPrice(priceStr: string): string | null {
  try {
    // Use the enhanced cleaning function
    const cleaned = cleanAndNormalizePrice(priceStr);
    
    const price = parseFloat(cleaned);
    if (isNaN(price) || price < 0) {
      return null;
    }
    return toDecimalString(price);
  } catch {
    return null;
  }
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

  if (parsed.lineItems.length === 0) {
    warnings.push('No line items found - you may need to add them manually');
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