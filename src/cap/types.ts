// Types modeled on CROO's documented Order lifecycle:
// NEGOTIATION -> LOCK -> DELIVER -> CLEAR (see docs.croo.network/developer-docs/protocol-overview)

export type OrderPhase =
	| "NEGOTIATION"
	| "LOCK"
	| "DELIVER"
	| "CLEAR"
	| "REFUNDED"
	| "FAILED"

export type AgentListing = {
	agentUrl: string
	name: string
	skillTags: string[]
	/** Base USDC price before live bonding-curve adjustment. */
	basePriceUsdc: number
}

export type NegotiateOrderInput = {
	providerAgentUrl: string
	skill: string
	input: Record<string, unknown>
	/** Requester will not pay more than this, based on the quote it saw. */
	maxPriceUsdc: number
}

export type Order = {
	orderId: string
	providerAgentUrl: string
	skill: string
	priceUsdc: number
	phase: OrderPhase
	deliverable?: Record<string, unknown>
}
