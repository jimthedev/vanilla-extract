---
"@vanilla-extract/vite-plugin": minor
---

Add `fileExtension` option to customize which files are processed by the plugin.

This allows using a custom file extension (e.g., `.ve.ts`) for vanilla-extract files instead of the default `.css.ts`. This is useful when consuming pre-compiled vanilla-extract libraries that publish `.css.js` files - you can use a different extension for your source files to avoid reprocessing library files.

```ts
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default {
  plugins: [
    vanillaExtractPlugin({
      fileExtension: '.ve', // Processes *.ve.ts, *.ve.tsx, etc.
    }),
  ],
};
```

Multiple extensions can also be specified:

```ts
vanillaExtractPlugin({
  fileExtension: ['.ve', '.styles'],
});
```
