"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.page = exports.event = exports.identify = exports.setAnonymousId = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _v = _interopRequireDefault(require("uuid/v4"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var flushPromise = null;
var trackEvents = [];
var baseProps = {};
var clientAnonymousId;

var getCookie = function getCookie(name) {
  var matches = window.document.cookie.match(new RegExp("(?:^|; )".concat(name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1'), "=([^;]*)") // eslint-disable-line
  ));
  var res = matches ? decodeURIComponent(matches[1]) : undefined;
  return res;
};

var setCookie = function setCookie(name, value, options) {
  var encode = function encode(v) {
    try {
      return encodeURIComponent(v);
    } catch (e) {
      return '';
    }
  };

  options = options || {};
  var str = "".concat(encode(name), "=").concat(encode(value));
  if (value == null) options.maxage = -1;

  if (options.maxage) {
    options.expires = new Date(+new Date() + options.maxage);
  }

  if (options.path) str += "; path=".concat(options.path);
  if (options.domain) str += "; domain=".concat(options.domain);
  if (options.expires) str += "; expires=".concat(options.expires.toUTCString());
  if (options.secure) str += '; secure';
  if (options.sameSite) str += "; SameSite=".concat(options.sameSite);
  window.document.cookie = str;
};

var track = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(event) {
    var flush, currentPromise;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (clientAnonymousId) {
              _context2.next = 2;
              break;
            }

            return _context2.abrupt("return", setTimeout(track, 500, event));

          case 2:
            trackEvents.push(_objectSpread(_objectSpread(_objectSpread(_objectSpread({}, baseProps), event), {}, {
              referrer: window.document.referrer
            }, window.location), {}, {
              id: (0, _v["default"])(),
              clientAnonymousId: clientAnonymousId,
              clientTimestamp: new Date().toJSON()
            }));

            flush = /*#__PURE__*/function () {
              var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(toFlush, retries) {
                var sentAt, result;
                return _regenerator["default"].wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!toFlush) {
                          toFlush = trackEvents;
                          trackEvents = [];
                        }

                        if (toFlush.length) {
                          _context.next = 3;
                          break;
                        }

                        return _context.abrupt("return", null);

                      case 3:
                        if (retries == null) {
                          retries = 10;
                        }

                        _context.prev = 4;
                        sentAt = new Date().toJSON();
                        _context.next = 8;
                        return fetch('https://track.cube.dev/track', {
                          method: 'post',
                          body: JSON.stringify(toFlush.map(function (r) {
                            return _objectSpread(_objectSpread({}, r), {}, {
                              sentAt: sentAt
                            });
                          })),
                          headers: {
                            'Content-Type': 'application/json'
                          }
                        });

                      case 8:
                        result = _context.sent;

                        if (!(result.status !== 200 && retries > 0)) {
                          _context.next = 11;
                          break;
                        }

                        return _context.abrupt("return", flush(toFlush, retries - 1));

                      case 11:
                        _context.next = 17;
                        break;

                      case 13:
                        _context.prev = 13;
                        _context.t0 = _context["catch"](4);

                        if (!(retries > 0)) {
                          _context.next = 17;
                          break;
                        }

                        return _context.abrupt("return", flush(toFlush, retries - 1));

                      case 17:
                        return _context.abrupt("return", null);

                      case 18:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, null, [[4, 13]]);
              }));

              return function flush(_x2, _x3) {
                return _ref2.apply(this, arguments);
              };
            }();

            currentPromise = (flushPromise || Promise.resolve()).then(function () {
              return flush();
            }).then(function () {
              if (currentPromise === flushPromise) {
                flushPromise = null;
              }
            });
            flushPromise = currentPromise;
            return _context2.abrupt("return", flushPromise);

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function track(_x) {
    return _ref.apply(this, arguments);
  };
}();

var setAnonymousId = function setAnonymousId(anonymousId, props) {
  baseProps = props;
  track(_objectSpread({
    event: 'identify',
    anonymousId: anonymousId
  }, props));
};

exports.setAnonymousId = setAnonymousId;

var identify = function identify(email) {
  track({
    event: 'identify',
    email: email
  });
};

exports.identify = identify;

var event = function event(name, params) {
  track(_objectSpread({
    event: name
  }, params));
};

exports.event = event;

var page = function page(params) {
  track(_objectSpread({
    event: 'page'
  }, params));
};

exports.page = page;

if (window.location.host === 'cube.dev') {
  var COOKIE_ID = 'cubedev_anonymous';
  var COOKIE_DOMAIN = '.cube.dev';
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

  clientAnonymousId = getCookie(COOKIE_ID);

  if (!clientAnonymousId) {
    clientAnonymousId = (0, _v["default"])();
    setCookie(COOKIE_ID, clientAnonymousId, {
      domain: COOKIE_DOMAIN,
      maxage: MAX_AGE,
      secure: true,
      sameSite: 'None'
    });
  }
} else {
  window.addEventListener('message', function (e) {
    if (e.data && e.data.clientAnonymousId) {
      clientAnonymousId = e.data.clientAnonymousId;
    }
  }, {
    passive: true
  });
  var cubeTrackFrame = window.document.createElement('iframe');
  cubeTrackFrame.setAttribute('src', 'https://cube.dev/docs/scripts/track.html');
  cubeTrackFrame.style.display = 'none';
  window.document.body.appendChild(cubeTrackFrame);
}
