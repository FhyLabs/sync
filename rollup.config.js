import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/sync.js",
      format: "iife",
      name: "SyncLib",
      sourcemap: true
    },
    {
      file: "dist/sync.min.js",
      format: "iife",
      name: "SyncLib",
      plugins: [terser()]
    }
  ],
  plugins: [nodeResolve()]
};
