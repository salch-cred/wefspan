export type DagNode = {
	id: string
	skill: string
	input: Record<string, unknown>
	dependsOn: string[]
}

export type DagJob = {
	id: string
	clientRequest: string
	nodes: DagNode[]
}

type TemplateNode = {
	skill: string
	input: Record<string, unknown>
	dependsOn: string[]
}

type JobTemplate = {
	name: string
	matches: (request: string) => boolean
	build: (request: string) => TemplateNode[]
}

// Day-2 scope: a small set of hardcoded job templates stand in for the full
// LLM-based planner (see planJobWithLLM below for the wiring point).
const templates: JobTemplate[] = [
	{
		name: "research-summarize-illustrate",
		matches: (r) => /research/i.test(r) && /(summar|image|illustrat)/i.test(r),
		build: (r) => [
			{ skill: "web-research", input: { topic: r }, dependsOn: [] },
			{ skill: "summarize", input: {}, dependsOn: ["0"] },
			{ skill: "generate-image", input: {}, dependsOn: ["1"] },
		],
	},
	{
		name: "translate-and-validate",
		matches: (r) => /translat/i.test(r),
		build: (r) => [
			{ skill: "translate", input: { text: r }, dependsOn: [] },
			{ skill: "validate-schema", input: {}, dependsOn: ["0"] },
		],
	},
]

/** Rule-based planner used for the hackathon demo's known job types. */
export function planJob(clientRequest: string): DagJob {
	const template = templates.find((t) => t.matches(clientRequest))
	const rawNodes: TemplateNode[] = template
		? template.build(clientRequest)
		: [{ skill: "generic-task", input: { request: clientRequest }, dependsOn: [] }]

	const nodes: DagNode[] = rawNodes.map((n, i) => ({
		id: String(i),
		skill: n.skill,
		input: n.input,
		dependsOn: n.dependsOn,
	}))

	return { id: `job-${Date.now()}`, clientRequest, nodes }
}

/**
 * Wiring point for a real LLM-based decomposition (post-hackathon-demo scope).
 * Swap this in once an LLM call is available; it must return the same DagJob shape.
 */
export async function planJobWithLLM(
	clientRequest: string,
	_decompose: (request: string) => Promise<TemplateNode[]>,
): Promise<DagJob> {
	const rawNodes = await _decompose(clientRequest)
	const nodes: DagNode[] = rawNodes.map((n, i) => ({
		id: String(i),
		skill: n.skill,
		input: n.input,
		dependsOn: n.dependsOn,
	}))
	return { id: `job-${Date.now()}`, clientRequest, nodes }
}
