# `next.config.ts`: tsconfig `paths` aliases resolve against the project root in nested imports

`next.config.ts` imports `lib/greeting.ts`, which imports `lib/name.ts` through the `@/*` alias from `tsconfig.json`.

```sh
pnpm install
pnpm build
```

## Current behavior

```
▲ Next.js 16.5.0-canary.3 (Turbopack)
⨯ Failed to load next.config.ts, see more info here https://nextjs.org/docs/messages/next-config-error

> Build error occurred
Error: Cannot find module './lib/name'
Require stack:
- …/lib/greeting.ts
- …/next.config.compiled.js
- …/node_modules/next/dist/build/next-config-ts/transpile-config.js
  …
```

`@/lib/name` in `lib/greeting.ts` is rewritten to `./lib/name`, which resolves to `lib/lib/name`. The same alias in
`next.config.ts` itself works, because that file sits in the project root.

## Expected behavior

`@/lib/name` is rewritten relative to the importing file (`./name`), and the build succeeds - just as the alias works
everywhere else in a Next.js app.

## Cause

`transpileConfig` compiles `next.config.ts` with swc, passing `jsc.paths` and `jsc.baseUrl` from `tsconfig.json`, and
registers a require hook which compiles every `.ts` file the config imports with the same options:

```js
// packages/next/src/build/next-config-ts/require-hook.ts
const { code } = transformSync(content, swcOptions)
// …
const swc = transformSync(code, swcOptions)
```

Neither call passes `filename`, so swc does not know where the module lives, and computes every rewritten alias
relative to the cwd. Passing it fixes the build:

```diff
-const { code } = transformSync(content, swcOptions)
+const { code } = transformSync(content, { ...swcOptions, filename: oldFilename })
 // …
-const swc = transformSync(code, swcOptions)
+const swc = transformSync(code, { ...swcOptions, filename })
```

With that patch applied to `node_modules/next/dist/build/next-config-ts/require-hook.js`, `pnpm build` succeeds.

`--experimental-next-config-strip-types` is no workaround here: node's native loader knows neither tsconfig `paths` nor
extensionless imports, so it fails and next falls back to the same require hook.

## Environment

- next `16.5.0-canary.3` (also `16.4.0`)
- node `v24.21.0`
- linux
