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
import { Textarea } from "@/components/ui/textarea";
import {
  type Bill,
  type BillItem,
  type Person,
  calculateItemTotal,
  calculatePersonTotal,
  calculateSubtotal,
  calculateTotal,
} from "@/lib/types";
import {
  AlertCircle,
  Camera,
  CheckCircle,
  DollarSign,
  Loader2,
  Receipt,
  Upload,
  Users,
} from "lucide-react";
import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useCallback,
  useState,
} from "react";

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
  onExtractedData: (data: any) => void;
}

export function ReceiptUploader({ onExtractedData }: ReceiptUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string>("");
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setProcessingSteps([]);
    setExtractionStatus("");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const extractReceiptData = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingSteps(["📤 Uploading image..."]);
    setExtractionStatus("Initializing AI analysis...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Use streaming endpoint for real-time updates
      const response = await fetch("/api/extract-receipt/stream", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process receipt");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);

              switch (parsed.type) {
                case "status":
                  setExtractionStatus(parsed.message);
                  setProcessingSteps((prev) => [
                    ...prev,
                    `🤖 ${parsed.message}`,
                  ]);
                  break;
                case "progress":
                  setExtractionStatus("Analyzing receipt content...");
                  setProcessingSteps((prev) => {
                    const newSteps = [...prev];
                    if (!newSteps.includes("🔍 Reading receipt text...")) {
                      newSteps.push("🔍 Reading receipt text...");
                    }
                    return newSteps;
                  });
                  break;
                case "complete":
                  setExtractionStatus("✅ Receipt processed successfully!");
                  setProcessingSteps((prev) => [
                    ...prev,
                    "✅ Extraction complete!",
                  ]);
                  onExtractedData(parsed.data);
                  break;
                case "error":
                  setExtractionStatus(`❌ Error: ${parsed.message}`);
                  setProcessingSteps((prev) => [
                    ...prev,
                    `❌ ${parsed.message}`,
                  ]);
                  break;
              }
            } catch (e) {
              console.log("Ignoring parse error for chunk:", line);
            }
          }
        }
      }
    } catch (error) {
      console.error("Receipt extraction error:", error);
      setExtractionStatus("❌ Failed to process receipt");
      setProcessingSteps((prev) => [...prev, "❌ Processing failed"]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          AI Receipt Extractor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="mx-auto max-h-48 rounded-lg border"
                />
                <p className="text-sm font-medium">{selectedFile?.name}</p>
              </div>
            ) : (
              <div>
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Click to upload or drag and drop your receipt
                </p>
              </div>
            )}

            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="receipt-upload"
            />
            <Label htmlFor="receipt-upload">
              <Button variant="outline" className="cursor-pointer">
                {selectedFile ? "Change File" : "Choose File"}
              </Button>
            </Label>
          </div>

          {/* Extract Button */}
          {selectedFile && (
            <Button
              onClick={extractReceiptData}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Extract Receipt Data
                </>
              )}
            </Button>
          )}

          {/* Processing Status */}
          {(isProcessing || extractionStatus) && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="font-medium text-sm">{extractionStatus}</div>
                  {processingSteps.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {processingSteps.map((step, index) => (
                        <div key={index}>{step}</div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ExtractedDataDisplayProps {
  extractedData: any;
  onCreateBill: (data: any) => void;
  onEditData: (data: any) => void;
}

export function ExtractedDataDisplay({
  extractedData,
  onCreateBill,
  onEditData,
}: ExtractedDataDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(extractedData);

  const handleSave = () => {
    onEditData(editedData);
    setIsEditing(false);
  };

  const handleEditItem = (index: number, field: string, value: any) => {
    setEditedData((prev: { items: any[] }) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleEditField = (field: string, value: any) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Extracted Receipt Data
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            {isEditing && (
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            )}
            <Button
              onClick={() =>
                onCreateBill(isEditing ? editedData : extractedData)
              }
            >
              Create Bill
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Restaurant Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Restaurant</Label>
              {isEditing ? (
                <Input
                  value={editedData.restaurant_name}
                  onChange={(e) =>
                    handleEditField("restaurant_name", e.target.value)
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  {extractedData.restaurant_name}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedData.date}
                  onChange={(e) => handleEditField("date", e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  {extractedData.date}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Items</Label>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isEditing ? editedData.items : extractedData.items)?.map(
                    (item: BillItem, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={item.name}
                              onChange={(e) =>
                                handleEditItem(index, "name", e.target.value)
                              }
                            />
                          ) : (
                            item.name
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                handleEditItem(
                                  index,
                                  "price",
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          ) : (
                            `฿${item.price}`
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={String(item.quantity || 1)}
                              onChange={(e) =>
                                handleEditItem(
                                  index,
                                  "quantity",
                                  Number.parseInt(e.target.value) || 1
                                )
                              }
                            />
                          ) : (
                            item.quantity
                          )}
                        </TableCell>
                        <TableCell>
                          ฿
                          {(
                            (Number(item.price) || 0) *
                            (Number(item.quantity) || 0)
                          ).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Tax</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.tax}
                  onChange={(e) =>
                    handleEditField(
                      "tax",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  ฿{extractedData.tax}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Service Charge</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.service_charge}
                  onChange={(e) =>
                    handleEditField(
                      "service_charge",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  ฿{extractedData.service_charge}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Discount</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.discount}
                  onChange={(e) =>
                    handleEditField(
                      "discount",
                      Number.parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">
                  ฿{extractedData.discount}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Total</Label>
              <p className="text-lg font-semibold mt-1">
                ฿{isEditing ? editedData.total : extractedData.total}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
