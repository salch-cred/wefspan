# Wefspan

> Self-healing multi-agent workflow compiler with live, market-priced hiring on CROO's Agent Protocol (CAP).

Built for the **CROO Agent Hackathon** (DoraHacks, deadline 2026-07-12).

## One-line pitch

Wefspan takes a plain-language job no single agent can finish alone, compiles it into a chain of specialist agents hired through CAP at real-time market prices, and automatically reroutes around any agent that fails — so the client never sees a broken pipeline.

## The problem

Every CAP agent shipped so far is a single-hop service: one agent, one skill, hired directly by one client. Nothing in CAP, A2A, ACP, AP2, or ANP defines how an agent should assemble a supply chain of other independently-owned agents to complete a job too complex for any single agent — or how that chain should reprice itself in real time and recover automatically when one link fails. Static, human-set prices also ignore real supply and demand.

## How Wefspan works

1. **Planner** (`src/planner`) — decomposes a client's job into a directed acyclic graph (DAG) of skill-tagged subtasks. Hardcoded templates for the demo; swappable for an LLM-based decomposer later (`planJobWithLLM`).
2. **Discovery** (`src/cap/client.ts`) — for each DAG node, queries the CROO Agent Store via CAP discovery for every agent advertising that skill.
3. **Live pricing via bonding curve** (`src/pricing/bondingCurve.ts`) — each candidate agent's available capacity is modeled as an on-chain-style reserve pool: a constant-product AMM (the same primitive behind Uniswap) applied to "next available job slot" instead of a token. Prices rise and fall in real time with simulated demand.
4. **Ordering + escrow** — orders follow CAP's documented lifecycle (`NEGOTIATION -> LOCK -> DELIVER -> CLEAR`); payment is released per-node as delivery clears.
5. **Self-healing execution** (`src/orchestrator/executor.ts`) — if a hired node fails (negotiation, payment, or delivery), the executor automatically retries the next-cheapest candidate with equivalent skills instead of failing the whole job.
6. **Composability** — Wefspan itself is CAP-callable, so any agent (or human) can hire it to run a whole multi-step job, and it in turn hires N other Agent Store agents underneath it.

## Status

Core logic is implemented and tested:

- ✅ Bonding-curve capacity pricing (`src/pricing/bondingCurve.ts` + 5 tests)
- ✅ DAG planner with 2 job templates + fallback (`src/planner/planner.ts` + 3 tests)
- ✅ Self-healing CAP executor with market-based candidate ranking (`src/orchestrator/executor.ts` + 4 tests)
- ✅ In-memory `MockCapClient` for local dev/demo, `HttpCapClient` stub for the real CAP API (TODO: confirm exact REST paths against the SDK reference before going live — see comments in `src/cap/client.ts`)
- ✅ Express server exposing the A2A agent card and a `POST /jobs` endpoint
- ⬜ Real CAP SDK wiring, on-chain bonding curve contract on Base Sepolia, Agent Store listing, demo video

Run `npm run demo` to see a full job compiled and executed end to end, including a live self-healing reroute.

See `/docs/BUILD_PLAN.md` for the day-by-day plan through the July 12 deadline.

## Development

```bash
npm install
npm test    # runs all unit tests (node:test)
npm run demo  # runs a sample job end to end against the mock CAP client
npm run dev   # starts the Express server
```

## Stack

- Node.js / TypeScript / Express
- CROO Agent Protocol (CAP) on Base
- A2A agent card at `/.well-known/agent.json`

## License

MIT
