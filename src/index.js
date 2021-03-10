import cookie from 'component-cookie';
import uuidv4 from 'uuid/v4';

let flushPromise = null;
let trackEvents = [];
let baseProps = {};

const getLevels = hostname => {
  const parts = hostname.split('.');
  const last = parts[parts.length - 1];
  const levels = [];

  // Ip address.
  if (parts.length === 4 && last === parseInt(last, 10)) return levels;
  // Localhost.
  if (parts.length <= 1) return levels;
  // Create levels.
  for (let i = parts.length - 2; i >= 0; --i) {
    levels.push(parts.slice(i).join('.'));
  }

  return levels;
};

const topDomain = hostname =>  {
  const levels = getLevels(hostname);
  // Lookup the real top level one.
  for (var i = 0; i < levels.length; ++i) {
    const cname = '__tld__';
    const domain = levels[i];
    const opts = { domain: '.' + domain };

    cookie(cname, 1, opts);
    if (cookie(cname)) {
      cookie(cname, null, opts);
      return domain;
    }
  }

  return '';
};

const COOKIE_ID = "cubedev_anonymous";
const topDomainValue = topDomain(window.location.hostname);
const COOKIE_DOMAIN = topDomainValue ? '.' + topDomainValue : window.location.hostname;
const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

const track = async (event) => {
  if (!cookie(COOKIE_ID)) {
    cookie(COOKIE_ID, uuidv4(), { domain: COOKIE_DOMAIN, maxage: MAX_AGE });
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

export const setAnonymousId = (anonymousId, props) => {
  baseProps = props;
  track({ event: 'identify', anonymousId, ...props });
};

export const identify = (email) => {
  track({ event: 'identify', email: email });
};

export const event = (name, params) => {
  track({ event: name, ...params });
};

export const page = (params) => {
  track({ event: 'page', ...params });
};
