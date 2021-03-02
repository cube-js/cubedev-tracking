const uuidv4  = require( 'uuid/v4');


let flushPromise = null;
let trackEvents = [];
let baseProps = {};

const COOKIE_ID = "cubedev_anonymous";
const COOKIE_DOMAIN = ".cube.dev";
const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year
let clientAnonymousId = undefined;

const track = async (event) => {
  if(!clientAnonymousId){
    window.console.log("waite clientAnonymousId from iframe")
    return setTimeout(track, 1000, event)
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

window.onmessage = function(event){
  console.log("get clientAnonymousId:", event.data)
  clientAnonymousId = event.data.clientAnonymousId

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

};

const cubeTrackFrame = document.createElement('iframe');
// cubeTrackFrame.sandbox="allow-scripts"
cubeTrackFrame.setAttribute('src','https://cube.dev/cubedev-tracking/id.html');
document.body.appendChild(cubeTrackFrame);
