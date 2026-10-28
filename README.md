# Privatus Analytics for Lume

**Real visitor numbers for your Lume site. No cookies, no cookie pop-up, no bots.**

You want to know if people read your Lume site. But Google Analytics uses
cookies, so in many countries you must show a cookie pop-up first (the box
that asks visitors to say yes to cookies). Many people click no, so they never
show up in your numbers. Bots add fake visits on top.

This plugin adds the Privatus Analytics script to every page Lume builds. It
takes one line in your `_config.ts`. The script sets no cookies and keeps no IP
addresses. Bots are filtered out before they are counted.

So you see how many real people came, which pages they read and where they
came from, on one simple dashboard. A report comes to your inbox each week, and
you can set alerts for when traffic jumps or drops. And you don't need a cookie
pop-up for your analytics.

**Free plan, no card:** 10,000 events a month (an event is a page view or an action you track) on up to 3 sites. [Start free at privatusanalytics.com](https://privatusanalytics.com).

- **No cookies.** No cookies and no hidden IDs on your visitors' devices, and no IP
  addresses are kept. Laws differ by country, so check your own legal advice.
- **Real people, not bots.** Known bots, data centers and spam visits are left
  out on every plan.
- **Small and fast.** The script is about 3 KB when compressed.

## What this plugin does

- Adds the Privatus Analytics script to the `<head>` of every HTML page when
  you run `lume`.
- Adds nothing while `lume --serve` runs, so your own visits while you write
  are not counted.
- Only adds HTML. It never sends requests, sets no cookies and reads nothing
  about your visitors.

You need a Privatus Analytics account to see your reports, and there is a
free plan. [Sign up at privatusanalytics.com](https://privatusanalytics.com).

## Requirements

- Lume 3 on Deno 2.
- A Privatus Analytics site id (it starts with `pa_`). You find it under Site
  settings, Tracking.

## Install

Add the plugin to your `_config.ts`:

```ts
import lume from "lume/mod.ts";
import privatus from "https://cdn.jsdelivr.net/gh/Privatus-Analytics/lume@v1.0.0/src/mod.ts";

const site = lume();

site.use(privatus({ siteId: "pa_YOURSITEID" }));

export default site;
```

Run `lume` and every page gets this in its `<head>`:

```html
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_YOURSITEID" data-modules="engage,auto,vitals,clicks,ask"></script>
```

You can also leave out `siteId` and set it with an environment variable:

```sh
PRIVATUS_SITE_ID=pa_YOURSITEID deno task build
```

For the full setup guide and every tracker option, see the
[Privatus Analytics docs](https://privatusanalytics.com/docs).

## Configuration

Every setting is optional except the site id.

```ts
site.use(privatus({
  siteId: "pa_YOURSITEID",                 // or PRIVATUS_SITE_ID
  scriptHost: "https://privatusstats.com", // or PRIVATUS_SCRIPT_HOST
  modules: ["engage", "auto", "vitals", "clicks", "ask"],
  excludedPaths: ["/drafts/*"],
  domains: ["example.com"],
  spa: "auto",                             // auto, history, hash or off
  manual: false,                           // true turns off the automatic pageview
  enabled: undefined,                      // true or false forces it on or off
  extraAttributes: { "data-mask": "/orders/*->/orders/:id" },
  props: (page) => ({ section: page.data.section }),
  queueStub: false,
  nonce: undefined,
}));
```

| Setting | Default | What it does |
|---|---|---|
| `siteId` | `PRIVATUS_SITE_ID` | The `data-site` attribute. Nothing is added without it |
| `scriptHost` | `https://privatusstats.com` | Where `/js/pa.js` is served from (or `PRIVATUS_SCRIPT_HOST`) |
| `modules` | `engage, auto, vitals, clicks, ask` | The `data-modules` attribute. `[]` loads none |
| `excludedPaths` | none | Path patterns the tracker never counts, like `/drafts/*` |
| `domains` | all hosts | Count only these hostnames |
| `spa` | `auto` | How your pages change without a full reload |
| `manual` | `false` | `true` turns off the automatic pageview |
| `enabled` | on in `lume`, off in `lume --serve` | `true` or `false` forces the tag on or off |
| `extraAttributes` | `{}` | Any other `data-*` attribute |
| `props` | none | Page props sent with every pageview and event. An object, or a function that gets each page |
| `queueStub` | `false` | Adds a small script first, so `privatus.track` calls made before the tracker loads are kept |
| `nonce` | none | The Content Security Policy nonce for the scripts |

Each tracker attribute is explained in the [script attributes
reference](https://privatusanalytics.com/docs/tracker/attributes), and the
modules in [Modules](https://privatusanalytics.com/docs/tracker/modules).

A page that already has the tracker script (for example one you added by
hand) is left alone, so no page gets two.

### Page props

Page props let you split your numbers by a group of pages, like the section
or the language. The function gets each Lume page, with its front matter in
`page.data`:

```ts
site.use(privatus({
  siteId: "pa_YOURSITEID",
  props: (page) => ({ section: page.data.section, lang: page.data.lang }),
}));
```

**Never put names, emails, user ids or anything that points to one person in
props.** Put groups, not people.

## Privacy

The script sets no cookies and stores nothing in the browser. The plugin only
adds HTML to your pages at build time. It never makes network requests and
never reads IP addresses, browser details or visitor ids. See the
[privacy documentation](https://privatusanalytics.com/docs/privacy) for what is
collected.

If you have a privacy policy, it should say which tools handle your visitors' data. You can paste this:

> This website uses [Privatus Analytics](https://privatusanalytics.com/privacy-analytics) to count visits. It
> does not use cookies and does not follow you from one website to another. Your IP address is used for a moment
> to count visits and is never stored.

Change it to fit your site. The [privacy policy generator](https://privatusanalytics.com/tools/privacy-policy-generator)
makes a longer version with your site's name in it.

## Development

The checks run in Docker so your local Deno does not matter:

```sh
./run-docker.sh
```

It runs `deno fmt --check`, `deno lint`, `deno check`, the unit tests, a real
Lume 3 build with the plugin, and `deno publish --dry-run`.

## Contributing

Bug reports and pull requests are welcome at
https://github.com/Privatus-Analytics/lume.

## License

MIT. See [LICENSE](LICENSE). Privatus Analytics is a product of Two Phase LLC,
Wyoming, USA.
