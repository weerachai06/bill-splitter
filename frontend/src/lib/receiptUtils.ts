// Utility functions for receipt extraction

export interface ExtractedReceiptData {
  restaurant_name: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  tax: number;
  service_charge: number;
  discount: number;
  total: number;
  currency: string;
}

export interface ProcessingSteps {
  upload: boolean;
  processing: boolean;
  extraction: boolean;
  complete: boolean;
}

export function validateExtractedData(data: any): ExtractedReceiptData | null {
  try {
    // Ensure required fields exist with defaults
    return {
      restaurant_name: data.restaurant_name || "Unknown Restaurant",
      date: data.date || new Date().toISOString().split("T")[0],
      items: Array.isArray(data.items)
        ? data.items.map((item: any) => ({
            name: item.name || "Unknown Item",
            price: Number.parseFloat(item.price) || 0,
            quantity: Number.parseInt(item.quantity) || 1,
          }))
        : [],
      tax: Number.parseFloat(data.tax) || 0,
      service_charge: Number.parseFloat(data.service_charge) || 0,
      discount: Number.parseFloat(data.discount) || 0,
      total: Number.parseFloat(data.total) || 0,
      currency: data.currency || "THB",
    };
  } catch (error) {
    console.error("Failed to validate extracted data:", error);
    return null;
  }
}

export function calculateReceiptTotal(data: ExtractedReceiptData): number {
  const itemsTotal = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return itemsTotal + data.tax + data.service_charge - data.discount;
}
