/**
 * Privatus Analytics for Lume: adds the cookieless tracking script to the
 * `<head>` of every HTML page Lume builds.
 *
 * ```ts
 * import lume from "lume/mod.ts";
 * import privatus from "jsr:@privatus-analytics/lume";
 *
 * const site = lume();
 * site.use(privatus({ siteId: "pa_YOURSITEID" }));
 *
 * export default site;
 * ```
 *
 * The plugin only adds HTML. It never sends requests, sets no cookies and
 * reads nothing about your visitors.
 *
 * @module
 */

import {
  createPrivatus,
  type PrivatusOptions,
} from "jsr:@privatus-analytics/analytics@^1.0.1";

/** The version of this package. */
export const VERSION = "1.0.0";

/** Page props: a plain object of values that describe a group of pages, never one person. */
export type Props = Record<string, unknown>;

/** The parts of a Lume page the plugin reads, written out so the package needs no Lume types. */
export interface LumePage {
  /** The page data: front matter, `url` and everything else Lume knows about the page. */
  data: Record<string, unknown>;
  /** The parsed HTML document of the page. */
  document?: LumeDocument;
}

/** The parts of a DOM document the plugin uses. */
export interface LumeDocument {
  /** The `<head>` element. */
  head?: LumeElement | null;
  /** Finds the first element that matches a CSS selector. */
  querySelector(selector: string): unknown;
  /** Makes a new element. */
  createElement(tagName: string): LumeElement;
}

/** The parts of a DOM element the plugin uses. */
export interface LumeElement {
  /** The HTML inside the element. */
  innerHTML: string;
  /** The first child node, or null. */
  firstChild: unknown;
  /** Moves a node to the end of this element. */
  appendChild(node: unknown): unknown;
}

/** The parts of a Lume site the plugin uses. */
export interface LumeSite {
  /** Registers a processor for pages with these extensions. */
  process(
    extensions: string[],
    processor: (pages: LumePage[]) => void | Promise<void>,
  ): unknown;
}

/** Settings for the plugin. Every one is optional except the site id. */
export interface Options extends
  Omit<
    PrivatusOptions,
    "props" | "request" | "context" | "enabledEnvironments" | "env"
  > {
  /**
   * Page props sent with every pageview and event. An object, or a function
   * that gets each page and returns an object, for example
   * `(page) => ({ section: page.data.section })`.
   * Never put names, emails, user ids or anything that points to one person here.
   */
  props?: Props | ((page: LumePage) => Props | null | undefined) | null;
}

/** Tracker modules the plugin loads when you don't set `modules`. */
export const DEFAULT_MODULES: readonly string[] = [
  "engage",
  "auto",
  "vitals",
  "clicks",
  "ask",
];

/** A tracker script already in the page, so the plugin never adds a second one. */
const EXISTING_TRACKER = 'script[src$="/js/pa.js"]';

/**
 * Whether Lume is building for its local server (`lume --serve` or
 * `lume --watch`). Lume sets LUME_LIVE_RELOAD for those builds. Reading the
 * variable never throws, even without env access.
 */
function localServer(): boolean {
  try {
    const deno = (globalThis as {
      Deno?: { env?: { get(name: string): string | undefined } };
    }).Deno;
    return deno?.env?.get("LUME_LIVE_RELOAD") === "true";
  } catch {
    return false;
  }
}

/**
 * Parses the tag HTML and moves its nodes to the end of the head. Lume's DOM
 * (deno-dom) has no insertAdjacentHTML, so this works through innerHTML.
 */
function appendHtml(
  document: LumeDocument,
  head: LumeElement,
  html: string,
): void {
  const box = document.createElement("div");
  box.innerHTML = html;
  while (box.firstChild) head.appendChild(box.firstChild);
}

/**
 * The Lume plugin. Adds the Privatus Analytics script to the `<head>` of every
 * HTML page.
 *
 * The tag is on in `lume` builds and off while `lume --serve` runs, so your
 * own visits while you write are not counted. Set `enabled` to force it on or
 * off. Without a site id (here or in PRIVATUS_SITE_ID) nothing is added.
 */
export function privatus(options: Options = {}): (site: LumeSite) => void {
  return (site: LumeSite) => {
    const { props, ...rest } = options;
    const privatus = createPrivatus({
      modules: DEFAULT_MODULES,
      ...rest,
      enabled: options.enabled ?? !localServer(),
    });

    site.process([".html"], function processPrivatus(pages) {
      for (const page of pages) {
        const document = page.document;
        const head = document?.head;
        if (!document || !head) continue;
        if (document.querySelector(EXISTING_TRACKER)) continue;

        const pageProps = typeof props === "function" ? props(page) : props;
        const html = privatus.tag({ props: pageProps ?? undefined });
        if (html !== "") appendHtml(document, head, html);
      }
    });
  };
}

export default privatus;
