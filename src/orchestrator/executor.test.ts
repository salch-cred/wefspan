import { test } from "node:test"
import assert from "node:assert/strict"
import { MockCapClient } from "../cap/client"
import { SelfHealingExecutor } from "./executor"
import type { DagJob } from "../planner/planner"

test("picks the cheapest of two healthy candidates", async () => {
	const cap = new MockCapClient()
	cap.registerAgent({ agentUrl: "agent://cheap", name: "Cheap", skillTags: ["translate"], basePriceUsdc: 1, capacity: 10 })
	cap.registerAgent({ agentUrl: "agent://expensive", name: "Expensive", skillTags: ["translate"], basePriceUsdc: 5, capacity: 10 })

	const job: DagJob = { id: "job-1", clientRequest: "translate", nodes: [{ id: "0", skill: "translate", input: {}, dependsOn: [] }] }
	const executor = new SelfHealingExecutor(cap)
	const [result] = await executor.run(job)

	assert.equal(result.agentUrl, "agent://cheap")
	assert.deepEqual(result.reroutedFrom, [])
})

test("self-heals: reroutes to the next-cheapest candidate when the cheapest one fails delivery", async () => {
	const cap = new MockCapClient()
	cap.registerAgent({
		agentUrl: "agent://flaky-cheap",
		name: "Flaky",
		skillTags: ["summarize"],
		basePriceUsdc: 1,
		capacity: 10,
		alwaysFails: true,
	})
	cap.registerAgent({ agentUrl: "agent://reliable", name: "Reliable", skillTags: ["summarize"], basePriceUsdc: 3, capacity: 10 })

	const job: DagJob = { id: "job-2", clientRequest: "summarize", nodes: [{ id: "0", skill: "summarize", input: {}, dependsOn: [] }] }
	const executor = new SelfHealingExecutor(cap)
	const [result] = await executor.run(job)

	assert.equal(result.agentUrl, "agent://reliable")
	assert.deepEqual(result.reroutedFrom, ["agent://flaky-cheap"])
	assert.ok(result.deliverable.result)
})

test("throws a clear error when every candidate for a skill fails", async () => {
	const cap = new MockCapClient()
	cap.registerAgent({
		agentUrl: "agent://always-fails",
		name: "AlwaysFails",
		skillTags: ["doomed"],
		basePriceUsdc: 1,
		capacity: 10,
		alwaysFails: true,
	})

	const job: DagJob = { id: "job-3", clientRequest: "doomed", nodes: [{ id: "0", skill: "doomed", input: {}, dependsOn: [] }] }
	const executor = new SelfHealingExecutor(cap)
	await assert.rejects(() => executor.run(job), /All candidate agents failed/)
})

test("runs a full multi-node DAG end to end, respecting dependency order", async () => {
	const cap = new MockCapClient()
	cap.registerAgent({ agentUrl: "agent://researcher", name: "Researcher", skillTags: ["web-research"], basePriceUsdc: 2, capacity: 10 })
	cap.registerAgent({ agentUrl: "agent://summarizer", name: "Summarizer", skillTags: ["summarize"], basePriceUsdc: 1, capacity: 10 })
	cap.registerAgent({ agentUrl: "agent://illustrator", name: "Illustrator", skillTags: ["generate-image"], basePriceUsdc: 4, capacity: 10 })

	const job: DagJob = {
		id: "job-4",
		clientRequest: "research, summarize, and illustrate",
		nodes: [
			{ id: "0", skill: "web-research", input: {}, dependsOn: [] },
			{ id: "1", skill: "summarize", input: {}, dependsOn: ["0"] },
			{ id: "2", skill: "generate-image", input: {}, dependsOn: ["1"] },
		],
	}
	const executor = new SelfHealingExecutor(cap)
	const results = await executor.run(job)

	assert.equal(results.length, 3)
	assert.deepEqual(results.map((r) => r.skill), ["web-research", "summarize", "generate-image"])
	assert.ok(results.every((r) => r.deliverable.result))
})
