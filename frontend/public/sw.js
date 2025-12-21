self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();
  event.waitUntil(clients.openWindow("https://localhost:3000"));
});

// Install event - cache essential resources
self.addEventListener("install", function (event) {
  console.log("Service worker installing...");
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches if needed
self.addEventListener("activate", function (event) {
  console.log("Service worker activating...");
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim());
});

// Image processing function
function processImageToGrayscale(imageData) {
  return new Promise((resolve) => {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext("2d");

    // Create ImageData from the input
    const imgData = new ImageData(
      imageData.data,
      imageData.width,
      imageData.height
    );

    // Convert to grayscale
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray; // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      // Alpha channel (i + 3) remains unchanged
    }

    // Put processed image data back
    ctx.putImageData(imgData, 0, 0);

    // Convert to blob
    canvas
      .convertToBlob({ type: "image/jpeg", quality: 0.9 })
      .then((blob) => resolve(blob));
  });
}

// Handle image processing messages
self.addEventListener("message", async function (event) {
  if (event.data.type === "PROCESS_IMAGE") {
    try {
      const { imageData } = event.data;

      // Process the image to grayscale
      const processedBlob = await processImageToGrayscale(imageData);

      // Send the processed image back to the client that sent the message
      event.source.postMessage({
        type: "IMAGE_PROCESSED",
        processedBlob: processedBlob,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      event.source.postMessage({
        type: "IMAGE_PROCESS_ERROR",
        error: error.message,
      });
    }
  }
});

// Fetch event - basic network-first strategy
self.addEventListener("fetch", function (event) {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(function () {
      // If network fails, you could return cached responses here
      // For now, just let the request fail naturally
      return new Response("Offline", {
        status: 503,
        statusText: "Service Unavailable",
      });
    })
  );
});
