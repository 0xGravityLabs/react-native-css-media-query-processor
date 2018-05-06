import { Dimensions, Platform } from "react-native";
import mediaQuery from "./mediaquery.js";
import merge from "deepmerge";
import memoize from "micro-memoize";

const PREFIX = "@media";

function isMediaQuery(str) {
  return typeof str === "string" && str.indexOf(PREFIX) === 0;
}

function omit(obj, omitKey) {
  return Object.keys(obj).reduce((result, key) => {
    if (key !== omitKey) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

function filterMq(obj) {
  return Object.keys(obj).filter(key => isMediaQuery(key));
}

function filterNonMq(obj) {
  return Object.keys(obj)
    .filter(key => !isMediaQuery(key))
    .reduce((out, key) => {
      out[key] = obj[key];
      return out;
    }, {});
}

const mFilterMq = memoize(filterMq);
const mFilterNonMq = memoize(filterNonMq);
const mOmit = memoize(omit);

export function process(obj) {
  const hasParsedMQs = "__mediaQueries" in obj;

  if (!hasParsedMQs) {
    return obj;
  }

  const mqKeys = mFilterMq(obj);
  let res = mFilterNonMq(obj);
  const matchObject = getMatchObject();

  mqKeys.forEach(key => {
    if (/^@media\s+(not\s+)?(ios|android)/i.test(key)) {
      matchObject.type = Platform.OS;
    } else {
      matchObject.type = "screen";
    }

    const isMatch = mediaQuery.match(obj.__mediaQueries[key], matchObject);
    if (isMatch) {
      res = merge(res, obj[key]);
    }
  });

  return mOmit(res, "__mediaQueries");
}

function getMatchObject() {
  const win = Dimensions.get("window");
  return {
    width: win.width,
    height: win.height,
    orientation: win.width > win.height ? "landscape" : "portrait",
    "aspect-ratio": win.width / win.height,
    type: "screen"
  };
}
