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

    const prompt = `Extract information from this bill/receipt. 
      Return ONLY a JSON object with these keys:
      - vendor_name (string)
      - date (string)
      - items (array of {name, price})
      - total_amount (number)
      - tax_amount (number)
      Please handle Thai language correctly.`;

    // Check for required environment variables
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Missing Google AI API key" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = (await response.json()) as any;

    // Extract text from Gemini response structure
    let content = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Remove markdown formatting if present
    content = content.replace(/```json\s*|\s*```/g, "").trim();

    // Parse the cleaned JSON
    let parsedContent: any;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      // If direct parsing fails, try to extract JSON object
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in response");
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedContent,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
