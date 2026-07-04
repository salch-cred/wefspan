import express from "express"

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 4000

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

app.listen(PORT, () => {
	console.log(`Wefspan listening on port ${PORT}`)
})
