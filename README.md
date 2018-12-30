# dejs

- dejs is [ejs](https://ejs.co) template engine for [deno](https://github.com/denoland/deno).
- dejs's render function returns `Reader`.

## Features

### Supported

- <%= %> Escaped
- <%- %> Raw
- <%# %> Comment
- <% %> Evaluate (Basic support)

### Not supported

- All other features of ejs

## Usage

- template.ejs

```ejs
<body>
  <h1>hello, <%= name %>!</h1>
  <%# Example comment %>
</body>
```

- index.ts

```ts
import { cwd, stdout, copy } from 'deno';
import { renderFile } from 'https://syumai.github.io/dejs/dejs.ts';

(async () => {
  const output = await renderFile(`${cwd()}/template.ejs`, {
    name: 'world',
  });
  await copy(stdout, output);
})();
```

- console

```sh
$ deno index.ts
<body>
    <h1>hello, world!</h1>
</body>
```

## Author

syumai

## License

MIT
