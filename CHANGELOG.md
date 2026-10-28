# Changelog

## 1.0.0 - 2026-10-28

- Initial release of the Privatus Analytics plugin for Lume.
- Adds the tracking script to the `<head>` of every HTML page in `lume` builds, and nothing while
  `lume --serve` runs.
- Loads the `engage`, `auto`, `vitals`, `clicks` and `ask` modules unless you set `modules`.
- Settings for site id (or `PRIVATUS_SITE_ID`), script host, modules, excluded paths, domains,
  single-page app mode, manual mode, extra attributes, nonce, the queue stub and page props (an
  object, or a function that gets each page).
- Leaves a page alone when it already has the tracker script.
- Never sends requests, sets no cookies and reads no visitor data.
