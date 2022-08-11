# @epitech.js/puppeteer-auth-provider

Authentication provider for Epitech.js.

This provider is used by [epitech.js](https://github.com/norech/epitech.js) to authenticate to the intranet without autologin.

It uses puppeteer to do the authentication and then stores the cookies in a file. Puppeteer is a headless browser. It can be used on servers or on local machines.

Puppeteer will only be used when the user is not authenticated. If the user is already authenticated and the last known authentication cookie is already valid, the browser will not be opened.

## Install

```bash
npm install --save epitech.js @epitech.js/puppeteer-auth-provider
```

## Usage

Import `epitech.js` and the provider in your project:

```ts
import { RawIntra } from 'epitech.js';
import { PuppeteerAuthProvider } from '@epitech.js/puppeteer-auth-provider';

// or

const { RawIntra } = require('epitech.js');
const { PuppeteerAuthProvider } = require('@epitech.js/puppeteer-auth-provider');
```


You can then use it with `epitech.js` like this:

```js
const intra = new RawIntra({
    provider: new PuppeteerAuthProvider({
        // path to the file where the auth data will be stored
        storageFilePath: './auth.json',
    }),
});

// ...

console.log(await intra.getDashboard());
```

## Troubleshooting

#### No graphical interface

If you are running on a server, you can't use the graphical interface.

But in order to do the first authentication, you will need to run your program in a machine with a graphical interface due to the required interactions.

Once you have done that, you can run the program again. It will automatically authenticate you, without requiring any interaction until you get logged out of Office 365. If you want to keep your session longer, don't forget to select "Yes" when asked if you want Microsoft to remember you.

Your session will be saved in the storage file you specified (e.g. `auth.json`). You can copy this file to another machine and run the program on that machine considering you specify the correct storage file path. Then, you will then be able to login without having to do any further interaction, until you get logged out of Office 365.

You can delete the storage file if you want to start over. The program will then ask you to authenticate again.

You may also disable the graphical interface by setting the `showAuthDialog` option to `false` in the provider constructor. This will make the program throw an error if you need to do an interactive authentication.
```js
const intra = new RawIntra({
    provider: new PuppeteerAuthProvider({
        // ...
        showAuthDialog: false,
    }),
});
```

#### How to make it work on a Raspberry Pi?

You might encounter issues with the bundled Chrome revision (fail to load due
to syntax error, etc.).

To make it work, you can download the `chromium` or `chromium-browser` package with your
system package manager, and specify to use this one instead of the bundled one by setting puppeteer's `executablePath` option:

```js
const intra = new RawIntra({
    provider: new PuppeteerAuthProvider({
        // ...
        puppeteer: {
            executablePath: '/usr/bin/chromium-browser',
        },
    }),
});
```

In Raspbian, you can install chromium like this:
```bash
# install chromium
sudo apt-get install chromium-browser
```

#### Permissions issues (e.g. root user)

It's possible that Puppeteer might refuse to run because of permissions issues, for example if you're running your program in a Docker container.

You may try to disable the sandbox by passing the `--no-sandbox` startup flag to Puppeteer Chrome instance.

```js
const intra = new RawIntra({
    provider: new PuppeteerAuthProvider({
        // ...
        puppeteer: {
            executablePath: '/usr/bin/chromium',
            args: ['--no-sandbox'],
        },
    }),
});
```

In the case where `--no-sandbox` is not enough, you may want to use `--disable-setuid-sandbox` too.

```js
const intra = new RawIntra({
    provider: new PuppeteerAuthProvider({
        // ...
        puppeteer: {
            executablePath: '/usr/bin/chromium',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    }),
});
```
