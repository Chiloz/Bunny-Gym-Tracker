// Service Worker for Bunny's Gym Record PWA
const CACHE_NAME = 'bunny-gym-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch with fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Ready for gym today Bunny? 🐰💪';
  event.waitUntil(
    self.registration.showNotification("Bunny's Gym Record", {
      body: data,
      icon: 'https://api.iconify.design/lucide:dumbbell.svg?color=%23059669',
      badge: 'https://api.iconify.design/lucide:dumbbell.svg?color=%23059669'
    })
  );
});
