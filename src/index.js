import merge from "deepmerge";
import memoize from "micro-memoize";
import mediaQuery from "./mediaquery.js";

const PREFIX = "@media";

function isMediaQuery(str) {
  return typeof str === "string" && str.indexOf(PREFIX) === 0;
}

function filterMq(obj) {
  return Object.keys(obj).filter(key => isMediaQuery(key));
}

function filterNonMq(obj) {
  return Object.keys(obj).reduce((out, key) => {
    if (!isMediaQuery(key) && key !== "__mediaQueries") {
      out[key] = obj[key];
    }
    return out;
  }, {});
}

const mFilterMq = memoize(filterMq);
const mFilterNonMq = memoize(filterNonMq);

export function process(obj, matchObject) {
  const mqKeys = mFilterMq(obj);
  let res = mFilterNonMq(obj);

  mqKeys.forEach(key => {
    const isMatch = mediaQuery.match(obj.__mediaQueries[key], matchObject);
    if (isMatch) {
      res = merge(res, obj[key]);
    }
  });

  return res;
}
