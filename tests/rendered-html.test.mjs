import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fuzzyScore, memberships, tailDependence } from "../app/model.ts";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete English walkthrough", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Interpretable Credit Risk Lab/);
  assert.match(html, /Credit risk,/);
  assert.match(html, /Interactive Fuzzy Engine/i);
  assert.match(html, /Tail Dependence/i);
  assert.match(html, /Portfolio Stress Lab/i);
  assert.match(html, /From Prototype to Production/i);
  assert.match(html, /This is a methodology prototype built with synthetic portfolio data/);
  assert.doesNotMatch(html, /SixPoint|candidatura|cover letter|vaga|português/i);
});

test("fuzzy memberships and anchor scores are stable", () => {
  assert.deepEqual(memberships(0), {
    Low: 1,
    Moderate: 0,
    High: 0,
    Critical: 0,
  });
  assert.ok(Math.abs(fuzzyScore(0, 0) - 0.113) < 0.002);
  assert.ok(Math.abs(fuzzyScore(1, 1) - 0.89) < 0.002);
  assert.ok(fuzzyScore(0.8, 0.8) > fuzzyScore(0.2, 0.2));
});

test("t-copula tail dependence responds to correlation and degrees of freedom", () => {
  const baseline = tailDependence(0.45, 5);
  assert.ok(baseline > 0 && baseline < 1);
  assert.ok(tailDependence(0.75, 5) > baseline);
  assert.ok(tailDependence(0.45, 20) < baseline);
});

test("public-facing source stays independent and English", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /SixPoint|candidatura|cover letter|vaga|português/i);
  assert.match(source, /Original academic project/);
  assert.match(source, /production-ready/);
});
