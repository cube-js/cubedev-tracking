"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.page = exports.event = exports.identify = exports.setAnonymousId = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _componentCookie = _interopRequireDefault(require("component-cookie"));

var _v = _interopRequireDefault(require("uuid/v4"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var flushPromise = null;
var trackEvents = [];
var baseProps = {};

var getLevels = function getLevels(hostname) {
  var parts = hostname.split('.');
  var last = parts[parts.length - 1];
  var levels = []; // Ip address.

  if (parts.length === 4 && last === parseInt(last, 10)) return levels; // Localhost.

  if (parts.length <= 1) return levels; // Create levels.

  for (var i = parts.length - 2; i >= 0; --i) {
    levels.push(parts.slice(i).join('.'));
  }

  return levels;
};

var topDomain = function topDomain(hostname) {
  var levels = getLevels(hostname); // Lookup the real top level one.

  for (var i = 0; i < levels.length; ++i) {
    var cname = '__tld__';
    var domain = levels[i];
    var opts = {
      domain: '.' + domain
    };
    (0, _componentCookie["default"])(cname, 1, opts);

    if ((0, _componentCookie["default"])(cname)) {
      (0, _componentCookie["default"])(cname, null, opts);
      return domain;
    }
  }

  return '';
};

var getCookieId = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var r;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return fetch('https://identity.cube.dev', {
              credentials: 'include'
            });

          case 3:
            r = _context.sent;

            if (!(r.status >= 400)) {
              _context.next = 6;
              break;
            }

            throw new Error('failed request to identity service');

          case 6:
            return _context.abrupt("return", r.text());

          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](0);
            console.error(_context.t0);
            return _context.abrupt("return", (0, _v["default"])());

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 9]]);
  }));

  return function getCookieId() {
    return _ref.apply(this, arguments);
  };
}();

var COOKIE_ID = 'cubedev_anonymous';
var topDomainValue = topDomain(window.location.hostname);
var COOKIE_DOMAIN = topDomainValue ? '.' + topDomainValue : window.location.hostname;
var MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

var track = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(event) {
    var flush, currentPromise;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if ((0, _componentCookie["default"])(COOKIE_ID)) {
              _context3.next = 8;
              break;
            }

            _context3.t0 = _componentCookie["default"];
            _context3.t1 = COOKIE_ID;
            _context3.next = 5;
            return getCookieId();

          case 5:
            _context3.t2 = _context3.sent;
            _context3.t3 = {
              domain: COOKIE_DOMAIN,
              maxage: MAX_AGE
            };
            (0, _context3.t0)(_context3.t1, _context3.t2, _context3.t3);

          case 8:
            trackEvents.push(_objectSpread(_objectSpread(_objectSpread(_objectSpread({}, baseProps), event), {}, {
              referrer: document.referrer
            }, window.location), {}, {
              id: (0, _v["default"])(),
              clientAnonymousId: (0, _componentCookie["default"])(COOKIE_ID),
              clientTimestamp: new Date().toJSON()
            }));

            flush = /*#__PURE__*/function () {
              var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(toFlush, retries) {
                var sentAt, result;
                return _regenerator["default"].wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        if (!toFlush) {
                          toFlush = trackEvents;
                          trackEvents = [];
                        }

                        if (toFlush.length) {
                          _context2.next = 3;
                          break;
                        }

                        return _context2.abrupt("return", null);

                      case 3:
                        if (retries == null) {
                          retries = 10;
                        }

                        _context2.prev = 4;
                        sentAt = new Date().toJSON();
                        _context2.next = 8;
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
                        result = _context2.sent;

                        if (!(result.status !== 200 && retries > 0)) {
                          _context2.next = 11;
                          break;
                        }

                        return _context2.abrupt("return", flush(toFlush, retries - 1));

                      case 11:
                        _context2.next = 17;
                        break;

                      case 13:
                        _context2.prev = 13;
                        _context2.t0 = _context2["catch"](4);

                        if (!(retries > 0)) {
                          _context2.next = 17;
                          break;
                        }

                        return _context2.abrupt("return", flush(toFlush, retries - 1));

                      case 17:
                        return _context2.abrupt("return", null);

                      case 18:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, null, [[4, 13]]);
              }));

              return function flush(_x2, _x3) {
                return _ref3.apply(this, arguments);
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
            return _context3.abrupt("return", flushPromise);

          case 13:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function track(_x) {
    return _ref2.apply(this, arguments);
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
