#!/usr/bin/env node
import { input, select } from "@inquirer/prompts";
import { AgentMill } from "./index.js";

const mill = new AgentMill();
const [command, ...rest] = process.argv.slice(2);

function help(): void {
  console.log(`Agent Mill\n\nUsage:\n  agent-mill find-agent <type>\n  agent-mill install-agent <source> [target] [scope]\n  agent-mill find-skill <query>\n  agent-mill install-skill <source> [scope]\n  agent-mill shop <query>\n  agent-mill create [description]\n\nEvery remote agent is verified before installation.`);
}

async function main(): Promise<void> {
  if (!command || command === "help" || command === "--help") return help();
  if (command === "find-agent") return console.log(JSON.stringify(await mill.searchAgents(rest.join(" ")), null, 2));
  if (command === "find-skill") return console.log(await mill.searchSkills(rest.join(" ")));
  if (command === "shop") return console.log(await mill.shop(rest.join(" ")));
  if (command === "install-agent") {
    const result = await mill.installAgent(rest[0], (rest[1] ?? "opencode") as never, (rest[2] ?? "user") as never);
    return console.log(result);
  }
  if (command === "install-skill") return console.log(await mill.installSkill(rest[0], (rest[1] ?? "user") as never));
  if (command === "create") {
    const description = rest.join(" ") || await input({ message: "Describe the agent you want to create:" });
    const mode = await select({ message: "How should the agent be authored?", choices: [{ name: "Generate with local Ollama", value: "ollama" }, { name: "Write it with a guided process", value: "guided" }] });
    const agent = mode === "ollama" ? await mill.createAgent(description) : { name: await input({ message: "Agent name:" }), description, tools: (await input({ message: "Tools, comma-separated (optional):" })).split(",").map((value) => value.trim()).filter(Boolean), body: await input({ message: "Instructions:" }) };
    console.log(`Saved to ${await mill.saveAgent(agent, "./agents")}`);
    return;
  }
  help();
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
