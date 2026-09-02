import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { parse, stringify } from "yaml";

const exec = promisify(execFile);

export type Target = "opencode" | "copilot" | "claude-code" | "gemini" | "cursor" | "codex";
export type CommandRunner = (command: string, args: string[]) => Promise<string>;

export interface AgentDefinition {
  name: string;
  description: string;
  body: string;
  tools?: string[];
  model?: string;
}

export interface AgentMillOptions {
  run?: CommandRunner;
  cwd?: string;
}

const defaultRun: CommandRunner = async (command, args) => {
  const result = await exec(command, args, { maxBuffer: 10 * 1024 * 1024 });
  return result.stdout;
};

export class AgentMill {
  private readonly run: CommandRunner;
  private readonly cwd?: string;

  constructor(options: AgentMillOptions = {}) {
    this.run = options.run ?? (async (command, args) => {
      const result = await exec(command, args, { cwd: options.cwd, maxBuffer: 10 * 1024 * 1024 });
      return result.stdout;
    });
    this.cwd = options.cwd;
  }

  async searchAgents(agentType: string): Promise<unknown[]> {
    const query = `${agentType} filename:agent.md`;
    const output = await this.run("gh", ["search", "code", query, "--filename", "agent.md", "--json", "repository,path,url,textMatches"]);
    return JSON.parse(output) as unknown[];
  }

  async verifyAgent(source: string): Promise<string> {
    return this.run("portage", ["doctor", source, "--json"]);
  }

  async installAgent(source: string, target: Target, scope: "user" | "project" = "user"): Promise<string> {
    await this.verifyAgent(source);
    return this.run("portage", ["port", source, "--to", target, "--scope", scope, "--yes"]);
  }

  async searchSkills(query: string): Promise<string> {
    return this.run("skillswap", ["shop", query, "--json"]);
  }

  async verifySkill(source: string): Promise<string> {
    return this.run("skillswap", ["doctor", source, "--json"]);
  }

  async installSkill(source: string, scope: "user" | "project" | "shared" = "user"): Promise<string> {
    await this.verifySkill(source);
    return this.run("skillswap", ["install", source, "--scope", scope, "--yes"]);
  }

  async shop(query: string, options: { install?: "user" | "project" | "shared"; target?: string } = {}): Promise<string> {
    const args = ["shop", query];
    if (options.target) args.push("--to", options.target);
    if (options.install) args.push("--install", options.install);
    args.push("--json");
    return this.run("codex2code", args);
  }

  async createAgent(description: string, options: { model?: string; ollamaUrl?: string } = {}): Promise<AgentDefinition> {
    const model = options.model ?? "llama3.2";
    const url = options.ollamaUrl ?? "http://127.0.0.1:11434/api/generate";
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, stream: false, format: "json", prompt: `Create a custom agent from this description: ${description}. Return JSON with name, description, tools (array), and body (markdown instructions).` })
    });
    if (!response.ok) throw new Error(`Ollama request failed (${response.status}).`);
    const payload = await response.json() as { response?: string };
    const generated = JSON.parse(payload.response ?? "{}");
    return { name: generated.name, description: generated.description, tools: generated.tools, body: generated.body, model };
  }

  async saveAgent(agent: AgentDefinition, directory: string): Promise<string> {
    const safeName = agent.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const file = join(directory, `${safeName || "agent"}.agent.md`);
    const frontmatter = { name: agent.name, description: agent.description, ...(agent.tools ? { tools: agent.tools.join(", ") } : {}) };
    await mkdir(directory, { recursive: true });
    await writeFile(file, `---\n${stringify(frontmatter)}---\n\n${agent.body.trim()}\n`, "utf8");
    return file;
  }
}

export function parseAgentFile(content: string): AgentDefinition {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Agent file must contain YAML frontmatter.");
  const metadata = parse(match[1]) as Record<string, unknown>;
  if (typeof metadata.name !== "string" || typeof metadata.description !== "string") throw new Error("Agent frontmatter requires name and description.");
  return { name: metadata.name, description: metadata.description, body: match[2].trim(), tools: typeof metadata.tools === "string" ? metadata.tools.split(",").map((tool) => tool.trim()).filter(Boolean) : undefined };
}

export { defaultRun };
