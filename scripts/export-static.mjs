import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = fileURLToPath(new URL("../docs/", import.meta.url));
const basePath = "/interpretable-credit-risk-lab";
const publicUrl = `https://manresearch.github.io${basePath}`;

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("export", `${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("http://localhost/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) {
  throw new Error(`Static render failed with status ${response.status}`);
}

let html = await response.text();
html = html
  .replaceAll("/_next/static/", `${basePath}/_next/static/`)
  .replaceAll("/favicon.svg", `${basePath}/favicon.svg`)
  .replaceAll("http://localhost:3000/social-card.png", `${publicUrl}/social-card.png`);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(`${root}dist/client`, output, { recursive: true });
await writeFile(`${output}index.html`, html, "utf8");
await writeFile(`${output}404.html`, html, "utf8");
await writeFile(`${output}.nojekyll`, "", "utf8");

const generated = await readFile(`${output}index.html`, "utf8");
if (!generated.includes(`${basePath}/_next/static/`)) {
  throw new Error("Static export is missing the GitHub Pages asset prefix");
}

console.log(`Static GitHub Pages export written to ${output}`);
