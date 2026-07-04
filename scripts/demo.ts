import { planJob } from "../src/planner/planner"
import { SelfHealingExecutor } from "../src/orchestrator/executor"
import { createDemoCapClient } from "../src/demoAgents"

async function main() {
	const cap = createDemoCapClient()
	const executor = new SelfHealingExecutor(cap)

	const request = "Please research quantum batteries, summarize it, and generate a cover image"
	const job = planJob(request)
	console.log("Compiled DAG:")
	console.log(JSON.stringify(job, null, 2))

	const results = await executor.run(job)
	console.log("\nExecution trace (note the self-healing reroute on the 'summarize' node):")
	for (const r of results) {
		console.log(
			`  [${r.nodeId}] ${r.skill} -> hired ${r.agentUrl} for $${r.priceUsdc.toFixed(4)} USDC` +
				(r.reroutedFrom.length > 0 ? ` (rerouted from: ${r.reroutedFrom.join(", ")})` : ""),
		)
	}

	const totalCost = results.reduce((sum, r) => sum + r.priceUsdc, 0)
	console.log(`\nTotal job cost: $${totalCost.toFixed(4)} USDC`)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
