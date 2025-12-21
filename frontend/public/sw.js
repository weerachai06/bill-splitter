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
