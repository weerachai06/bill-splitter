import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type ExtractedReceiptData,
  validateExtractedData,
} from "@/lib/receiptUtils";
import {
  AlertCircle,
  Camera,
  CheckCircle,
  DollarSign,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { useCallback, useState } from "react";

interface FileUploadExtractorProps {
  onExtractComplete: (data: ExtractedReceiptData) => void;
}

export function FileUploadExtractor({
  onExtractComplete,
}: FileUploadExtractorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string>("");
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [extractedData, setExtractedData] =
    useState<ExtractedReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Move extractReceiptData before handleFileSelect
  const extractReceiptData = async (file?: File) => {
    const fileToProcess = file || selectedFile;
    if (!fileToProcess) return;

    setIsProcessing(true);
    setProcessingSteps(["📤 Uploading image..."]);
    setExtractionStatus("Initializing AI analysis...");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", fileToProcess);

      const response = await fetch("/api/extract-receipt/stream", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process receipt: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\\n");

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
                case "complete": {
                  setExtractionStatus("✅ Receipt processed successfully!");
                  setProcessingSteps((prev) => [
                    ...prev,
                    "✅ Extraction complete!",
                  ]);
                  const validatedData = validateExtractedData(parsed.data);
                  if (validatedData) {
                    setExtractedData(validatedData);
                    onExtractComplete(validatedData);
                  } else {
                    setError("Failed to parse extracted data");
                  }
                  break;
                }
                case "error":
                  setError(`❌ Error: ${parsed.message}`);
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process receipt";
      setError(errorMessage);
      setExtractionStatus(`❌ ${errorMessage}`);
      setProcessingSteps((prev) => [...prev, `❌ ${errorMessage}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setProcessingSteps([]);
    setExtractionStatus("");
    setExtractedData(null);
    setError(null);

    // Automatically start extraction
    await extractReceiptData(file);

    // Clean up previous URL
    return () => URL.revokeObjectURL(url);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      handleFileSelect(file);
    } else if (file) {
      setError("Please select an image file (PNG, JPG, etc.)");
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        await handleFileSelect(file);
      } else if (file) {
        setError("Please select an image file (PNG, JPG, etc.)");
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Receipt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                error
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-blue-400"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="mx-auto max-h-48 rounded-lg border object-contain"
                  />
                  <p className="text-sm font-medium">{selectedFile?.name}</p>
                </div>
              ) : (
                <div>
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Click to upload or drag and drop your receipt image
                  </p>
                  <p className="text-xs text-gray-500">
                    File will be processed automatically after selection
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
                <Button variant="outline" className="cursor-pointer mt-4">
                  {selectedFile ? "Change File" : "Choose & Extract"}
                </Button>
              </Label>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Processing Status */}
            {(isProcessing || extractionStatus) && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : error ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium text-sm">
                        {extractionStatus}
                      </span>
                    </div>
                    {processingSteps.length > 0 && (
                      <div className="space-y-1">
                        {processingSteps.map((step, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            {step}
                          </div>
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

      {/* Extracted Data Cards */}
      {extractedData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Extracted Receipt Data</h3>

          {/* Restaurant Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Restaurant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-sm font-medium">Restaurant</Label>
                <p className="text-sm text-gray-700">
                  {extractedData.restaurant_name}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm text-gray-700">{extractedData.date}</p>
              </div>
              {extractedData.currency && (
                <div>
                  <Label className="text-sm font-medium">Currency</Label>
                  <p className="text-sm text-gray-700">
                    {extractedData.currency}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Cards */}
          {extractedData.items && extractedData.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Bill Items</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {extractedData.items.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-3">
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">{item.name}</h5>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            Qty: {item.quantity}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            ฿{item.price}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-semibold text-sm">
                            ฿{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Totals Card */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-green-700">
                <DollarSign className="h-4 w-4" />
                Bill Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {extractedData.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>฿{extractedData.tax}</span>
                  </div>
                )}
                {extractedData.service_charge > 0 && (
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>฿{extractedData.service_charge}</span>
                  </div>
                )}
                {extractedData.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-฿{extractedData.discount}</span>
                  </div>
                )}
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg text-green-700">
                    ฿{extractedData.total}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
