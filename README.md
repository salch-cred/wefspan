# Wefspan

> Self-healing multi-agent workflow compiler with live, market-priced hiring on CROO's Agent Protocol (CAP).

Built for the **CROO Agent Hackathon** (DoraHacks, deadline 2026-07-12).

## One-line pitch

Wefspan takes a plain-language job no single agent can finish alone, compiles it into a chain of specialist agents hired through CAP at real-time market prices, and automatically reroutes around any agent that fails — so the client never sees a broken pipeline.

## The problem

Every CAP agent shipped so far is a single-hop service: one agent, one skill, hired directly by one client. Nothing in CAP, A2A, ACP, AP2, or ANP defines how an agent should assemble a supply chain of other independently-owned agents to complete a job too complex for any single agent — or how that chain should reprice itself in real time and recover automatically when one link fails. Static, human-set prices also ignore real supply and demand.

## How Wefspan works

1. **Planner** (`src/planner`) — detects known skills mentioned in a client's job request and chains them into a dependency-ordered DAG by pipeline stage (fetch/translate -> transform -> generate -> validate). Swappable for a true LLM-based decomposer later (`planJobWithLLM`).
2. **Discovery** (`src/cap/client.ts`) — for each DAG node, queries the CROO Agent Store via CAP discovery for every agent advertising that skill.
3. **Live pricing via bonding curve** (`src/pricing/bondingCurve.ts`, on-chain version in `contracts/CapacityBondingCurve.sol`) — each candidate agent's available capacity is modeled as a reserve pool: a constant-product AMM (the same primitive behind Uniswap) applied to "next available job slot" instead of a token. Prices rise and fall in real time with demand.
4. **Ordering + escrow** — orders follow CAP's documented lifecycle (`NEGOTIATION -> LOCK -> DELIVER -> CLEAR`); payment is released per-node as delivery clears.
5. **Self-healing execution** (`src/orchestrator/executor.ts`) — if a hired node fails (negotiation, payment, or delivery), the executor automatically retries the next-cheapest candidate with equivalent skills instead of failing the whole job.
6. **Composability** — Wefspan itself is CAP-callable, so any agent (or human) can hire it to run a whole multi-step job, and it in turn hires N other Agent Store agents underneath it.

## Status

Core logic is implemented and tested (14 passing tests):

- ✅ Bonding-curve capacity pricing, off-chain (`src/pricing/bondingCurve.ts`) and on-chain Solidity version (`contracts/CapacityBondingCurve.sol`, `contracts/AgentCapacityFactory.sol` — not yet deployed, see `docs/CAP_INTEGRATION.md`)
- ✅ Heuristic DAG planner detecting 7 skill types and chaining them by pipeline stage
- ✅ Self-healing CAP executor with market-based candidate ranking
- ✅ In-memory `MockCapClient` for local dev/demo, `HttpCapClient` stub for the real CAP API (exact REST paths still TODO — see `src/cap/client.ts` and `docs/CAP_INTEGRATION.md`)
- ✅ Express server exposing the A2A agent card and a `POST /jobs` endpoint
- ✅ Demo video (`video/`, rendered with Remotion) showing a full job compiled, executed, and self-healed end to end
- ⬜ Real CAP SDK wiring (needs your own agent API key from agent.croo.network — see `docs/CAP_INTEGRATION.md`)
- ⬜ On-chain contract deployment to Base Sepolia (needs a funded wallet key)
- ⬜ CROO Agent Store listing and live hosting

Run `npm run demo` to see a full job compiled and executed end to end, including a live self-healing reroute.

See `/docs/BUILD_PLAN.md` for the day-by-day plan through the July 12 deadline, and `/docs/CAP_INTEGRATION.md` for exactly what's left to go live.

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
- Solidity (on-chain bonding curve, not yet deployed)

## License

MIT
