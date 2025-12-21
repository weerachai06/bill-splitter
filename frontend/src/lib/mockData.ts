// Mock data for bill splitter
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

export const mockBill: Bill = {
  id: "bill-1",
  title: "Dinner at Thai Restaurant",
  date: "2025-12-21",
  tax: 42.5,
  serviceCharge: 85.0,
  discount: 0,
  people: [
    { id: "person-1", name: "John", color: "bg-blue-500" },
    { id: "person-2", name: "Sarah", color: "bg-green-500" },
    { id: "person-3", name: "Mike", color: "bg-purple-500" },
    { id: "person-4", name: "Lisa", color: "bg-pink-500" },
  ],
  items: [
    {
      id: "item-1",
      name: "Pad Thai",
      price: 180,
      quantity: 2,
      assignedTo: ["person-1", "person-2"],
    },
    {
      id: "item-2",
      name: "Green Curry",
      price: 220,
      quantity: 1,
      assignedTo: ["person-3"],
    },
    {
      id: "item-3",
      name: "Tom Yum Soup",
      price: 150,
      quantity: 1,
      assignedTo: ["person-1", "person-2", "person-3", "person-4"],
    },
    {
      id: "item-4",
      name: "Mango Sticky Rice",
      price: 120,
      quantity: 2,
      assignedTo: ["person-2", "person-4"],
    },
    {
      id: "item-5",
      name: "Thai Iced Tea",
      price: 80,
      quantity: 4,
      assignedTo: ["person-1", "person-2", "person-3", "person-4"],
    },
    {
      id: "item-6",
      name: "Massaman Curry",
      price: 250,
      quantity: 1,
      assignedTo: ["person-1", "person-4"],
    },
  ],
};

// Calculate functions
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
  let personalTotal = 0;
  const totalPeople = bill.people.length;

  bill.items.forEach((item) => {
    if (item.assignedTo.includes(personId)) {
      const itemTotal = calculateItemTotal(item);
      const shareAmount = itemTotal / item.assignedTo.length;
      personalTotal += shareAmount;
    }
  });

  // Add proportional tax and service charge
  const subtotal = calculateSubtotal(bill);
  const personalSubtotal = personalTotal;
  const personalTax = (personalSubtotal / subtotal) * bill.tax;
  const personalService = (personalSubtotal / subtotal) * bill.serviceCharge;
  const personalDiscount = (personalSubtotal / subtotal) * bill.discount;

  return personalSubtotal + personalTax + personalService - personalDiscount;
}
