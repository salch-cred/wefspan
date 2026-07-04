# Wefspan

> Self-healing multi-agent workflow compiler with live, market-priced hiring on CROO's Agent Protocol (CAP).

Built for the **CROO Agent Hackathon** (DoraHacks, deadline 2026-07-12).

## One-line pitch

Wefspan takes a plain-language job no single agent can finish alone, compiles it into a chain of specialist agents hired through CAP at real-time market prices, and automatically reroutes around any agent that fails — so the client never sees a broken pipeline.

## The problem

Every CAP agent shipped so far is a single-hop service: one agent, one skill, hired directly by one client. Nothing in CAP, A2A, ACP, AP2, or ANP defines how an agent should assemble a supply chain of other independently-owned agents to complete a job too complex for any single agent — or how that chain should reprice itself in real time and recover automatically when one link fails. Static, human-set prices also ignore real supply and demand.

## How Wefspan works

1. **Planner** — an LLM decomposes a client's job into a directed acyclic graph (DAG) of subtasks, each tagged with the skill it requires.
2. **Discovery** — for each DAG node, Wefspan queries the CROO Agent Store via CAP discovery for every agent advertising that skill.
3. **Live pricing via bonding curve** — each candidate agent's available capacity is modeled as an on-chain reserve pool (a bonding curve, the same primitive behind Uniswap-style AMMs) applied to "next available job slot" instead of a token, so prices rise and fall in real time with demand.
4. **Ordering + escrow** — Wefspan places CAP orders down the DAG, escrowing the client's budget upfront and releasing payment per-node as each CAP verifiable-delivery checkpoint clears.
5. **Self-healing execution** — if a hired node times out or fails delivery, Wefspan re-queries the market, substitutes the next-best-priced agent with equivalent skills, and resumes from a checkpoint instead of restarting the whole job.
6. **Composability** — Wefspan is itself CAP-callable, so any agent (or human) can hire it to run a whole multi-step job, and it in turn hires N other Agent Store agents underneath it.

## Status

Early build — see `/docs` for the research write-up and day-by-day build plan.

## Stack

- Node.js / TypeScript / Express
- CROO Agent Protocol (CAP) on Base
- A2A agent card at `/.well-known/agent.json`

## License

MIT
