// Service Worker for Push Notifications — MyCupid

self.addEventListener('push', function (event) {
  let data = { title: 'MyCupid', body: 'Voce tem uma novidade!', url: 'https://mycupid.com.br' };

  try {
    if (event.data) {
      data = Object.assign(data, event.data.json());
    }
  } catch (e) {
    // fallback to default data
  }

  const options = {
    body: data.body,
    icon: 'https://i.imgur.com/InmbjFb.png',
    badge: 'https://i.imgur.com/InmbjFb.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || 'https://mycupid.com.br' },
    actions: [
      { action: 'open', title: 'Abrir' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const url = event.notification.data?.url || 'https://mycupid.com.br';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes('mycupid') && 'focus' in clientList[i]) {
          clientList[i].navigate(url);
          return clientList[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
