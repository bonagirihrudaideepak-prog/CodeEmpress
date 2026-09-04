// Browser-safe (pure-JS) AlaSQL build. We import the prebuilt browser bundle
// directly so we never pull in the Node/filesystem build (which requires
// node:fs and react-native-fetch-blob and isn't bundler-friendly).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- not type-exported
import alasql from "../../node_modules/alasql/dist/alasql.min.js";
export default alasql;
