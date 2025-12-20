// Session storage utilities for bill splitter data
// Provides persistence across browser sessions without requiring backend storage

import type { Receipt, LineItem, Person, BillSummary } from "@bill-splitter/shared";

// Storage keys
const STORAGE_KEYS = {
  RECEIPT: 'bill-splitter:receipt',
  LINE_ITEMS: 'bill-splitter:line-items',
  PEOPLE: 'bill-splitter:people',
  BILL_SUMMARY: 'bill-splitter:bill-summary',
  TAX_AMOUNT: 'bill-splitter:tax-amount',
  TIP_AMOUNT: 'bill-splitter:tip-amount'
} as const;

// Type-safe storage operations
export class BillStorage {
  // Check if storage is available
  static isAvailable(): boolean {
    try {
      const testKey = 'bill-splitter-test';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // Receipt storage
  static saveReceipt(receipt: Receipt): void {
    if (!this.isAvailable()) return;
    
    try {
      sessionStorage.setItem(STORAGE_KEYS.RECEIPT, JSON.stringify(receipt));
    } catch (error) {
      console.warn('Failed to save receipt to session storage:', error);
    }
  }

  static loadReceipt(): Receipt | null {
    if (!this.isAvailable()) return null;

    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.RECEIPT);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load receipt from session storage:', error);
      return null;
    }
  }

  // Line items storage
  static saveLineItems(items: LineItem[]): void {
    if (!this.isAvailable()) return;

    try {
      sessionStorage.setItem(STORAGE_KEYS.LINE_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to save line items to session storage:', error);
    }
  }

  static loadLineItems(): LineItem[] {
    if (!this.isAvailable()) return [];

    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.LINE_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to load line items from session storage:', error);
      return [];
    }
  }

  // People storage
  static savePeople(people: Person[]): void {
    if (!this.isAvailable()) return;

    try {
      sessionStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
    } catch (error) {
      console.warn('Failed to save people to session storage:', error);
    }
  }

  static loadPeople(): Person[] {
    if (!this.isAvailable()) return [];

    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.PEOPLE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to load people from session storage:', error);
      return [];
    }
  }

  // Tax/Tip amounts storage
  static saveTaxAmount(amount: string): void {
    if (!this.isAvailable()) return;

    try {
      sessionStorage.setItem(STORAGE_KEYS.TAX_AMOUNT, amount);
    } catch (error) {
      console.warn('Failed to save tax amount to session storage:', error);
    }
  }

  static loadTaxAmount(): string {
    if (!this.isAvailable()) return "0.00";

    try {
      return sessionStorage.getItem(STORAGE_KEYS.TAX_AMOUNT) || "0.00";
    } catch (error) {
      console.warn('Failed to load tax amount from session storage:', error);
      return "0.00";
    }
  }

  static saveTipAmount(amount: string): void {
    if (!this.isAvailable()) return;

    try {
      sessionStorage.setItem(STORAGE_KEYS.TIP_AMOUNT, amount);
    } catch (error) {
      console.warn('Failed to save tip amount to session storage:', error);
    }
  }

  static loadTipAmount(): string {
    if (!this.isAvailable()) return "0.00";

    try {
      return sessionStorage.getItem(STORAGE_KEYS.TIP_AMOUNT) || "0.00";
    } catch (error) {
      console.warn('Failed to load tip amount from session storage:', error);
      return "0.00";
    }
  }

  // Bill summary storage
  static saveBillSummary(summary: BillSummary): void {
    if (!this.isAvailable()) return;

    try {
      sessionStorage.setItem(STORAGE_KEYS.BILL_SUMMARY, JSON.stringify(summary));
    } catch (error) {
      console.warn('Failed to save bill summary to session storage:', error);
    }
  }

  static loadBillSummary(): BillSummary | null {
    if (!this.isAvailable()) return null;

    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.BILL_SUMMARY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load bill summary from session storage:', error);
      return null;
    }
  }

  // Clear all stored data
  static clearAll(): void {
    if (!this.isAvailable()) return;

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
  }

  // Export data for debugging or backup
  static exportData(): Record<string, unknown> {
    if (!this.isAvailable()) return {};

    try {
      const data: Record<string, unknown> = {};
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        const value = sessionStorage.getItem(storageKey);
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      });
      return data;
    } catch (error) {
      console.warn('Failed to export session storage data:', error);
      return {};
    }
  }

  // Import data from backup
  static importData(data: Record<string, unknown>): void {
    if (!this.isAvailable()) return;

    try {
      Object.entries(data).forEach(([key, value]) => {
        const storageKey = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
        if (storageKey && value !== undefined) {
          sessionStorage.setItem(storageKey, JSON.stringify(value));
        }
      });
    } catch (error) {
      console.warn('Failed to import session storage data:', error);
    }
  }
}