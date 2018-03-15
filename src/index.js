import { Dimensions, Platform } from "react-native";
import mediaQuery from "css-mediaquery";
import merge from "deepmerge";
import memoize from "micro-memoize";

const PREFIX = "@media";

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

function isMediaQuery(str) {
  return typeof str === "string" && str.indexOf(PREFIX) === 0;
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

export function process(obj) {
  const mqKeys = mFilterMq(obj);
  let res = mFilterNonMq(obj);

  if (!mqKeys.length) {
    return res;
  }

  const matchObject = getMatchObject();

  mqKeys.forEach(key => {
    const mqStr = key.replace(PREFIX, "");

    if (/^@media\s+(ios|android)/i.test(key)) {
      matchObject.type = Platform.OS;
    }

    const isMatch = mediaQuery.match(mqStr, matchObject);
    if (isMatch) {
      res = merge(res, obj[key]);
    }
  });

  return res;
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
