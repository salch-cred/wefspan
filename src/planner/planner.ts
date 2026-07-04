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

/**
 * Pipeline-stage heuristic planner.
 *
 * Instead of only matching whole hardcoded phrases, this detects which known
 * skills are mentioned anywhere in the request, buckets them into a rough
 * pipeline stage (fetch/translate -> transform -> generate -> validate), and
 * chains the detected skills in that order. This generalizes past the two
 * original hardcoded templates to any combination/order of these skills
 * without needing an LLM call, while keeping deterministic, testable output.
 *
 * `planJobWithLLM` below remains the wiring point for a true LLM-based
 * decomposer once one is available.
 */
type SkillDetector = {
	skill: string
	stage: number
	pattern: RegExp
}

const skillDetectors: SkillDetector[] = [
	{ skill: "web-research", stage: 1, pattern: /research|look up|find (out |information)/i },
	{ skill: "translate", stage: 1, pattern: /translat/i },
	{ skill: "extract-data", stage: 2, pattern: /extract|parse/i },
	{ skill: "summarize", stage: 2, pattern: /summar/i },
	{ skill: "generate-image", stage: 3, pattern: /image|illustrat|picture|cover art/i },
	{ skill: "generate-report", stage: 3, pattern: /report|write[- ]?up/i },
	{ skill: "validate-schema", stage: 4, pattern: /validate|verify format|schema check/i },
]

function detectSkills(request: string): SkillDetector[] {
	const matched = skillDetectors.filter((d) => d.pattern.test(request))
	// Stable sort by pipeline stage so e.g. research always precedes summarize.
	return matched.sort((a, b) => a.stage - b.stage)
}

/** Rule-based planner: detects known skills in the request and chains them by pipeline stage. */
export function planJob(clientRequest: string): DagJob {
	const detected = detectSkills(clientRequest)

	const rawNodes: TemplateNode[] =
		detected.length > 0
			? detected.map((d, i) => ({
					skill: d.skill,
					input: i === 0 ? { topic: clientRequest } : {},
					dependsOn: i === 0 ? [] : [String(i - 1)],
				}))
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
