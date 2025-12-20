// Decimal Calculations for Bill Splitting
// Uses Decimal.js for precise financial calculations to avoid floating point errors

import { Decimal } from 'decimal.js';
import type { LineItem, ItemAssignment, Person, DecimalString } from '@bill-splitter/shared';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -18,
  toExpPos: 18,
  maxE: 9e15,
  minE: -9e15,
  modulo: Decimal.ROUND_HALF_UP
});

/**
 * Convert a number or string to a DecimalString with 2 decimal places
 */
export function toDecimalString(value: number | string | Decimal): DecimalString {
  return new Decimal(value).toFixed(2);
}

/**
 * Add two decimal values safely
 */
export function addDecimal(a: DecimalString, b: DecimalString): DecimalString {
  return new Decimal(a).plus(new Decimal(b)).toFixed(2);
}

/**
 * Subtract two decimal values safely
 */
export function subtractDecimal(a: DecimalString, b: DecimalString): DecimalString {
  return new Decimal(a).minus(new Decimal(b)).toFixed(2);
}

/**
 * Multiply two decimal values safely
 */
export function multiplyDecimal(a: DecimalString, b: DecimalString): DecimalString {
  return new Decimal(a).times(new Decimal(b)).toFixed(2);
}

/**
 * Divide two decimal values safely
 */
export function divideDecimal(a: DecimalString, b: DecimalString): DecimalString {
  return new Decimal(a).dividedBy(new Decimal(b)).toFixed(2);
}

/**
 * Calculate the total price for a line item (quantity × unit price)
 */
export function calculateLineItemTotal(quantity: number, unitPrice: DecimalString): DecimalString {
  return new Decimal(quantity).times(new Decimal(unitPrice)).toFixed(2);
}

/**
 * Calculate the subtotal from all line items
 */
export function calculateSubtotal(lineItems: LineItem[]): DecimalString {
  return lineItems.reduce((sum, item) => {
    return addDecimal(sum, item.totalPrice);
  }, '0.00');
}

/**
 * Calculate tax amount based on subtotal and tax rate
 */
export function calculateTax(subtotal: DecimalString, taxRate: DecimalString): DecimalString {
  return multiplyDecimal(subtotal, taxRate);
}

/**
 * Calculate total amount (subtotal + tax + tip)
 */
export function calculateTotal(
  subtotal: DecimalString,
  taxAmount: DecimalString,
  tipAmount: DecimalString
): DecimalString {
  return addDecimal(addDecimal(subtotal, taxAmount), tipAmount);
}

/**
 * Calculate how much each person owes based on their assigned items
 */
export function calculatePersonTotals(
  lineItems: LineItem[],
  assignments: ItemAssignment[],
  people: Person[],
  taxAmount: DecimalString,
  tipAmount: DecimalString
): Person[] {
  const subtotal = new Decimal(calculateSubtotal(lineItems));
  
  // If no assignments or subtotal is zero, return people with zero amounts
  if (assignments.length === 0 || subtotal.equals(0)) {
    return people.map(person => ({
      ...person,
      subtotal: '0.00',
      taxAmount: '0.00',
      tipAmount: '0.00',
      totalOwed: '0.00'
    }));
  }

  const tax = new Decimal(taxAmount);
  const tip = new Decimal(tipAmount);

  return people.map(person => {
    // Calculate person's share of line items
    const personSubtotal = assignments
      .filter(assignment => assignment.personId === person.id)
      .reduce((sum, assignment) => {
        return sum.plus(new Decimal(assignment.assignedAmount));
      }, new Decimal(0));

    // Calculate proportional tax and tip based on subtotal percentage
    const percentage = subtotal.equals(0) ? new Decimal(0) : personSubtotal.dividedBy(subtotal);
    const personTax = tax.times(percentage);
    const personTip = tip.times(percentage);
    const personTotal = personSubtotal.plus(personTax).plus(personTip);

    return {
      ...person,
      subtotal: personSubtotal.toFixed(2),
      taxAmount: personTax.toFixed(2),
      tipAmount: personTip.toFixed(2),
      totalOwed: personTotal.toFixed(2)
    };
  });
}

/**
 * Calculate assignment amounts based on line items and share percentages
 */
export function calculateAssignmentAmounts(
  lineItems: LineItem[],
  assignments: ItemAssignment[]
): ItemAssignment[] {
  return assignments.map(assignment => {
    const lineItem = lineItems.find(item => item.id === assignment.lineItemId);
    if (!lineItem) {
      return { ...assignment, assignedAmount: '0.00' };
    }

    const shareAmount = multiplyDecimal(lineItem.totalPrice, assignment.sharePercentage);
    return { ...assignment, assignedAmount: shareAmount };
  });
}

/**
 * Validate that all line items are fully assigned (shares sum to 1.0 for each item)
 */
export function validateAssignments(
  lineItems: LineItem[],
  assignments: ItemAssignment[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const lineItem of lineItems) {
    const itemAssignments = assignments.filter(a => a.lineItemId === lineItem.id);
    
    if (itemAssignments.length === 0) {
      errors.push(`Item "${lineItem.name}" has no assignments`);
      continue;
    }

    const totalShare = itemAssignments.reduce((sum, assignment) => {
      return sum.plus(new Decimal(assignment.sharePercentage));
    }, new Decimal(0));

    if (!totalShare.equals(1)) {
      errors.push(
        `Item "${lineItem.name}" assignments total ${totalShare.toFixed(4)} instead of 1.0000`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Auto-assign items equally among all people
 */
export function createEqualAssignments(
  lineItems: LineItem[],
  people: Person[]
): ItemAssignment[] {
  if (people.length === 0) return [];

  const sharePerPerson = new Decimal(1).dividedBy(people.length).toFixed(4);

  const assignments: ItemAssignment[] = [];

  for (const lineItem of lineItems) {
    for (const person of people) {
      assignments.push({
        lineItemId: lineItem.id,
        personId: person.id,
        sharePercentage: sharePerPerson,
        assignedAmount: '0.00' // Will be calculated separately
      });
    }
  }

  return calculateAssignmentAmounts(lineItems, assignments);
}

/**
 * Compare two decimal strings for equality within a small tolerance
 */
export function decimalEquals(a: DecimalString, b: DecimalString, tolerance = '0.01'): boolean {
  const diff = new Decimal(a).minus(new Decimal(b)).abs();
  return diff.lessThanOrEqualTo(new Decimal(tolerance));
}

/**
 * Format a decimal string for display (e.g., add currency symbol)
 */
export function formatCurrency(amount: DecimalString, currency = '$'): string {
  return `${currency}${amount}`;
}

/**
 * Parse a currency string back to decimal (removes currency symbols)
 */
export function parseCurrency(value: string): DecimalString {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  try {
    return new Decimal(cleaned || 0).toFixed(2);
  } catch {
    return '0.00';
  }
}