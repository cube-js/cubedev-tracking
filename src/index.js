const cookie = require('component-cookie');
const uuidv4  = require( 'uuid/v4');


let flushPromise = null;
let trackEvents = [];
let baseProps = {};

const COOKIE_ID = "cubedev_anonymous";
const COOKIE_DOMAIN = ".cube.dev";
const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

function setCookie(name, value, options) {

  const encode = function(value){
    try {
      return encodeURIComponent(value);
    } catch (e) {
      debug('error `encode(%o)` - %o', value, e)
    }
  }
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
  debugger
  if (!cookie(COOKIE_ID)) {
    setCookie(COOKIE_ID, uuidv4(), { domain: COOKIE_DOMAIN, maxage: MAX_AGE, sameSite: 'None', secure:true });
  }
  trackEvents.push({
    ...baseProps,
    ...event,
    referrer: document.referrer,
    ...window.location,
    id: uuidv4(),
    clientAnonymousId: cookie(COOKIE_ID),
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

 const identify = (email) => {
  track({ event: 'identify', email: email });
};

 const event = (name, params) => {
  track({ event: name, ...params });
};

 const page = (params) => {
  track({ event: 'page', ...params });
};


if(!window.cubeTrack){
  window.cubeTrack = {}
}

const cubeTrack = {}
Object.defineProperty(cubeTrack, "page", {
  set: function(value) {
    page(value)
  }
});
Object.defineProperty(cubeTrack, "anonymous", {
  set: function(value) {
    setAnonymousId(value.id, {
      email:value.email,
      displayName: value.displayName
    })
  }
});

if(window.cubeTrack.page){
  page(window.cubeTrack.page)
}

if(window.cubeTrack.anonymous){
  setAnonymousId(window.cubeTrack.anonymous.id, {
    email:window.cubeTrack.anonymous.email,
    displayName: window.cubeTrack.anonymous.displayName
  })
}

window.cubeTrack = cubeTrack
