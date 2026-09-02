import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AgentMill, parseAgentFile } from "../src/index.js";

test("searchAgents uses GitHub code search constrained to agent.md", async () => {
  const calls: string[][] = [];
  const mill = new AgentMill({ run: async (command, args) => { calls.push([command, ...args]); return "[]"; } });
  await mill.searchAgents("security");
  assert.deepEqual(calls[0], ["gh", "search", "code", "security filename:agent.md", "--filename", "agent.md", "--json", "repository,path,url,textMatches"]);
});

test("installAgent verifies before invoking portage", async () => {
  const calls: string[][] = [];
  const mill = new AgentMill({ run: async (command, args) => { calls.push([command, ...args]); return "{}"; } });
  await mill.installAgent("source", "opencode", "user");
  assert.equal(calls[0][0], "portage");
  assert.equal(calls[0][1], "doctor");
  assert.equal(calls[1][1], "port");
});

test("createAgent parses structured Ollama output", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ response: JSON.stringify({ name: "Reviewer", description: "Reviews code", tools: ["read"], body: "Review carefully." }) }), { status: 200 });
  try {
    const agent = await new AgentMill().createAgent("Review code");
    assert.equal(agent.name, "Reviewer");
    assert.deepEqual(agent.tools, ["read"]);
  } finally { globalThis.fetch = originalFetch; }
});

test("saveAgent writes parseable frontmatter", async () => {
  const directory = await mkdtemp(join(tmpdir(), "agent-mill-"));
  const file = await new AgentMill().saveAgent({ name: "Code Reviewer", description: "Reviews code", tools: ["read", "search"], body: "Review the change." }, directory);
  const parsed = parseAgentFile(await readFile(file, "utf8"));
  assert.equal(parsed.name, "Code Reviewer");
  assert.deepEqual(parsed.tools, ["read", "search"]);
});
