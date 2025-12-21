"use client";

import {
  BillItemRow,
  BillSummary,
  PersonSummary,
  ReceiptUploader,
  ExtractedDataDisplay,
} from "@/components/BillSplitter";
import { PWAInstaller, PWAStatus } from "@/components/PWAComponents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type Bill,
  type BillItem,
  type Person,
  createEmptyBill,
} from "@/lib/types";
import { Plus, Receipt, Upload } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [bill, setBill] = useState<Bill>(createEmptyBill());
  const [newPersonName, setNewPersonName] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState("upload");

  const handleAssignToggle = (itemId: string, personId: string) => {
    setBill((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const isAssigned = item.assignedTo.includes(personId);
          return {
            ...item,
            assignedTo: isAssigned
              ? item.assignedTo.filter((id) => id !== personId)
              : [...item.assignedTo, personId],
          };
        }
        return item;
      }),
    }));
  };

  const addPerson = () => {
    if (newPersonName.trim()) {
      const colors = [
        "bg-red-500",
        "bg-yellow-500",
        "bg-indigo-500",
        "bg-teal-500",
      ];
      const newPerson: Person = {
        id: `person-${Date.now()}`,
        name: newPersonName.trim(),
        color: colors[bill.people.length % colors.length],
      };
      setBill((prev) => ({
        ...prev,
        people: [...prev.people, newPerson],
      }));
      setNewPersonName("");
    }
  };

  const handleExtractedData = (data: any) => {
    setExtractedData(data);
    // Auto-switch to the next step after successful extraction
    setTimeout(() => {
      setCurrentTab("extracted");
    }, 1000);
  };

  const handleEditExtractedData = (data: any) => {
    setExtractedData(data);
  };

  const convertExtractedDataToBill = (data: any): void => {
    // Generate default people if none exist
    const defaultPeople: Person[] = [
      { id: "person-1", name: "Person 1", color: "bg-blue-500" },
      { id: "person-2", name: "Person 2", color: "bg-green-500" },
      { id: "person-3", name: "Person 3", color: "bg-purple-500" },
    ];

    // Convert extracted items to BillItem format
    const billItems: BillItem[] =
      data.items?.map((item: any, index: number) => ({
        id: `item-${index + 1}`,
        name: item.name || `Item ${index + 1}`,
        price: item.price || 0,
        quantity: item.quantity || 1,
        assignedTo: [], // Initially no one is assigned
      })) || [];

    // Create new bill from extracted data
    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      title: data.restaurant_name || "Extracted Receipt",
      date: data.date || new Date().toISOString().split("T")[0],
      items: billItems,
      people: bill.people.length > 0 ? bill.people : defaultPeople,
      tax: data.tax || 0,
      serviceCharge: data.service_charge || 0,
      discount: data.discount || 0,
    };

    setBill(newBill);
    setCurrentTab("items");
  };

  const handleFileUpload = (file: File) => {
    // This is now handled by the ReceiptUploader component
    console.log("File uploaded:", file.name);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* PWA Components - Now as modals, no layout shift */}
        <PWAStatus />
        <PWAInstaller />

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Bill Splitter</h1>
          <p className="text-gray-600">Split your bills easily with friends</p>
        </div>

        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="extracted" disabled={!extractedData}>
              Extracted
            </TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <ReceiptUploader onExtractedData={handleExtractedData} />
            <Card>
              <CardHeader>
                <CardTitle>Bill Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bill-title">Bill Title</Label>
                  <Input
                    id="bill-title"
                    value={bill.title}
                    onChange={(e) =>
                      setBill((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="bill-date">Date</Label>
                  <Input
                    id="bill-date"
                    type="date"
                    value={bill.date}
                    onChange={(e) =>
                      setBill((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extracted" className="space-y-4">
            {extractedData && (
              <ExtractedDataDisplay
                extractedData={extractedData}
                onCreateBill={convertExtractedDataToBill}
                onEditData={handleEditExtractedData}
              />
            )}
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  {bill.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.items.map((item) => (
                      <BillItemRow
                        key={item.id}
                        item={item}
                        people={bill.people}
                        onAssignToggle={handleAssignToggle}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="people" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter person's name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addPerson()}
                  />
                  <Button onClick={addPerson}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {bill.people.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center gap-2 p-2 border rounded"
                    >
                      <div className={`w-4 h-4 rounded-full ${person.color}`} />
                      <span>{person.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Charges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tax">Tax</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    value={bill.tax}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        tax: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="service">Service Charge</Label>
                  <Input
                    id="service"
                    type="number"
                    step="0.01"
                    value={bill.serviceCharge}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        serviceCharge: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={bill.discount}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        discount: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="grid md:grid-cols-2 gap-6">
            <BillSummary bill={bill} />
            <PersonSummary bill={bill} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
