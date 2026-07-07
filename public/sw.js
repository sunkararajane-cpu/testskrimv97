self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        image: data.image,
        badge: data.badge || '/icon.png',
        tag: data.tag,
        data: data.data,
        actions: data.actions
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url } = event.notification.data || {};
  
  if (event.action === 'remind_later') {
    // Send message to clients to schedule next reminder
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientsArr) => {
        clientsArr.forEach((client) => {
          client.postMessage({ type: 'REMIND_LATER' });
        });
      })
    );
    return;
  }

  if (url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientsArr) => {
        const hadWindowToFocus = clientsArr.some((windowClient) => {
          if (windowClient.url === url || windowClient.url.includes(url)) {
            windowClient.focus();
            return true;
          }
          return false;
        });

        if (!hadWindowToFocus) {
          clients.openWindow(url);
        }
      })
    );
  }
});
