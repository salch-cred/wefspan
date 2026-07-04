import { MockCapClient } from "./cap/client"

/**
 * Seeds a MockCapClient with a small roster of agents covering the skills
 * used by the hardcoded planner templates, including one deliberately flaky
 * agent per skill group so the self-healing reroute is visible in the demo.
 */
export function createDemoCapClient(): MockCapClient {
	const cap = new MockCapClient()

	cap.registerAgent({ agentUrl: "agent://researcher-alpha", name: "Researcher Alpha", skillTags: ["web-research"], basePriceUsdc: 2, capacity: 5 })
	cap.registerAgent({ agentUrl: "agent://researcher-beta", name: "Researcher Beta", skillTags: ["web-research"], basePriceUsdc: 2.5, capacity: 8 })

	cap.registerAgent({
		agentUrl: "agent://summarizer-flaky",
		name: "Summarizer (unreliable)",
		skillTags: ["summarize"],
		basePriceUsdc: 0.8,
		capacity: 5,
		alwaysFails: true,
	})
	cap.registerAgent({ agentUrl: "agent://summarizer-reliable", name: "Summarizer Reliable", skillTags: ["summarize"], basePriceUsdc: 1.2, capacity: 10 })

	cap.registerAgent({ agentUrl: "agent://illustrator-prime", name: "Illustrator Prime", skillTags: ["generate-image"], basePriceUsdc: 4, capacity: 4 })

	cap.registerAgent({ agentUrl: "agent://translator-one", name: "Translator One", skillTags: ["translate"], basePriceUsdc: 1.5, capacity: 6 })
	cap.registerAgent({ agentUrl: "agent://schema-validator", name: "Schema Validator", skillTags: ["validate-schema"], basePriceUsdc: 0.5, capacity: 10 })

	return cap
}
