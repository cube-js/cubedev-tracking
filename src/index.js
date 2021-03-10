import cookie from 'component-cookie';
import uuidv4 from 'uuid/v4';
import topDomain from './topDomain'

let flushPromise = null;
let trackEvents = [];
let baseProps = {};

const COOKIE_ID = "cubedev_anonymous";
const topDomainValue = topDomain(window.location.href);
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
