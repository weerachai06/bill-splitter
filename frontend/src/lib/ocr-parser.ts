// OCR Text Parser for Receipt Data
// Parses extracted OCR text into structured bill data

import type { LineItem, CreateLineItemData } from '@bill-splitter/shared';
import { toDecimalString } from './calculations';

// Regular expressions for parsing receipt text
const PATTERNS = {
  // Common price patterns: $12.34, 12.34, $12,34
  price: /\$?\d+[.,]\d{2}/g,
  
  // Line item patterns (text followed by price)
  lineItem: /^(.+?)\s*[\s.]{2,}\s*(\$?\d+[.,]\d{2})\s*$/gm,
  
  // Alternative line item pattern (price at end of line)
  lineItemAlt: /^(.+?)\s+(\$?\d+[.,]\d{2})\s*$/gm,
  
  // Tax patterns
  tax: /(?:tax|hst|gst|sales tax|vat)\s*:?\s*(\$?\d+[.,]\d{2})/i,
  
  // Total patterns
  total: /(?:total|amount due|balance|grand total)\s*:?\s*(\$?\d+[.,]\d{2})/i,
  
  // Subtotal patterns
  subtotal: /(?:subtotal|sub total|sub-total)\s*:?\s*(\$?\d+[.,]\d{2})/i,
  
  // Tip patterns
  tip: /(?:tip|gratuity|service charge)\s*:?\s*(\$?\d+[.,]\d{2})/i,
  
  // Quantity patterns: "2x Item" or "Item x2"
  quantity: /(\d+)\s*[x×]\s*(.+)|(.+)\s*[x×]\s*(\d+)/i,
  
  // Date patterns for receipt validation
  date: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,
  
  // Receipt header patterns (store names, addresses)
  header: /^[A-Z\s&'.-]+$/
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

  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
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

  // Second pass: Extract line items
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

    // Try to parse as line item
    const lineItem = parseLineItem(line);
    if (lineItem) {
      lineItems.push(lineItem);
      console.log('OCR Debug: Found line item:', lineItem);
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
 * Clean and normalize price strings
 */
function cleanPrice(priceStr: string): string | null {
  // Remove currency symbols and clean up
  const cleaned = priceStr
    .replace(/[$,]/g, '')
    .replace(/,/g, '.') // Handle European decimal format
    .trim();

  try {
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