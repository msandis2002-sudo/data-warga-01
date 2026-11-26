/* sw.js - Service Worker untuk Data Warga 01 (Web Push / FCM + Notifikasi & Suara) */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const SW_VERSION = "rt01-v1.0.0";

// GANTI nilai di bawah ini dengan Firebase Config dari Project Settings -> General -> Your apps (Web)
firebase.initializeApp({
  apiKey: "AIzaSyDCXX6xk8C3WvAUAw1iy_qDO228MQ0ejIs",
  authDomain: "data-warga-rt01-8df1b.firebaseapp.com",
  databaseURL: "https://data-warga-rt01-8df1b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "data-warga-rt01-8df1b",
  storageBucket: "data-warga-rt01-8df1b.firebasedatabase.app",
  messagingSenderId: "234498037736",
  appId: "1:234498037736:web:3ea00385620d712342365d"
});

const messaging = firebase.messaging();

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Menangani pesan push dari FCM saat aplikasi/browser tertutup atau di latar belakang
messaging.onBackgroundMessage((payload) => {
  const notifData = payload.notification || {};
  const extraData = payload.data || {};

  const title = notifData.title || extraData.title || "Data Warga 01";
  const body = notifData.body || extraData.body || "Ada pembaruan data terbaru dari Pengurus RT.";
  const targetUrl = extraData.url || "./";

  const options = {
    body,
    icon: extraData.icon || "./icon-192.png",
    badge: extraData.badge || "./icon-192.png",
    tag: extraData.tag || "rt01-notif",
    renotify: true,
    vibrate: [200, 100, 200],
    // Catatan: pada sebagian besar browser/OS, suara notifikasi sistem diatur oleh OS/channel;
    // 'silent: false' memastikan notifikasi tidak disenyapkan paksa oleh browser.
    silent: false,
    data: {
      url: targetUrl,
      sound: extraData.sound || "default"
    }
  };

  return self.registration.showNotification(title, options);
});

// Fallback jika ada push mentah (non-FCM payload) masuk ke Service Worker
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let parsed = {};
  try {
    parsed = event.data.json();
  } catch (_) {
    parsed = { title: "Data Warga 01", body: event.data.text() };
  }

  if (parsed.notification || (parsed.data && parsed.data.title)) return;

  const title = parsed.title || "Data Warga 01";
  const body = parsed.body || "Ada pembaruan informasi RT.";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "./icon-192.png",
      vibrate: [200, 100, 200],
      silent: false,
      data: { url: parsed.url || "./" }
    })
  );
});

// Saat notifikasi diklik: buka atau fokuskan aplikasi Data Warga 01
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "./";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
