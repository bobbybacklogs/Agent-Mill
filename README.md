# Agent Mill

[![npm version](https://img.shields.io/npm/v/agent-mill?logo=npm)](https://www.npmjs.com/package/agent-mill)
[![CI](https://github.com/bobbybacklogs/Agent-Mill/actions/workflows/ci.yml/badge.svg)](https://github.com/bobbybacklogs/Agent-Mill/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.12-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Find, verify, install, and create reusable AI agents and skills from one command line tool.

## Install

```sh
npm install --global agent-mill
```

## Use It

Find agents on GitHub:

```sh
agent-mill find-agent reviewer
```

Install a verified agent or skill:

```sh
agent-mill install-agent ./reviewer.agent.md opencode user
agent-mill install-skill ./terraform-skill user
```

Browse the codex2code shop:

```sh
agent-mill shop playwright
```

Create your own agent with local Ollama or a guided prompt:

```sh
agent-mill create "Review TypeScript pull requests"
```

Agent Mill verifies agents and skills before installation. Remote instructions and scripts are never executed by Agent Mill during discovery or installation.

## Related Tools

- [portage-cli](https://www.npmjs.com/package/portage-cli)
- [skillswap](https://www.npmjs.com/package/skillswap)
- [codex2code](https://www.npmjs.com/package/codex2code)

## License

MIT
