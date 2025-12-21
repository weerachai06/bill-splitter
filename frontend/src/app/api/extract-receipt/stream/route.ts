import { type NextRequest, NextResponse } from "next/server";

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

    const prompt =
      "Analyze this receipt/bill image and extract the following information in JSON format:\n" +
      "{\n" +
      '  "restaurant_name": "Name of the restaurant or establishment",\n' +
      '  "date": "Date in YYYY-MM-DD format",\n' +
      '  "items": [\n' +
      "    {\n" +
      '      "name": "Item name",\n' +
      '      "price": number,\n' +
      '      "quantity": number\n' +
      "    }\n" +
      "  ],\n" +
      '  "tax": number,\n' +
      '  "service_charge": number,\n' +
      '  "discount": number,\n' +
      '  "total": number,\n' +
      '  "currency": "Currency code (e.g., THB, USD)"\n' +
      " Should support thai language if the bill is the thai language" +
      "}";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(
              'data: {"type": "status", "message": "Starting analysis..."}\n\n'
            )
          );

          // Check for required environment variables
          if (
            !process.env.CLOUDFLARE_ACCOUNT_ID ||
            !process.env.CLOUDFLARE_API_TOKEN
          ) {
            throw new Error("Missing Cloudflare credentials");
          }

          controller.enqueue(
            encoder.encode(
              'data: {"type": "progress", "message": "Processing with Cloudflare AI..."}\n\n'
            )
          );

          const imageData = `data:image/jpeg;base64,${base64}`;

          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: prompt },
                      { type: "image_url", image_url: { url: imageData } },
                    ],
                  },
                ],
                max_tokens: 1000,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `API Error: ${response.status} ${response.statusText} - ${errorText}`
            );
          }

          controller.enqueue(
            encoder.encode(
              'data: {"type": "progress", "message": "Extracting receipt data..."}\n\n'
            )
          );

          const result = (await response.json()) as any;
          const content =
            result.result?.response ||
            result.choices?.[0]?.message?.content ||
            result;

          // Send completion message
          controller.enqueue(
            encoder.encode(
              `data: {"type": "complete", "data": ${JSON.stringify(content)}}\n\n`
            )
          );
        } catch (error) {
          console.error("Stream error:", error);
          const encoder = new TextEncoder();
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              `data: {\"type\": \"error\", \"message\": \"${errorMsg}\"}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
