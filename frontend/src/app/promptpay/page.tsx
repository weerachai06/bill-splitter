"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Download,
  QrCode,
  Smartphone,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import {
  generatePromptPayPayload,
  validateThaiPhoneNumber,
  validateThaiCitizenId,
} from "@/lib/promptPayUtils";

export default function PromptPayQRPage() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [amount, setAmount] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("mobile");

  // Format Thai mobile number
  const formatMobileNumber = (number: string): string => {
    // Remove all non-digits
    const digits = number.replace(/\D/g, "");

    // Add +66 prefix if it starts with 0
    if (digits.startsWith("0")) {
      return "+66" + digits.substring(1);
    }

    // Add +66 prefix if it doesn't have country code
    if (!digits.startsWith("66")) {
      return "+66" + digits;
    }

    return "+" + digits;
  };

  // Format Thai citizen ID
  const formatCitizenId = (id: string): string => {
    // Remove all non-digits
    const digits = id.replace(/\D/g, "");
    return digits;
  };

  // Validate Thai mobile number
  const validateMobileNumber = (number: string): boolean => {
    return validateThaiPhoneNumber(number);
  };

  // Validate Thai citizen ID
  const validateCitizenId = (id: string): boolean => {
    return validateThaiCitizenId(id);
  };

  // Generate QR Code
  const generateQRCode = async () => {
    setError(null);

    try {
      let identifier = "";

      if (activeTab === "mobile") {
        if (!mobileNumber) {
          setError("กรุณาใส่เบอร์โทรศัพท์");
          return;
        }

        if (!validateMobileNumber(mobileNumber)) {
          setError("เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 08 หรือ 09)");
          return;
        }

        // Use Thai mobile number as is (0xxxxxxxxx)
        identifier = mobileNumber.startsWith("0")
          ? mobileNumber
          : "0" + mobileNumber;
      } else {
        if (!citizenId) {
          setError("กรุณาใส่เลขบัตรประชาชน");
          return;
        }

        if (!validateCitizenId(citizenId)) {
          setError("เลขบัตรประชาชนไม่ถูกต้อง");
          return;
        }

        identifier = formatCitizenId(citizenId);
      }

      const qrString = generatePromptPayPayload(identifier, {
        amount: amount ? parseFloat(amount) : undefined,
      });

      console.log("Generated PromptPay QR String:", qrString);
      console.log("Identifier used:", identifier);
      console.log("Amount:", amount ? parseFloat(amount) : "No amount");

      // Generate QR Code image
      const qrDataUrl = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeDataUrl(qrDataUrl);
    } catch (err) {
      console.error("QR Generation Error:", err);
      setError("เกิดข้อผิดพลาดในการสร้าง QR Code");
    }
  };

  // Copy QR Code to clipboard
  const copyQRCode = async () => {
    if (!qrCodeDataUrl) return;

    try {
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      alert("คัดลอก QR Code แล้ว!");
    } catch (err) {
      console.error("Copy failed:", err);
      alert("ไม่สามารถคัดลอกได้");
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.download = `promptpay-qr-${Date.now()}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Back button and Header */}
        <div className="space-y-4">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้าแรก
            </Button>
          </Link>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
              <QrCode className="h-8 w-8" />
              PromptPay QR Generator
            </h1>
            <p className="text-gray-600">
              สร้าง QR Code สำหรับรับเงินผ่าน PromptPay
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>สร้าง QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tabs for Mobile/Citizen ID */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="mobile"
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    เบอร์โทร
                  </TabsTrigger>
                  <TabsTrigger
                    value="citizen"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    บัตรประชาชน
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="mobile" className="space-y-4">
                  <div>
                    <Label htmlFor="mobile">เบอร์โทรศัพท์</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="08xxxxxxxx หรือ 09xxxxxxxx"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      maxLength={10}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      ใส่เบอร์โทรศัพท์ที่ลงทะเบียน PromptPay แล้ว
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="citizen" className="space-y-4">
                  <div>
                    <Label htmlFor="citizen">เลขบัตรประชาชน</Label>
                    <Input
                      id="citizen"
                      type="text"
                      placeholder="1234567890123"
                      value={citizenId}
                      onChange={(e) =>
                        setCitizenId(e.target.value.replace(/\D/g, ""))
                      }
                      maxLength={13}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      ใส่เลขบัตรประชาชน 13 หลักที่ลงทะเบียน PromptPay แล้ว
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Amount */}
              <div>
                <Label htmlFor="amount">จำนวนเงิน (บาท) - ไม่ระบุก็ได้</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <p className="text-sm text-gray-500 mt-1">
                  หากไม่ระบุจำนวนเงิน ผู้จ่ายสามารถใส่จำนวนเงินเองได้
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <Button onClick={generateQRCode} className="w-full" size="lg">
                <QrCode className="h-4 w-4 mr-2" />
                สร้าง QR Code
              </Button>
            </CardContent>
          </Card>

          {/* QR Display Section */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              {qrCodeDataUrl ? (
                <div className="space-y-4">
                  {/* QR Code Image */}
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg border">
                      <img
                        src={qrCodeDataUrl}
                        alt="PromptPay QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                  </div>

                  {/* QR Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ประเภท:</span>
                      <Badge variant="secondary">
                        {activeTab === "mobile"
                          ? "เบอร์โทรศัพท์"
                          : "บัตรประชาชน"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">หมายเลข:</span>
                      <span className="text-sm font-mono">
                        {activeTab === "mobile"
                          ? mobileNumber.startsWith("0")
                            ? mobileNumber
                            : "0" + mobileNumber
                          : formatCitizenId(citizenId)}
                      </span>
                    </div>
                    {amount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          จำนวนเงิน:
                        </span>
                        <Badge variant="outline" className="text-green-600">
                          ฿
                          {parseFloat(amount).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={copyQRCode}>
                      <Copy className="h-4 w-4 mr-2" />
                      คัดลอก
                    </Button>
                    <Button variant="outline" onClick={downloadQRCode}>
                      <Download className="h-4 w-4 mr-2" />
                      ดาวน์โหลด
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                  <QrCode className="h-16 w-16 mb-4" />
                  <p>QR Code จะแสดงที่นี่</p>
                  <p className="text-sm">กรุณากรอกข้อมูลและกดสร้าง QR Code</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>วิธีการใช้งาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">สำหรับผู้รับเงิน:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>เลือกประเภท: เบอร์โทรศัพท์ หรือ บัตรประชาชน</li>
                  <li>ใส่หมายเลขที่ลงทะเบียน PromptPay แล้ว</li>
                  <li>ใส่จำนวนเงิน (ถ้าต้องการกำหนด)</li>
                  <li>กดสร้าง QR Code</li>
                  <li>แสดง QR Code ให้ผู้จ่ายเงินสแกน</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">สำหรับผู้จ่ายเงิน:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>เปิดแอปธนาคารหรือ Mobile Banking</li>
                  <li>เลือกเมนู "สแกน QR" หรือ "PromptPay"</li>
                  <li>สแกน QR Code ที่แสดง</li>
                  <li>ตรวจสอบข้อมูลผู้รับและจำนวนเงิน</li>
                  <li>ยืนยันการโอนเงิน</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
