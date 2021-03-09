/* globals window, fetch */
import uuidv4 from 'uuid/v4';

const COOKIE_ID = 'cubedev_anonymous';
const COOKIE_DOMAIN = '.cube.dev';
const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

let flushPromise = null;
let trackEvents = [];
let baseProps = {};
let clientAnonymousId;
const getCookie = name => {
  const matches = window.document.cookie.match(new RegExp(
    `(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)` // eslint-disable-line
  ));
  const res = matches ? decodeURIComponent(matches[1]) : undefined;
  return res;
};

const setCookie = (name, value, options) => {
  const encode = v => {
    try {
      return encodeURIComponent(v);
    } catch (e) {
      return '';
    }
  };
  options = options || {};
  let str = `${encode(name)}=${encode(value)}`;

  if (value == null) options.maxage = -1;

  if (options.maxage) {
    options.expires = new Date(+new Date() + options.maxage);
  }

  if (options.path) str += `; path=${options.path}`;
  if (options.domain) str += `; domain=${options.domain}`;
  if (options.expires) str += `; expires=${options.expires.toUTCString()}`;
  if (options.secure) str += '; secure';
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;

  window.document.cookie = str;
};

const track = async (event) => {
  if (!clientAnonymousId) {
    return setTimeout(track, 500, event);
  }

  trackEvents.push({
    ...baseProps,
    ...event,
    referrer: window.document.referrer,
    ...window.location,
    id: uuidv4(),
    clientAnonymousId,
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

export const setAnonymousId = (anonymousId, props) => {
  baseProps = props;
  track({ event: 'identify', anonymousId, ...props });
};

export const identify = (email) => {
  track({ event: 'identify', email });
};

export const event = (name, params) => {
  track({ event: name, ...params });
};

export const page = (params) => {
  track({ event: 'page', ...params });
};

clientAnonymousId = getCookie(COOKIE_ID);
if (!clientAnonymousId) {
  fetch("https://test-cookie.comet-server.com", {
    credentials: 'include',
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
    .then(async response => {
      let answer = await response.json()
      console.log(answer)
      clientAnonymousId = answer.id
      setCookie(COOKIE_ID, clientAnonymousId, {
        maxage: MAX_AGE,
        secure: true,
        sameSite: 'None'
      });
    });
}

//
// if (window.location.host === 'cube.dev') {
//
//   clientAnonymousId = getCookie(COOKIE_ID);
//   if (!clientAnonymousId) {
//     clientAnonymousId = uuidv4();
//     setCookie(COOKIE_ID, clientAnonymousId, {
//       domain: COOKIE_DOMAIN, maxage: MAX_AGE, secure: true, sameSite: 'None'
//     });
//   }
// } else {
//   window.addEventListener('message', (e) => {
//     if (e.data && e.data.clientAnonymousId) {
//       clientAnonymousId = e.data.clientAnonymousId;
//     }
//   }, { passive: true });
//
//   const cubeTrackFrame = window.document.createElement('iframe');
//   cubeTrackFrame.setAttribute('src', 'https://cube.dev/docs/scripts/track.html');
//   cubeTrackFrame.style.display = 'none';
//   window.document.body.appendChild(cubeTrackFrame);
// }
