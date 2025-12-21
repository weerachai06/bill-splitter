import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const model = '@cf/meta/llama-3.2-11b-vision-instruct';

    if (!accountId || !apiToken) {
      return NextResponse.json({ error: 'Cloudflare credentials not configured' }, { status: 500 });
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

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'status', message: 'Processing image...' })}\n\n`
            )
          );

          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: prompt,
                      },
                      {
                        type: 'image_url',
                        image_url: {
                          url: `data:${file.type};base64,${base64}`,
                        },
                      },
                    ],
                  },
                ],
                stream: true,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ type: 'error', message: 'Failed to process image' })}\n\n`
              )
            );
            controller.close();
            return;
          }

          if (!response.body) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ type: 'error', message: 'No response body' })}\n\n`
              )
            );
            controller.close();
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Process final buffer and close
              if (buffer.trim()) {
                try {
                  // Clean up the response
                  const cleanResponse = buffer
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();
                  
                  const extractedData = JSON.parse(cleanResponse);
                  
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ type: 'complete', data: extractedData })}\n\n`
                    )
                  );
                } catch (parseError) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ 
                        type: 'error', 
                        message: 'Failed to parse response',
                        rawResponse: buffer 
                      })}\n\n`
                    )
                  );
                }
              }
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            
            // Parse SSE format from Cloudflare
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.response) {
                    buffer += parsed.response;
                    // Send progressive update
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({ 
                          type: 'progress', 
                          content: parsed.response,
                          buffer: buffer
                        })}\n\n`
                      )
                    );
                  }
                } catch (e) {
                  // Ignore parsing errors for individual chunks
                }
              }
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'error', message: 'Stream processing failed' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Receipt extraction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}