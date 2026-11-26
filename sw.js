/* sw.js - Service Worker untuk Data Warga 01 (Web Push / FCM + Notifikasi & Suara) */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const SW_VERSION = "rt01-v1.0.2";
const DEFAULT_ICON = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#065f46"/><path fill="#a7f3d0" d="M256 112L96 240h48v160h96V288h32v112h96V240h48L256 112z"/></svg>'
);

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyDCXX6xk8C3WvAUAw1iy_qDO228MQ0ejIs",
    authDomain: "data-warga-rt01-8df1b.firebaseapp.com",
    databaseURL: "https://data-warga-rt01-8df1b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "data-warga-rt01-8df1b",
    storageBucket: "data-warga-rt01-8df1b.firebasedatabase.app",
    messagingSenderId: "234498037736",
    appId: "1:234498037736:web:3ea00385620d712342365d"
  });
}

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (_) {
  messaging = null;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

if (messaging && typeof messaging.onBackgroundMessage === "function") {
  messaging.onBackgroundMessage((payload) => {
    const notifData = payload?.notification || {};
    const extraData = payload?.data || {};

    const title = notifData.title || extraData.title || "Data Warga 01";
    const body = notifData.body || extraData.body || "Ada pembaruan data terbaru dari Pengurus RT.";
    const targetUrl = extraData.url || "./";

    const options = {
      body,
      icon: extraData.icon || DEFAULT_ICON,
      badge: extraData.badge || DEFAULT_ICON,
      tag: extraData.tag || "rt01-notif",
      renotify: true,
      vibrate: [200, 100, 200],
      silent: false,
      data: {
        url: targetUrl,
        sound: extraData.sound || "default"
      }
    };

    return self.registration.showNotification(title, options);
  });
}

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
      icon: parsed.icon || DEFAULT_ICON,
      badge: parsed.badge || DEFAULT_ICON,
      tag: parsed.tag || "rt01-push",
      renotify: true,
      vibrate: [200, 100, 200],
      silent: false,
      data: { url: parsed.url || "./" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "./";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client && client.url !== targetUrl) {
            client.navigate(targetUrl).catch(() => {});
          }
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
