// DAG schema for a compiled job.
// A job is decomposed into nodes; each node requires a skill and depends on
// zero or more upstream nodes whose outputs feed into it.

export type DagNode = {
	id: string
	skill: string
	input: Record<string, unknown>
	dependsOn: string[]
	status: "pending" | "priced" | "ordered" | "delivered" | "failed" | "rerouted"
	assignedAgentUrl?: string
	priceQuote?: number
}

export type DagJob = {
	id: string
	clientRequest: string
	nodes: DagNode[]
	createdAt: string
}
