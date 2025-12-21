import { env } from "cloudflare:workers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const stream = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      prompt: `Analyze this receipt/bill image and extract the following information in JSON format:
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
    })
      `,
      images: [{ type: "base64", data: base64 }],
      stream: true,
    });


    return new Response(stream, {
      headers: { "content-type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
