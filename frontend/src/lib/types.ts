// Type definitions for bill splitter
export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[];
}

export interface Person {
  id: string;
  name: string;
  color: string;
}

export interface Bill {
  id: string;
  title: string;
  date: string;
  items: BillItem[];
  people: Person[];
  tax: number;
  serviceCharge: number;
  discount: number;
}

// Utility functions for calculations
export function calculateItemTotal(item: BillItem): number {
  return item.price * item.quantity;
}

export function calculateSubtotal(bill: Bill): number {
  return bill.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

export function calculateTotal(bill: Bill): number {
  const subtotal = calculateSubtotal(bill);
  return subtotal + bill.tax + bill.serviceCharge - bill.discount;
}

export function calculatePersonTotal(bill: Bill, personId: string): number {
  const total = calculateTotal(bill);
  const subtotal = calculateSubtotal(bill);

  let personItemsTotal = 0;

  for (const item of bill.items) {
    if (item.assignedTo.includes(personId)) {
      const itemTotal = calculateItemTotal(item);
      const shareCount = item.assignedTo.length;
      personItemsTotal += itemTotal / shareCount;
    }
  }

  if (subtotal === 0) return 0;

  // Calculate proportional share of additional charges
  const additionalCharges = bill.tax + bill.serviceCharge - bill.discount;
  const proportionalShare = (personItemsTotal / subtotal) * additionalCharges;

  return personItemsTotal + proportionalShare;
}

// Helper function to create an empty bill
export function createEmptyBill(): Bill {
  return {
    id: "",
    title: "New Bill",
    date: new Date().toISOString().split("T")[0],
    items: [],
    people: [],
    tax: 0,
    serviceCharge: 0,
    discount: 0,
  };
}
