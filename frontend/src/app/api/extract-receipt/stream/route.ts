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
      "}";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                prompt,
                images: [{ type: "base64", data: base64 }],
                stream: true,
              }),
            }
          );

          if (!response.body) {
            throw new Error("No response body");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
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
