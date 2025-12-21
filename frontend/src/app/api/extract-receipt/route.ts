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
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const model = "@cf/meta/llama-3.2-11b-vision-instruct";

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "Cloudflare credentials not configured" },
        { status: 500 }
      );
    }

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

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${file.type};base64,${base64}`,
                  },
                },
              ],
            },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudflare AI error:", errorText);
      return NextResponse.json(
        { error: "Failed to process image with Cloudflare AI" },
        { status: response.status }
      );
    }

    const data: CloudflareAIResponse = await response.json();

    if (!data.success) {
      console.error("Cloudflare AI response errors:", data.errors);
      return NextResponse.json(
        { error: "AI processing failed", details: data.errors },
        { status: 500 }
      );
    }

    // Try to parse the AI response as JSON
    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let extractedData;
    try {
      // Clean up the response - sometimes AI returns markdown formatted JSON
      const cleanResponse = data.result.response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      extractedData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", data.result.response);
      return NextResponse.json(
        {
          error: "Failed to parse extracted data",
          rawResponse: data.result.response,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      rawResponse: data.result.response,
    });
  } catch (error) {
    console.error("Receipt extraction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
