'use strict';

import cookie from 'component-cookie';
import { parse } from 'component-url';

function getLevels(url) {
  const host = parse(url).hostname;
  const parts = host.split('.');
  const last = parts[parts.length - 1];
  const levels = [];

  // Ip address.
  if (parts.length === 4 && last === parseInt(last, 10)) {
    return levels;
  }

  // Localhost.
  if (parts.length <= 1) {
    return levels;
  }

  // Create levels.
  for (let i = parts.length - 2; i >= 0; --i) {
    levels.push(parts.slice(i).join('.'));
  }

  return levels;
};

function topDomain(url) {
  const levels = getLevels(url);
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


export default topDomain;