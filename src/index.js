import uuidv4 from 'uuid/v4';

let flushPromise = null;
let trackEvents = [];
let baseProps = {};
let clientAnonymousId = undefined;

const track = async (event) => {
  if(!clientAnonymousId){
    return setTimeout(track, 500, event)
  }

  trackEvents.push({
    ...baseProps,
    ...event,
    referrer: document.referrer,
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
  track({ event: 'identify', email: email });
};

export const event = (name, params) => {
  track({ event: name, ...params });
};

export const page = (params) => {
  track({ event: 'page', ...params });
};


window.addEventListener("message", function(event){
  if(event.data && event.data.clientAnonymousId ){
    clientAnonymousId = event.data.clientAnonymousId
  }
}, { passive: true });

const cubeTrackFrame = document.createElement('iframe');
cubeTrackFrame.setAttribute('src','http://localhost:8000/scripts/id.js');
cubeTrackFrame.style.display = 'none'
document.body.appendChild(cubeTrackFrame);
