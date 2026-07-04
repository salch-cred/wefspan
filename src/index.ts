import express from "express"
import { planJob } from "./planner/planner"
import { SelfHealingExecutor } from "./orchestrator/executor"
import { createDemoCapClient } from "./demoAgents"
import { HttpCapClient, type CapClient } from "./cap/client"

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 4000

// Use the real CAP HTTP client once an API key is configured; otherwise fall
// back to the in-memory demo roster so the whole pipeline is runnable and
// testable with zero external dependencies.
const cap: CapClient =
	process.env.CAP_API_BASE_URL && process.env.CAP_API_KEY
		? new HttpCapClient(process.env.CAP_API_BASE_URL, process.env.CAP_API_KEY)
		: createDemoCapClient()

const executor = new SelfHealingExecutor(cap)

// A2A agent card — lets other agents and the CROO Agent Store discover Wefspan.
app.get("/.well-known/agent.json", (_req, res) => {
	res.json({
		name: "Wefspan",
		description:
			"Self-healing multi-agent workflow compiler with live, bonding-curve-priced hiring on CAP.",
		version: "0.1.0",
		skills: [
			{
				id: "compile-workflow",
				name: "Compile and execute a multi-agent job",
				description:
					"Decomposes a natural-language job into a DAG, hires CAP agents at live market prices, and self-heals on failure.",
				tags: ["orchestration", "cap", "multi-agent", "pricing"],
			},
		],
		capabilities: {
			streaming: false,
			pushNotifications: false,
		},
	})
})

app.get("/health", (_req, res) => {
	res.json({ status: "ok" })
})

/**
 * Main entry point: a client (human or another agent) submits a plain-language
 * job. Wefspan compiles it into a DAG, hires agents at live market prices,
 * self-heals around failures, and returns the full execution trace.
 */
app.post("/jobs", async (req, res) => {
	const request = req.body?.request
	if (typeof request !== "string" || request.trim().length === 0) {
		res.status(400).json({ error: "body must include a non-empty 'request' string" })
		return
	}

	try {
		const job = planJob(request)
		const results = await executor.run(job)
		const totalCostUsdc = results.reduce((sum, r) => sum + r.priceUsdc, 0)
		res.json({ job, results, totalCostUsdc })
	} catch (err) {
		res.status(502).json({ error: String(err instanceof Error ? err.message : err) })
	}
})

if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Wefspan listening on port ${PORT}`)
	})
}

export { app }
