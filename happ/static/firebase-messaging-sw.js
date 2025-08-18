/* /firebase-messaging-sw.js (served from your site root) */
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Minimal init in the SW (messagingSenderId is enough for v8)
firebase.initializeApp({
  messagingSenderId: '921372015026'
});

const messaging = firebase.messaging();

// Show a notification for background/data-only messages
messaging.setBackgroundMessageHandler(function (payload) {
  console.log('[SW] background message:', payload);
  const notif = payload.notification || {};
  const title = notif.title || 'CURA Reminder';
  const options = {
    body: notif.body || 'You have a scheduled reminder.',
    icon: notif.icon || '/static/assets/images/bell.png',
    data: payload.data || {},            // so we can navigate on click
  };
  return self.registration.showNotification(title, options);
});

// Optional: focus/open a tab when user clicks the notification
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const target = (event.notification?.data?.click_action) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const c of clientsArr) {
        if (c.url.includes(target) && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
