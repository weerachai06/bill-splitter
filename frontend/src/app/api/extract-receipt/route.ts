import { env } from "cloudflare:workers";
import { type NextRequest, NextResponse } from "next/server";

interface CloudflareAIResponse {
  result: {
    response: string;
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = Array.from(uint8Array)
      .map((byte) => String.fromCharCode(byte))
      .join("");

    const base64 = btoa(binaryString);

    const prompt = `Analyze this receipt/bill image and extract the following information in JSON format:
    {
      "restaurant_name": "Name of the restaurant or establishment",
      "date": "Date in YYYY-MM-DD format",
      "items": [
        {
          "name": "Item name",
          "price": number,
          "quantity": number
        }
      ],
      "tax": number,
      "service_charge": number,
      "discount": number,
      "total": number,
      "currency": "Currency code (e.g., THB, USD)"
    }

    Extract all menu items, prices, and calculate totals. If any information is not available, use 0 for numbers and appropriate defaults for strings.`;

    const messages = [
      { role: "system", content: "You are a ocr expert." },
      { role: "user", content: prompt },
    ];

    // Replace this with your image data encoded as base64 or a URL
    const imageBase64 = `data:image/png;base64,${base64}`;

    const response = await env.AI.run(
      "@cf/meta/llama-3.2-11b-vision-instruct",
      {
        messages,
        image: imageBase64,
      }
    );

    return Response.json(response);
  } catch (error) {
    console.error("Receipt extraction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
