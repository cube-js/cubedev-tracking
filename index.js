"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.page = exports.event = exports.setAnonymousId = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _componentCookie = _interopRequireDefault(require("component-cookie"));

var _v = _interopRequireDefault(require("uuid/v4"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var flushPromise = null;
var trackEvents = [];
var baseProps = {};
var COOKIE_ID = "cubedev_anonymous";

var track = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(event) {
    var flush, currentPromise;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!(0, _componentCookie["default"])(COOKIE_ID)) {
              (0, _componentCookie["default"])(COOKIE_ID, (0, _v["default"])());
            }

            trackEvents.push(_objectSpread(_objectSpread(_objectSpread({}, baseProps), event), {}, {
              id: (0, _v["default"])(),
              clientAnonymousId: (0, _componentCookie["default"])(COOKIE_ID),
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

          case 6:
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

var event = function event(name, params) {
  track(_objectSpread(_objectSpread({
    event: name,
    referrer: document.referrer
  }, window.location), params));
};

exports.event = event;

var page = function page(params) {
  track(_objectSpread(_objectSpread({
    event: 'page',
    referrer: document.referrer
  }, window.location), params));
};

exports.page = page;
