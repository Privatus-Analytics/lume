// Builds a real Lume 3 site with the plugin and checks the output files.
// Needs network access the first time to download Lume:
// deno test --allow-all integration/
import { assert, assertStringIncludes } from "jsr:@std/assert@^1";
import lume from "https://cdn.jsdelivr.net/gh/lumeland/lume@3.3.3/mod.ts";
import privatus from "../src/mod.ts";

Deno.test("real Lume build adds the tag to every page", async () => {
  const root = await Deno.makeTempDir();
  await Deno.mkdir(`${root}/src/guide`, { recursive: true });
  const layout = (body: string) =>
    `<!doctype html><html><head><title>Test</title></head><body>${body}</body></html>`;
  await Deno.writeTextFile(`${root}/src/index.vto`, layout("Home"));
  await Deno.writeTextFile(
    `${root}/src/guide/index.vto`,
    `---\nsection: guide\n---\n${layout("Guide")}`,
  );

  const site = lume({ cwd: root, src: "./src" });
  site.use(privatus({
    siteId: "pa_TEST123456",
    enabled: true,
    props: (page) => page.data.section ? { section: page.data.section } : null,
  }));
  await site.build();

  const home = await Deno.readTextFile(`${root}/_site/index.html`);
  const guide = await Deno.readTextFile(`${root}/_site/guide/index.html`);
  for (const html of [home, guide]) {
    assertStringIncludes(html, 'src="https://privatusstats.com/js/pa.js"');
    assertStringIncludes(html, 'data-site="pa_TEST123456"');
    assertStringIncludes(html, 'data-modules="engage,auto,vitals,clicks,ask"');
    assertStringIncludes(html, "</script></head>");
  }
  assertStringIncludes(guide, '{"section":"guide"}');
  assert(!home.includes("privatusPageProps"), home);

  await Deno.remove(root, { recursive: true });
});
