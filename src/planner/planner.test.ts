import { test } from "node:test"
import assert from "node:assert/strict"
import { planJob } from "./planner"

test("research+summarize+image request compiles into a 3-node linear DAG", () => {
	const job = planJob("Please research quantum batteries, summarize it, and generate a cover image")
	assert.equal(job.nodes.length, 3)
	assert.equal(job.nodes[0].skill, "web-research")
	assert.equal(job.nodes[1].skill, "summarize")
	assert.equal(job.nodes[2].skill, "generate-image")
	assert.deepEqual(job.nodes[1].dependsOn, ["0"])
	assert.deepEqual(job.nodes[2].dependsOn, ["1"])
})

test("translation request compiles into a 2-node DAG", () => {
	const job = planJob("translate this contract into Spanish and validate the schema")
	assert.equal(job.nodes.length, 2)
	assert.equal(job.nodes[0].skill, "translate")
	assert.equal(job.nodes[1].skill, "validate-schema")
})

test("unrecognized request falls back to a single generic-task node", () => {
	const job = planJob("do something nobody templated")
	assert.equal(job.nodes.length, 1)
	assert.equal(job.nodes[0].skill, "generic-task")
	assert.deepEqual(job.nodes[0].dependsOn, [])
})

test("a single detected skill compiles into a single node with no dependencies", () => {
	const job = planJob("please summarize this document")
	assert.equal(job.nodes.length, 1)
	assert.equal(job.nodes[0].skill, "summarize")
	assert.deepEqual(job.nodes[0].dependsOn, [])
})

test("skills mentioned out of pipeline order are still chained in pipeline-stage order", () => {
	const job = planJob("validate the schema after you extract the data from this report")
	assert.deepEqual(
		job.nodes.map((n) => n.skill),
		["extract-data", "generate-report", "validate-schema"],
	)
	assert.deepEqual(job.nodes[1].dependsOn, ["0"])
	assert.deepEqual(job.nodes[2].dependsOn, ["1"])
})
