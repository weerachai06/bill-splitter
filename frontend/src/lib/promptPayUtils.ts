/**
 * PromptPay QR Code Generator
 * 
 * Implementationจากการแกะจาก promptpay-qr library
 * Based on EMV QRCPS Merchant Presented Mode specification
 * 
 * References:
 * - https://github.com/dtinth/promptpay-qr
 * - https://www.emvco.com/emv-technologies/qrcodes/
 * - https://www.blognone.com/node/95133
 */

import * as CRC from 'crc';

// EMV QR Code specification constants
const ID_PAYLOAD_FORMAT = '00';
const ID_POI_METHOD = '01';
const ID_MERCHANT_INFORMATION_BOT = '29';
const ID_TRANSACTION_CURRENCY = '53';
const ID_TRANSACTION_AMOUNT = '54';
const ID_COUNTRY_CODE = '58';
const ID_CRC = '63';

// Values for EMV fields
const PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE = '01';
const POI_METHOD_STATIC = '11';
const POI_METHOD_DYNAMIC = '12';
const MERCHANT_INFORMATION_TEMPLATE_ID_GUID = '00';
const BOT_ID_MERCHANT_PHONE_NUMBER = '01';
const BOT_ID_MERCHANT_TAX_ID = '02';
const BOT_ID_MERCHANT_EWALLET_ID = '03';

// PromptPay constants
const GUID_PROMPTPAY = 'A000000677010111';
const TRANSACTION_CURRENCY_THB = '764';
const COUNTRY_CODE_TH = 'TH';

export interface PromptPayOptions {
  amount?: number;
}

/**
 * Helper function to format field with length prefix
 * @param id Field ID
 * @param value Field value
 * @returns Formatted field string
 */
function formatField(id: string, value: string): string {
  return [id, ('00' + value.length).slice(-2), value].join('');
}

/**
 * Serialize array of fields, filtering out falsy values
 * @param fields Array of field strings
 * @returns Serialized string
 */
function serialize(fields: (string | null | undefined)[]): string {
  return fields.filter(Boolean).join('');
}

/**
 * Remove all non-digits from target string
 * @param target Input string
 * @returns Sanitized string with only digits
 */
function sanitizeTarget(target: string): string {
  return target.replace(/[^0-9]/g, '');
}

/**
 * Format target for PromptPay QR code
 * @param target Phone number, tax ID, or e-wallet ID
 * @returns Formatted target string
 */
function formatTarget(target: string): string {
  const numbers = sanitizeTarget(target);
  
  // If already 13 or more digits, use as-is
  if (numbers.length >= 13) return numbers;
  
  // For phone numbers, convert from 0xxxxxxxxx to 66xxxxxxxxx format
  // Then pad to 13 digits
  const formatted = numbers.replace(/^0/, '66');
  return ('0000000000000' + formatted).slice(-13);
}

/**
 * Format amount to 2 decimal places
 * @param amount Amount in baht
 * @returns Formatted amount string
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format CRC value to 4-character uppercase hex
 * @param crcValue CRC value as number
 * @returns Formatted CRC string
 */
function formatCrc(crcValue: number): string {
  return ('0000' + crcValue.toString(16).toUpperCase()).slice(-4);
}

/**
 * Generate PromptPay QR payload string
 * @param target Phone number (10 digits), Tax ID (13 digits), or e-Wallet ID (15 digits)
 * @param options Optional parameters including amount
 * @returns QR code payload string
 * @throws Error if target format is invalid
 */
export function generatePromptPayPayload(target: string, options: PromptPayOptions = {}): string {
  if (!target) {
    throw new Error('Target is required');
  }

  const sanitizedTarget = sanitizeTarget(target);
  const { amount } = options;

  // Validate target length
  if (sanitizedTarget.length < 10) {
    throw new Error('Target must be at least 10 digits (phone number)');
  }

  if (sanitizedTarget.length === 10 && !validateThaiPhoneNumber(target)) {
    throw new Error('Invalid Thai phone number format');
  }

  if (sanitizedTarget.length === 13 && !validateThaiCitizenId(target)) {
    throw new Error('Invalid Thai citizen ID');
  }

  // Validate amount
  if (amount !== undefined && amount < 0) {
    throw new Error('Amount must be non-negative');
  }

  // Determine target type based on length
  const targetType = 
    sanitizedTarget.length >= 15 ? BOT_ID_MERCHANT_EWALLET_ID :
    sanitizedTarget.length >= 13 ? BOT_ID_MERCHANT_TAX_ID :
    BOT_ID_MERCHANT_PHONE_NUMBER;

  try {
    // Build QR code data fields
    const data = [
      formatField(ID_PAYLOAD_FORMAT, PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE),
      formatField(ID_POI_METHOD, amount ? POI_METHOD_DYNAMIC : POI_METHOD_STATIC),
      formatField(ID_MERCHANT_INFORMATION_BOT, serialize([
        formatField(MERCHANT_INFORMATION_TEMPLATE_ID_GUID, GUID_PROMPTPAY),
        formatField(targetType, formatTarget(sanitizedTarget))
      ])),
      formatField(ID_COUNTRY_CODE, COUNTRY_CODE_TH),
      formatField(ID_TRANSACTION_CURRENCY, TRANSACTION_CURRENCY_THB),
      amount ? formatField(ID_TRANSACTION_AMOUNT, formatAmount(amount)) : undefined
    ];

    // Calculate CRC
    const dataToCrc = serialize(data) + ID_CRC + '04';
    const crcValue = CRC.crc16xmodem(dataToCrc, 0xffff);
    
    // Add CRC to final data
    data.push(formatField(ID_CRC, formatCrc(crcValue)));

    return serialize(data);
  } catch (error) {
    throw new Error(`Failed to generate PromptPay QR payload: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate Thai phone number format
 * @param phoneNumber Phone number string
 * @returns true if valid Thai phone number
 */
export function validateThaiPhoneNumber(phoneNumber: string): boolean {
  const digits = sanitizeTarget(phoneNumber);
  // Thai mobile numbers are 10 digits starting with 08 or 09
  return /^0[89]\d{8}$/.test(digits);
}

/**
 * Validate Thai citizen ID using checksum algorithm
 * @param citizenId Citizen ID string
 * @returns true if valid Thai citizen ID
 */
export function validateThaiCitizenId(citizenId: string): boolean {
  const digits = sanitizeTarget(citizenId);

  // Must be exactly 13 digits
  if (digits.length !== 13) return false;

  // Calculate checksum using Thai citizen ID algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(digits[12]);
}

/**
 * Format Thai phone number for display
 * @param phoneNumber Phone number string
 * @returns Formatted phone number (xxx-xxx-xxxx)
 */
export function formatThaiPhoneNumber(phoneNumber: string): string {
  const digits = sanitizeTarget(phoneNumber);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phoneNumber;
}

/**
 * Format Thai citizen ID for display
 * @param citizenId Citizen ID string
 * @returns Formatted citizen ID (x-xxxx-xxxxx-xx-x)
 */
export function formatThaiCitizenId(citizenId: string): string {
  const digits = sanitizeTarget(citizenId);
  if (digits.length === 13) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`;
  }
  return citizenId;
}