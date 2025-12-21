import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type Bill,
  type BillItem,
  type Person,
  calculateItemTotal,
  calculatePersonTotal,
  calculateSubtotal,
  calculateTotal,
} from "@/lib/mockData";
import { Camera, DollarSign, Receipt, Users } from "lucide-react";

interface BillItemRowProps {
  item: BillItem;
  people: Person[];
  onAssignToggle: (itemId: string, personId: string) => void;
}

export function BillItemRow({
  item,
  people,
  onAssignToggle,
}: BillItemRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>฿{item.price}</TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell>฿{calculateItemTotal(item)}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {people.map((person) => (
            <Badge
              key={person.id}
              variant={
                item.assignedTo.includes(person.id) ? "default" : "outline"
              }
              className={`cursor-pointer ${
                item.assignedTo.includes(person.id)
                  ? `${person.color} text-white`
                  : ""
              }`}
              onClick={() => onAssignToggle(item.id, person.id)}
            >
              {person.name}
            </Badge>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}

interface BillSummaryProps {
  bill: Bill;
}

export function BillSummary({ bill }: BillSummaryProps) {
  const subtotal = calculateSubtotal(bill);
  const total = calculateTotal(bill);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Bill Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>฿{subtotal.toFixed(2)}</span>
        </div>
        {bill.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>฿{bill.tax.toFixed(2)}</span>
          </div>
        )}
        {bill.serviceCharge > 0 && (
          <div className="flex justify-between">
            <span>Service Charge:</span>
            <span>฿{bill.serviceCharge.toFixed(2)}</span>
          </div>
        )}
        {bill.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount:</span>
            <span>-฿{bill.discount.toFixed(2)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>฿{total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface PersonSummaryProps {
  bill: Bill;
}

export function PersonSummary({ bill }: PersonSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Individual Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bill.people.map((person) => {
            const personalTotal = calculatePersonTotal(bill, person.id);
            return (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${person.color}`} />
                  <span className="font-medium">{person.name}</span>
                </div>
                <span className="font-semibold">
                  ฿{personalTotal.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface ReceiptUploaderProps {
  onUpload: (file: File) => void;
}

export function ReceiptUploader({ onUpload }: ReceiptUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Upload Receipt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              Click to upload or drag and drop your receipt
            </p>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="receipt-upload"
            />
            <Label htmlFor="receipt-upload">
              <Button variant="outline" className="cursor-pointer">
                Choose File
              </Button>
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
