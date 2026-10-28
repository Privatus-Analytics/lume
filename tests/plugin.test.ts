// Unit tests with a fake Lume site and a real DOM (deno-dom, the same parser
// Lume uses). Run with: deno test --allow-env tests/
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@^1";
import { DOMParser } from "jsr:@b-fuze/deno-dom@^0.1.56";
import privatusDefault, {
  DEFAULT_MODULES,
  type LumeDocument,
  type LumePage,
  type LumeSite,
  type Options,
  privatus,
} from "../src/mod.ts";

const HTML =
  "<!doctype html><html><head><title>Hi</title></head><body>Hello</body></html>";

function page(html = HTML, data: Record<string, unknown> = {}): LumePage {
  const document = new DOMParser().parseFromString(html, "text/html");
  return { data, document: document as unknown as LumeDocument };
}

async function run(options: Options, pages: LumePage[]): Promise<string[]> {
  let extensions: string[] = [];
  let processor: ((pages: LumePage[]) => void | Promise<void>) | undefined;
  const site: LumeSite = {
    process(exts, fn) {
      extensions = exts;
      processor = fn;
    },
  };
  privatus(options)(site);
  assertEquals(extensions, [".html"]);
  await processor!(pages);
  return pages.map((p) =>
    (p.document as unknown as
      | { documentElement: { outerHTML: string } }
      | undefined)?.documentElement.outerHTML ?? ""
  );
}

function withEnv(
  name: string,
  value: string | undefined,
  fn: () => Promise<void>,
) {
  return async () => {
    const old = Deno.env.get(name);
    if (value === undefined) Deno.env.delete(name);
    else Deno.env.set(name, value);
    try {
      await fn();
    } finally {
      if (old === undefined) Deno.env.delete(name);
      else Deno.env.set(name, old);
    }
  };
}

const SITE = { siteId: "pa_TEST123456" };

Deno.test("adds the tag to the head with the default modules", async () => {
  const [html] = await run(SITE, [page()]);
  assertStringIncludes(
    html,
    '<script defer="" src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456" data-modules="engage,auto,vitals,clicks,ask"></script></head>',
  );
  assertEquals(DEFAULT_MODULES, ["engage", "auto", "vitals", "clicks", "ask"]);
});

Deno.test("the default export is the plugin", () => {
  assertEquals(privatusDefault, privatus);
});

Deno.test("modules can be changed or turned off", async () => {
  const [some] = await run({ ...SITE, modules: ["engage"] }, [page()]);
  assertStringIncludes(some, 'data-modules="engage"');
  const [none] = await run({ ...SITE, modules: [] }, [page()]);
  assertStringIncludes(none, 'data-modules=""');
});

Deno.test("passes the other tracker settings", async () => {
  const [html] = await run({
    ...SITE,
    scriptHost: "https://stats.example.com",
    excludedPaths: ["/drafts/*"],
    domains: ["example.com"],
    manual: true,
  }, [page()]);
  assertStringIncludes(html, 'src="https://stats.example.com/js/pa.js"');
  assertStringIncludes(html, 'data-exclude="/drafts/*"');
  assertStringIncludes(html, 'data-domains="example.com"');
  assertStringIncludes(html, 'data-manual="true"');
});

Deno.test(
  "adds nothing without a site id",
  withEnv("PRIVATUS_SITE_ID", undefined, async () => {
    const [html] = await run({}, [page()]);
    assert(!html.includes("pa.js"), html);
  }),
);

Deno.test(
  "reads the site id from PRIVATUS_SITE_ID",
  withEnv("PRIVATUS_SITE_ID", "pa_FROMENV", async () => {
    const [html] = await run({}, [page()]);
    assertStringIncludes(html, 'data-site="pa_FROMENV"');
  }),
);

Deno.test(
  "is off while lume --serve runs",
  withEnv("LUME_LIVE_RELOAD", "true", async () => {
    const [html] = await run(SITE, [page()]);
    assert(!html.includes("pa.js"), html);
    const [forced] = await run({ ...SITE, enabled: true }, [page()]);
    assertStringIncludes(forced, "pa.js");
  }),
);

Deno.test("enabled: false turns it off", async () => {
  const [html] = await run({ ...SITE, enabled: false }, [page()]);
  assert(!html.includes("pa.js"), html);
});

Deno.test("the queue stub still prints when the tag is off", async () => {
  const [html] = await run({ ...SITE, enabled: false, queueStub: true }, [
    page(),
  ]);
  assertStringIncludes(html, "window.privatus=window.privatus||{q:[]}");
  assert(!html.includes("pa.js"), html);
});

Deno.test("never adds a second tracker", async () => {
  const existing = HTML.replace(
    "</head>",
    '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_OTHER"></script></head>',
  );
  const [html] = await run(SITE, [page(existing)]);
  assertEquals(html.match(/pa\.js/g)?.length, 1);
  assert(!html.includes("pa_TEST123456"), html);
});

Deno.test("page props from an object or from each page", async () => {
  const [fixed] = await run({ ...SITE, props: { theme: "docs" } }, [page()]);
  assertStringIncludes(fixed, "privatusPageProps");
  assertStringIncludes(fixed, "theme");

  const [a, b] = await run(
    { ...SITE, props: (p) => ({ section: String(p.data.section) }) },
    [page(HTML, { section: "guide" }), page(HTML, { section: "blog" })],
  );
  assertStringIncludes(a, "guide");
  assertStringIncludes(b, "blog");
  assert(!a.includes("blog"), a);
});

Deno.test("skips pages without a document or a head", async () => {
  const pages: LumePage[] = [{ data: {} }];
  await run(SITE, pages);
  assertEquals(pages[0].document, undefined);
});
