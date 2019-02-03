const VER = 16;
const CACHE_NAME = 'JournalApp.v.'+VER;

const TO_CACHE = ['/'];

self.addEventListener('install', event => {
    event.waitUntil(new Promise((resolve, reject) => {
        caches
            .open(CACHE_NAME)
            .then(cache => {
                return fetch('./resources-manifest.json')
                    .then(resp => resp.json())
                    .then(json => {
                        var res = TO_CACHE;
                        Object.keys(json).map(key => res.push('/'+json[key]));
                        cache.addAll(res);
                    })
                    .then(resolve);
            })
            .catch(err => {
                console.log('Service Worker errors', err);
            });
    }));
});

self.addEventListener('activate', function onActivate(event) {
    event.waitUntil(
        caches.keys().then(keys => {
            return keys
                .filter(key => key.includes('JournalApp') && key !== CACHE_NAME)
                .forEach(key => caches.delete(key));
        })
    );
});


self.addEventListener('fetch', function onFetch(event) {
    if (event.request.url.indexOf(location.origin) === 0) {
        if (event.request.mode === 'navigate') {
            let clonedRequest = event.request.clone();

            event.respondWith(
                fetch(event.request)
                    .catch(() => caches.match(clonedRequest))
                    .then(resp => resp || caches.match(clonedRequest.url))
                    .then(resp => resp || caches.match('/'))
            )
        } else {
            event.respondWith(networkOrCache(event));
        }
    }
});

function networkOrCache(event) {
    const clonedRequest = event.request.clone();
    return fetch(event.request)
        .catch(err => caches.match(clonedRequest))
        .then(resp => resp || caches.match(clonedRequest.url));
}