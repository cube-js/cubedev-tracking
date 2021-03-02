(function () {
	'use strict';

	function createCommonjsModule(fn) {
	  var module = { exports: {} };
		return fn(module, module.exports), module.exports;
	}

	var rngBrowser = createCommonjsModule(function (module) {
	// Unique ID creation requires a high quality random # generator.  In the
	// browser this is a little complicated due to unknown quality of Math.random()
	// and inconsistent support for the `crypto` API.  We do the best we can via
	// feature-detection

	// getRandomValues needs to be invoked in a context where "this" is a Crypto
	// implementation. Also, find the complete implementation of crypto on IE11.
	var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
	                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

	if (getRandomValues) {
	  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
	  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

	  module.exports = function whatwgRNG() {
	    getRandomValues(rnds8);
	    return rnds8;
	  };
	} else {
	  // Math.random()-based (RNG)
	  //
	  // If all else fails, use Math.random().  It's fast, but is of unspecified
	  // quality.
	  var rnds = new Array(16);

	  module.exports = function mathRNG() {
	    for (var i = 0, r; i < 16; i++) {
	      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
	      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
	    }

	    return rnds;
	  };
	}
	});

	/**
	 * Convert array of 16 byte values to UUID string format of the form:
	 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	 */
	var byteToHex = [];
	for (var i = 0; i < 256; ++i) {
	  byteToHex[i] = (i + 0x100).toString(16).substr(1);
	}

	function bytesToUuid(buf, offset) {
	  var i = offset || 0;
	  var bth = byteToHex;
	  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
	  return ([
	    bth[buf[i++]], bth[buf[i++]],
	    bth[buf[i++]], bth[buf[i++]], '-',
	    bth[buf[i++]], bth[buf[i++]], '-',
	    bth[buf[i++]], bth[buf[i++]], '-',
	    bth[buf[i++]], bth[buf[i++]], '-',
	    bth[buf[i++]], bth[buf[i++]],
	    bth[buf[i++]], bth[buf[i++]],
	    bth[buf[i++]], bth[buf[i++]]
	  ]).join('');
	}

	var bytesToUuid_1 = bytesToUuid;

	function v4(options, buf, offset) {
	  var i = buf && offset || 0;

	  if (typeof(options) == 'string') {
	    buf = options === 'binary' ? new Array(16) : null;
	    options = null;
	  }
	  options = options || {};

	  var rnds = options.random || (options.rng || rngBrowser)();

	  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
	  rnds[6] = (rnds[6] & 0x0f) | 0x40;
	  rnds[8] = (rnds[8] & 0x3f) | 0x80;

	  // Copy bytes to buffer, if provided
	  if (buf) {
	    for (var ii = 0; ii < 16; ++ii) {
	      buf[i + ii] = rnds[ii];
	    }
	  }

	  return buf || bytesToUuid_1(rnds);
	}

	var v4_1 = v4;

	let flushPromise = null;
	let trackEvents = [];
	let baseProps = {};

	const COOKIE_ID = "cubedev_anonymous";
	const COOKIE_DOMAIN = ".cube.dev";
	const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

	function getCookie(name) {
	  var matches = document.cookie.match(new RegExp(
	    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	  ));
	  const res = matches ? decodeURIComponent(matches[1]) : undefined;
	  window.console.log(`getCookie: ${name}`, res);
	  debugger
	  return res;
	}

	function setCookie(name, value, options) {

	  window.console.log(`setCookie: ${name} = ${value}`, options);
	  const encode = function(value){
	    try {
	      return encodeURIComponent(value);
	    } catch (e) {
	      debug('error `encode(%o)` - %o', value, e);
	    }
	  };
	  options = options || {};
	  var str = encode(name) + '=' + encode(value);

	  if (null == value) options.maxage = -1;

	  if (options.maxage) {
	    options.expires = new Date(+new Date + options.maxage);
	  }

	  if (options.path) str += '; path=' + options.path;
	  if (options.domain) str += '; domain=' + options.domain;
	  if (options.expires) str += '; expires=' + options.expires.toUTCString();
	  if (options.secure) str += '; secure';
	  if (options.sameSite) str += '; SameSite=' + options.sameSite;

	  document.cookie = str;
	}

	const track = async (event) => {
	  // debugger
	  if (!getCookie(COOKIE_ID)) {
	    setCookie(COOKIE_ID, v4_1(), { domain: COOKIE_DOMAIN, maxage: MAX_AGE, sameSite: 'None', secure:true, path:'/' });
	  }
	  trackEvents.push({
	    ...baseProps,
	    ...event,
	    referrer: document.referrer,
	    ...window.location,
	    id: v4_1(),
	    clientAnonymousId: getCookie(COOKIE_ID),
	    clientTimestamp: new Date().toJSON()
	  });
	  const flush = async (toFlush, retries) => {
	    if (!toFlush) {
	      toFlush = trackEvents;
	      trackEvents = [];
	    }
	    if (!toFlush.length) {
	      return null;
	    }
	    if (retries == null) {
	      retries = 10;
	    }
	    try {
	      const sentAt = new Date().toJSON();
	      const result = await fetch('https://track.cube.dev/track', {
	        method: 'post',
	        body: JSON.stringify(toFlush.map(r => ({ ...r, sentAt }))),
	        headers: { 'Content-Type': 'application/json' },
	      });
	      if (result.status !== 200 && retries > 0) {
	        return flush(toFlush, retries - 1);
	      }
	      // console.log(await result.json());
	    } catch (e) {
	      if (retries > 0) {
	        return flush(toFlush, retries - 1);
	      }
	      // console.log(e);
	    }
	    return null;
	  };
	  const currentPromise = (flushPromise || Promise.resolve()).then(() => flush()).then(() => {
	    if (currentPromise === flushPromise) {
	      flushPromise = null;
	    }
	  });
	  flushPromise = currentPromise;
	  return flushPromise;
	};

	 const setAnonymousId = (anonymousId, props) => {
	  baseProps = props;
	  track({ event: 'identify', anonymousId, ...props });
	};

	 const page = (params) => {
	  track({ event: 'page', ...params });
	};


	if(!window.cubeTrack){
	  window.cubeTrack = {};
	}

	const cubeTrack = {};
	Object.defineProperty(cubeTrack, "page", {
	  set: function(value) {
	    page(value);
	  }
	});
	Object.defineProperty(cubeTrack, "anonymous", {
	  set: function(value) {
	    setAnonymousId(value.id, {
	      email:value.email,
	      displayName: value.displayName
	    });
	  }
	});

	window.onmessage = function(event){
	  debugger
	  console.log("onmessage:", event.data);

	  if(window.cubeTrack.page){
	    page(window.cubeTrack.page);
	  }

	  if(window.cubeTrack.anonymous){
	    setAnonymousId(window.cubeTrack.anonymous.id, {
	      email:window.cubeTrack.anonymous.email,
	      displayName: window.cubeTrack.anonymous.displayName
	    });
	  }

	  window.cubeTrack = cubeTrack;

	};

	const cubeTrackFrame = document.createElement('iframe');
	// cubeTrackFrame.sandbox="allow-scripts"
	cubeTrackFrame.setAttribute('src','https://cube.dev/cubedev-tracking/id.html');
	document.body.appendChild(cubeTrackFrame);

	var src = {

	};

	return src;

}());
