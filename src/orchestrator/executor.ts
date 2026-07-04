import type { DagJob, DagNode } from "../planner/planner"
import type { CapClient } from "../cap/client"

export type NodeExecutionResult = {
	nodeId: string
	skill: string
	agentUrl: string
	priceUsdc: number
	deliverable: Record<string, unknown>
	/** Agents that were tried and failed before this one succeeded — empty if the first pick worked. */
	reroutedFrom: string[]
}

export type ExecutorOptions = {
	/** How many candidate agents to try (cheapest-first) before giving up on a node. */
	maxCandidatesPerNode?: number
	/** Per-order delivery timeout passed to CapClient.awaitDelivery. */
	perNodeTimeoutMs?: number
}

/**
 * SelfHealingExecutor runs a DagJob to completion:
 *  - topologically walks the DAG, running nodes once their dependencies are done
 *  - for each node, ranks candidate agents by live bonding-curve price (cheapest first)
 *  - hires the cheapest candidate; if it fails (negotiation, payment, or delivery),
 *    automatically retries the next cheapest candidate instead of failing the whole job
 */
export class SelfHealingExecutor {
	constructor(
		private readonly cap: CapClient,
		private readonly options: ExecutorOptions = {},
	) {}

	async run(job: DagJob): Promise<NodeExecutionResult[]> {
		const results = new Map<string, NodeExecutionResult>()
		const remaining = new Set(job.nodes.map((n) => n.id))
		const byId = new Map(job.nodes.map((n) => [n.id, n]))

		while (remaining.size > 0) {
			const ready = [...remaining].filter((id) => byId.get(id)!.dependsOn.every((d) => results.has(d)))
			if (ready.length === 0) {
				throw new Error("DAG deadlock: no ready nodes (cycle or missing dependency)")
			}

			// Nodes with satisfied dependencies could run concurrently; awaited in
			// sequence here for deterministic tests and simpler failure reasoning.
			for (const nodeId of ready) {
				const node = byId.get(nodeId)!
				const result = await this.executeNodeWithFailover(node)
				results.set(nodeId, result)
				remaining.delete(nodeId)
			}
		}

		return job.nodes.map((n) => results.get(n.id)!)
	}

	private async executeNodeWithFailover(node: DagNode): Promise<NodeExecutionResult> {
		const maxCandidates = this.options.maxCandidatesPerNode ?? 3
		const candidates = await this.cap.discoverAgents(node.skill)
		if (candidates.length === 0) {
			throw new Error(`No agents found for skill "${node.skill}"`)
		}

		// Rank by live bonding-curve price — the market-based hiring decision.
		const priced = await Promise.all(
			candidates.map(async (c) => ({ candidate: c, price: await this.cap.quotePrice(c.agentUrl, node.skill) })),
		)
		priced.sort((a, b) => a.price - b.price)

		const attempted: string[] = []
		let lastError: unknown

		for (let i = 0; i < Math.min(priced.length, maxCandidates); i++) {
			const { candidate, price } = priced[i]
			try {
				const order = await this.cap.negotiateOrder({
					providerAgentUrl: candidate.agentUrl,
					skill: node.skill,
					input: node.input,
					maxPriceUsdc: price,
				})
				const paid = await this.cap.payOrder(order.orderId)
				const delivered = await this.cap.awaitDelivery(paid.orderId, this.options.perNodeTimeoutMs ?? 5000)
				return {
					nodeId: node.id,
					skill: node.skill,
					agentUrl: candidate.agentUrl,
					priceUsdc: delivered.priceUsdc,
					deliverable: delivered.deliverable ?? {},
					reroutedFrom: attempted,
				}
			} catch (err) {
				// Self-healing step: this candidate failed, try the next cheapest one automatically.
				attempted.push(candidate.agentUrl)
				lastError = err
			}
		}

		throw new Error(`All candidate agents failed for skill "${node.skill}": ${String(lastError)}`)
	}
}
