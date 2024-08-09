/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

//export default null
export {};

const {clients, addEventListener} = self as ServiceWorkerGlobalScope
declare var self: ServiceWorkerGlobalScope
//declare var clients: Clients;

let VERSION = 'v0.1'
let CACHE_NAME = 'parcheesi-v0.3'
let urlsToCacheDuringInstall = [
	'/',
	'/bundle.js',
	'/manifest.json',
]

interface Window extends ServiceWorkerGlobalScope {
}

//=========================================================INSTALL======================================
// Triggers when sw doesn't exist or needs to be updated
self.addEventListener("install", event => {
	// Perform install steps. waitUntil accepts a promise
	// which - if resolves - the browser will know that installation was
	// successful. If the promise rejects, then install failed and this
	// server worker should be REJECTED !!!!!
	event.waitUntil(
		// .open opens or creates and open a cache with a given name
		// it saves request/response pairs
		caches.open(CACHE_NAME)
			.then(function (cache) {
				// cache.addAll is like a loop of cache.put for every request,
				// which is a promise as well, which can be returned.
				// It attempts to add every item from the list as request/response pair
				// It's "atomic" - if any of them fail, none are added
				// It uses "fetch" under the hood, so result may come from the regular browser cache.
				return cache.addAll(urlsToCacheDuringInstall)
			})
	)
	/*
	Inside of our install callback, we need to take the following steps:
	Open a cache.
	Cache our files.
	Confirm whether all the required assets are cached or not.
	*/
})
self.addEventListener("install", function (event) {
	event.waitUntil(
		Promise.all([
			self.skipWaiting(),
		])
	)
})

//=========================================================FETCH======================================
// Fetches will only kick in after the page is refreshed for the first time
// after 'install' registered service worker successfully.
self.addEventListener('fetch', function (event) {
	let originalURL = event.request.url;
	let cacheURL = originalURL
	if (/\?v\=[0-9]+$/.test(originalURL)) {
		// We want to keep a clean copy without a "?v=23400234" browser trick
		cacheURL = originalURL.replace(/\?v\=[0-9]+/, '')
		// Example:
		// http://localhost:8081/js/bundle.js?v=1591495256
		// http://localhost:8081/js/bundle.js
	}
	let supportsWebP = false
	if (event.request.headers.has('accept')) {
		supportsWebP = event.request.headers.get('accept').includes('webp')
	}
	if (supportsWebP) {
		if (/\.jpg$|.png$/.test(cacheURL)) {
			// Modify request to get webp instead of jpg & png
		}
	}
	if (event.request.headers.get('save-data')) {
		if (event.request.url.includes('fonts.gooleapis.com')) {
			// Return nothing is "Save-Data: on is turned
			event.respondWith(new Response('', {status: 417 /*the server cannot meet the requirements of the Expect request-header field*/,
				statusText: "Ignore fonts to save data."}))
		}
	}


	event.respondWith(
		// caches.match looks for request/response pair in the cache
		// it accepts either URL or request object. Returns a promise
		// if found or responds that resolves to "undefined", both can be caught by a single ".then".
		// It will be looking through all available caches, starting with the old

		// ignoreSearch: true ignores ?name=value stuff in the query.
		// so it is gonna match ANY of those, provided the name is the same... not always what you would want!
		caches.match(cacheURL, /*{ ignoreSearch: true }*/) //match(event.request)
			.then(function (response) {
				// Cache hit - return response
				if (response) {
					return response
				}

				// Request is a stream, can only be consumed once.
				let requestToCache = event.request.clone();

				// We try make the original HTTP request (via original URL)
				return fetch(originalURL /*requestToCache would be usually here*/).then(
					function (response) {

						// Check if we received a valid response
						if (!response || response.status !== 200 || response.type !== 'basic') {
							return response // Return error if it happens
						}

						// IMPORTANT: Clone the response. A response is a stream
						// and because we want the browser to consume the response
						// as well as the cache consuming the response, we need
						// to clone it so we have two streams.
						// Response is a stream, can only be consumed once, we are going to return original one soon,
						// so working on a clone within caching
						let responseToCache = response.clone();

						caches.open(CACHE_NAME) // Opens the cache by name
							.then(function (cache) {
								// cache.put places request/response pair into cache
								cache.put(cacheURL, responseToCache);  // but we save it as a cacheURL instead
							})

						return response
					}
				)
			})
	)

	// SW is acting like a proxy
	// if (/\.jpg$/.test(event.request.url)) {
	//   event.respondWith(fetch('/another/image.jpg', {
	//   	mode: "no-cors"
	//   }))
	// }

	// event.respondWith(new Response('<b>Hi</b>', {
	//   headers: {'Content-Type': 'text/html'}
	// }))

	// ===================================== GOTCHA ==============================================================
	// fetch EMULATES BROWSER REQUEST, so results might come from cache!
	// event.respondWith(fetch(event.request))

	// event.respondWith(fetch(event.request).then(function (response) {
	//   if (response.status == 404) {
	//     // This is when the URL of destination is not found
	//     return fetch('/url-to-404.png')
	//     // return new Response('404')
	//   }
	//   return response
	// }).catch(function () {
	//   return new Response('No connection to server / offline!')
	//   })
	// )

	// fetch('/index.html').then(function(response) {
	//   return response.body
	// }).then(function(data) {
	//   console.log(data)
	//   // We now have data
	// }).catch(function () {
	//   // Do something about it
	// })


})

// All previous service workers are gone (pages that use it) and now
// this service worker can become active. It's a perfect time
// to delete all old caches, so that page refresh will return
// everything that THIS service worker got during its INSTALL.
self.addEventListener('activate', function (event) {
	let cacheWhitelist = [CACHE_NAME];
	event.waitUntil(
		Promise.all([
			// Getting all the names of saved caches, both old and just recently
			// installed.
			caches.keys().then(function (allStoredCacheNames) {
				// Promise.all waits for completion of all promises
				return Promise.all(
					allStoredCacheNames.filter(function (v) {
						return cacheWhitelist.indexOf(v) < 0
					}).map(function (el) {
						// console.log("from", CACHE_NAME, "deleting", el)
						// TODO: This seems to be happening before any "fetch" of the new version
						// TODO: So what happens is that all new items haven't yet been cached
						// They will only cache when "fetch" goes through.
						return caches.delete(el)
					})
					// allStoredCacheNames.map(function(cacheName) {
					//   if (cacheWhitelist.indexOf(cacheName) === -1) {
					//     return caches.delete(cacheName);
					//   }
					//   return null
					// })
				)
			})

			,

			event.waitUntil(self.clients.claim())


		])
	)
})

self.addEventListener('message', function (event) {
	if ('skipWaiting' in event.data) {
		self.skipWaiting() // Newest version is calling this to take control over the page
	}
})

/*
declare var self: DedicatedWorkerGlobalScope;
export {};

declare var self: ServiceWorkerGlobalScope;
export {};
*/