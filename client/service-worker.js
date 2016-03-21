// Preloaded files that are only gotten from the cache when offline
const freshFiles = [
	'/',
	'/credits.html',
	'/js/main.js',
	'/css/base.css',
	'/css/checkbox.css',
	'/css/play-pause.css',
	'/css/sound.css'
];
const freshFileLookup = lookupFromArray(freshFiles);

// Preloaded files that are gotten from the cache
const staticFiles = [
	'/images/rain_bg.jpg',
	'/css/comfortaa.woff2',

	'/icons/weather/campfire.svg',
	'/icons/weather/crickets.svg',
	'/icons/weather/drizzle.svg',
	'/icons/weather/rain.svg',
	'/icons/weather/wind.svg',
	'/icons/weather/lightning.svg',

	'/audio/samples/campfire.ogg',
	'/audio/samples/crickets.ogg',
	'/audio/samples/drizzle.ogg',
	'/audio/samples/rain.ogg',
	'/audio/samples/wind.ogg',
	'/audio/samples/lightning.ogg'
];

// File that are gotten from the cache after being requested at least once
const lazyStaticFiles = [
	'/audio/full/campfire.ogg',
	'/audio/full/crickets.ogg',
	'/audio/full/drizzle.ogg',
	'/audio/full/rain.ogg',
	'/audio/full/wind.ogg',
	'/audio/full/lightning.ogg'
];
const lazyStaticFileLookup = lookupFromArray(lazyStaticFiles);


self.addEventListener('install', e => {
	e.waitUntil(
		Promise.all([
			caches.open('fresh_files').then(cache =>
				cache.addAll(freshFiles)
			),
			caches.open('static_files').then(cache =>
				cache.addAll(staticFiles)
			)
		]).then(() =>
			self.skipWaiting()
		)
	);
});

self.addEventListener('activate', e => {
	e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
	// if in the static file cache, return
	const {request} = e;
	const {pathname, host} = new URL(request.url);

	// Request to another origin
	if(location.host !== host) {
		return e.respondWith(fetch(request));
	}

	// Try to request fresh files every time
	// Fallback to cache
	if(freshFileLookup[pathname]) {
		console.log('fetch', pathname, freshFileLookup[pathname], JSON.stringify(pathname))
		return e.respondWith(
			caches.open('fresh_files').then(freshCache =>
				fetch(request.clone()).then(
					response => {
						console.log('fetchworked')
						freshCache.put(request, response.clone());
						return response;
					},
					fetchErr => freshCache.match(request)
				)
			)
		);
	}

	e.respondWith(
		caches.open('static_files').then(staticCache =>
			staticCache.match(request.clone()).then(response => {
				if(response) {
					return response;
				}

				if(lazyStaticFileLookup[pathname]) {
					staticCache.add(pathname);
				}

				return fetch(request);
			})
		)
	);
});


function lookupFromArray(arr) {
	const r = {};

	for(let i = 0; i < arr.length; i++) {
		const key = arr[i];
		r[key] = true;
	}

	return r;
}