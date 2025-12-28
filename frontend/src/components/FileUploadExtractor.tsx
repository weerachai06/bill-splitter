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

  // Image preprocessing with service worker
  const preprocessImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const imageData = ctx?.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          if (imageData) {
            const messageHandler = (event: MessageEvent) => {
              if (event.data.type === "IMAGE_PROCESSED") {
                navigator.serviceWorker.removeEventListener(
                  "message",
                  messageHandler
                );
                const processedFile = new File(
                  [event.data.processedBlob],
                  file.name,
                  {
                    type: "image/jpeg",
                  }
                );
                resolve(processedFile);
              } else if (event.data.type === "IMAGE_PROCESS_ERROR") {
                navigator.serviceWorker.removeEventListener(
                  "message",
                  messageHandler
                );
                console.error(
                  "Service worker processing error:",
                  event.data.error
                );
                resolve(file); // Fallback to original file
              }
            };

            navigator.serviceWorker.addEventListener("message", messageHandler);
            navigator.serviceWorker.controller?.postMessage({
              type: "PROCESS_IMAGE",
              imageData: imageData,
            });
          } else {
            resolve(file);
          }
        };

        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
      } else {
        // Fallback if service worker not available
        resolve(file);
      }
    });
  };

  // Move extractReceiptData before handleFileSelect
  const extractReceiptData = async (file?: File) => {
    const fileToProcess = file || selectedFile;
    if (!fileToProcess) return;

    setIsProcessing(true);
    setProcessingSteps(["📤 Preprocessing image..."]);
    setExtractionStatus("Optimizing image for AI analysis...");
    setError(null);

    try {
      // Preprocess image with service worker
      const processedFile = await preprocessImage(fileToProcess);

      setProcessingSteps([
        "📤 Preprocessing image...",
        "🤖 Analyzing with AI...",
      ]);
      setExtractionStatus("Processing with Google Gemini...");

      const formData = new FormData();
      formData.append("file", processedFile);

      const response = await fetch("/api/extract-receipt/stream", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process receipt: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let responseData: any = null;

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix

                  if (data.type === "progress") {
                    setExtractionStatus(data.message);
                  } else if (data.type === "result") {
                    responseData = data.data;
                  }
                } catch (parseError) {
                  console.warn("Failed to parse streaming data:", parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      if (!responseData) {
        throw new Error("No data received from streaming response");
      }

      setProcessingSteps([
        "📤 Preprocessing image...",
        "🤖 Analyzing with AI...",
        "✅ Extraction complete!",
      ]);
      setExtractionStatus("✅ Receipt processed successfully!");

      // Data is already parsed from streaming, just validate it
      const validatedData = validateExtractedData(responseData);
      if (validatedData) {
        setExtractedData(validatedData);
        onExtractComplete(validatedData);
      } else {
        setError("Failed to validate extracted data");
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

  // Analyze image properties to determine optimal brightness and contrast
  const analyzeImageProperties = (pixels: ImageData) => {
    const data = pixels.data;
    let totalBrightness = 0;
    let brightnessValues: number[] = [];

    // Convert to grayscale and collect brightness values
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      totalBrightness += brightness;
      brightnessValues.push(brightness);
    }

    const pixelCount = data.length / 4;
    const avgBrightness = totalBrightness / pixelCount;

    // Calculate contrast (standard deviation)
    let variance = 0;
    for (const brightness of brightnessValues) {
      variance += Math.pow(brightness - avgBrightness, 2);
    }
    const standardDeviation = Math.sqrt(variance / pixelCount);

    // Calculate histogram for better analysis
    const histogram = new Array(256).fill(0);
    for (const brightness of brightnessValues) {
      histogram[Math.floor(brightness)]++;
    }

    // Find percentiles for better threshold estimation
    const sortedValues = brightnessValues.sort((a, b) => a - b);
    const p10 = sortedValues[Math.floor(pixelCount * 0.1)];
    const p90 = sortedValues[Math.floor(pixelCount * 0.9)];

    return {
      avgBrightness,
      contrast: standardDeviation,
      p10,
      p90,
      histogram,
    };
  };

  // Calculate optimal enhancement settings based on image analysis
  const calculateOptimalSettings = (analysis: any) => {
    const { avgBrightness, contrast, p10, p90 } = analysis;

    // Determine brightness adjustment
    let brightnessAdjustment = 0;
    if (avgBrightness < 80) {
      // Dark image - brighten it
      brightnessAdjustment = (80 - avgBrightness) * 0.8;
    } else if (avgBrightness > 180) {
      // Bright image - darken it slightly
      brightnessAdjustment = (180 - avgBrightness) * 0.3;
    }

    // Determine contrast adjustment
    let contrastMultiplier = 1.0;
    if (contrast < 30) {
      // Low contrast - increase it significantly
      contrastMultiplier = 2.0 + (30 - contrast) * 0.05;
    } else if (contrast < 50) {
      // Medium-low contrast - increase moderately
      contrastMultiplier = 1.5 + (50 - contrast) * 0.02;
    } else if (contrast > 80) {
      // High contrast - reduce slightly
      contrastMultiplier = 1.2 - (contrast - 80) * 0.01;
    } else {
      // Good contrast - minor enhancement
      contrastMultiplier = 1.3;
    }

    // Determine optimal threshold based on image characteristics
    let optimalThreshold = 128; // Default

    if (p90 - p10 > 100) {
      // Good dynamic range
      optimalThreshold = (p10 + p90) / 2;
    } else {
      // Limited dynamic range - use brightness-based threshold
      optimalThreshold = Math.max(100, Math.min(180, avgBrightness + 10));
    }

    return {
      brightnessAdjustment: Math.max(-50, Math.min(50, brightnessAdjustment)),
      contrastMultiplier: Math.max(1.0, Math.min(3.0, contrastMultiplier)),
      optimalThreshold: Math.max(80, Math.min(200, optimalThreshold)),
    };
  };

  // Threshold filter function with automatic brightness/contrast detection
  const applyThresholdFilter = (
    pixels: ImageData,
    threshold: number
  ): ImageData => {
    const data = pixels.data;

    // Step 1: Analyze image to determine optimal settings
    const analysis = analyzeImageProperties(pixels);
    const settings = calculateOptimalSettings(analysis);

    console.log("Image Analysis:", analysis);
    console.log("Optimal Settings:", settings);

    // Step 2: Apply automatic brightness/contrast enhancement
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Convert to grayscale using luminance formula
      let grayscale = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // Apply automatic contrast and brightness
      grayscale =
        (grayscale - 128) * settings.contrastMultiplier +
        128 +
        settings.brightnessAdjustment;
      grayscale = Math.max(0, Math.min(255, grayscale)); // Clamp values

      data[i] = grayscale;
      data[i + 1] = grayscale;
      data[i + 2] = grayscale;
    }

    // Step 3: Apply threshold with automatically determined level
    for (let i = 0; i < data.length; i += 4) {
      const grayscale = data[i]; // Already processed above
      // Use automatically calculated threshold
      const value = grayscale >= settings.optimalThreshold ? 255 : 0;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      // Alpha channel remains unchanged
    }

    return pixels;
  };

  const resizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        let { width, height } = img;

        // Use larger dimensions for better OCR quality
        const targetMaxWidth = Math.max(maxWidth, 400);
        const targetMaxHeight = Math.max(maxHeight, 400);

        if (width > targetMaxWidth || height > targetMaxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = targetMaxWidth;
            height = Math.round(targetMaxWidth / aspectRatio);
          } else {
            height = targetMaxHeight;
            width = Math.round(targetMaxHeight * aspectRatio);
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Apply automatic threshold filter with dynamic brightness/contrast detection
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // Threshold parameter is now ignored as it's calculated automatically
          const filteredImageData = applyThresholdFilter(imageData, 0);
          ctx.putImageData(filteredImageData, 0, 0);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: "image/jpeg", // Force JPEG for consistency
              });
              resolve(resizedFile);
            } else {
              reject("Canvas is empty");
            }
          },
          "image/jpeg",
          0.9
        );
      };

      img.onerror = () => reject("Failed to load image");
      img.src = URL.createObjectURL(file);
    });
  };

  const toDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject("Failed to convert file to Data URL");
        }
      };
      reader.onerror = () => {
        reject("Failed to read file");
      };
      reader.readAsDataURL(file);
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const handleFileSelect = useCallback(async (file: File) => {
    const resizedImage = await resizeImage(file, 800, 800);
    setSelectedFile(resizedImage);

    const url = URL.createObjectURL(resizedImage);
    setPreviewUrl(url);
    setProcessingSteps([]);
    setExtractionStatus("");
    setExtractedData(null);
    setError(null);

    const base64 = await toDataUrl(resizedImage);
    console.log("Base64 string length:", base64);

    // Automatically start extraction
    // await extractReceiptData(file);

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
      e.stopPropagation();

      let file: File | null = null;

      // Handle different drag sources
      if (e.dataTransfer.files?.[0]) {
        file = e.dataTransfer.files[0];
      } else if (e.dataTransfer.items) {
        // Handle drag from external sources
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          if (e.dataTransfer.items[i].kind === "file") {
            file = e.dataTransfer.items[i].getAsFile();
            break;
          }
        }
      }

      if (file?.type.startsWith("image/")) {
        await handleFileSelect(file);
      } else if (file) {
        setError("Please select an image file (PNG, JPG, etc.)");
      } else {
        setError(
          "Could not read the dropped file. Please try uploading directly."
        );
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
              onDragEnter={handleDragEnter}
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
              <Label htmlFor="receipt-upload" className="cursor-pointer">
                <Button type="button" variant="outline" className="mt-4">
                  <span>
                    {selectedFile ? "Change File" : "Choose & Extract"}
                  </span>
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
