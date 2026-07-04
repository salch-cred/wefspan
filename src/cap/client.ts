import { CapacityBondingCurve } from "../pricing/bondingCurve"
import type { AgentListing, NegotiateOrderInput, Order } from "./types"

export type { AgentListing, NegotiateOrderInput, Order } from "./types"

/**
 * CapClient is the abstraction Wefspan's orchestrator programs against.
 * It mirrors CAP's documented runtime flow (see
 * docs.croo.network/developer-docs/protocol-overview):
 *
 *   Requester: discover -> NegotiateOrder -> PayOrder -> (await) DeliverOrder
 *   Provider:  listen for negotiations -> accept -> execute -> deliver
 *
 * `quotePrice` is Wefspan-specific: it is not part of CAP itself, it is how
 * Wefspan asks each candidate agent's bonding curve what a job slot would
 * cost right now, before committing to a negotiation.
 */
export interface CapClient {
	discoverAgents(skill: string): Promise<AgentListing[]>
	quotePrice(agentUrl: string, skill: string): Promise<number>
	negotiateOrder(input: NegotiateOrderInput): Promise<Order>
	payOrder(orderId: string): Promise<Order>
	awaitDelivery(orderId: string, timeoutMs: number): Promise<Order>
}

/**
 * HttpCapClient talks to the real CROO Agent Protocol over HTTP/SDK calls.
 *
 * NOTE: CROO's public docs describe the on-chain/off-chain architecture and
 * order lifecycle (NEGOTIATION -> LOCK -> DELIVER -> CLEAR) but the exact
 * SDK method names/REST paths must be confirmed against the Node.js SDK
 * reference (docs.croo.network/developer-docs/sdk-reference) before this
 * goes live. The shape below follows the documented flow; treat endpoint
 * paths as TODOs to verify, not settled fact.
 */
export class HttpCapClient implements CapClient {
	constructor(
		private readonly apiBaseUrl: string,
		private readonly apiKey: string,
	) {}

	private async request<T>(path: string, init?: RequestInit): Promise<T> {
		const res = await fetch(`${this.apiBaseUrl}${path}`, {
			...init,
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${this.apiKey}`,
				...(init?.headers ?? {}),
			},
		})
		if (!res.ok) {
			throw new Error(`CAP request failed: ${res.status} ${await res.text()}`)
		}
		return (await res.json()) as T
	}

	async discoverAgents(skill: string): Promise<AgentListing[]> {
		// TODO: confirm against SDK reference — modeled on the "Data Center /
		// service registry" off-chain component described in protocol-overview.
		return this.request<AgentListing[]>(`/v1/agents?skill=${encodeURIComponent(skill)}`)
	}

	async quotePrice(agentUrl: string, skill: string): Promise<number> {
		const { priceUsdc } = await this.request<{ priceUsdc: number }>(
			`/v1/agents/${encodeURIComponent(agentUrl)}/quote?skill=${encodeURIComponent(skill)}`,
		)
		return priceUsdc
	}

	async negotiateOrder(input: NegotiateOrderInput): Promise<Order> {
		return this.request<Order>("/v1/orders/negotiate", {
			method: "POST",
			body: JSON.stringify(input),
		})
	}

	async payOrder(orderId: string): Promise<Order> {
		return this.request<Order>(`/v1/orders/${orderId}/pay`, { method: "POST" })
	}

	async awaitDelivery(orderId: string, timeoutMs: number): Promise<Order> {
		const deadline = Date.now() + timeoutMs
		while (Date.now() < deadline) {
			const order = await this.request<Order>(`/v1/orders/${orderId}`)
			if (order.phase === "DELIVER" || order.phase === "CLEAR") return order
			if (order.phase === "FAILED" || order.phase === "REFUNDED") {
				throw new Error(`Order ${orderId} did not deliver: ${order.phase}`)
			}
			await new Promise((r) => setTimeout(r, 250))
		}
		throw new Error(`Order ${orderId} timed out waiting for delivery`)
	}
}

type MockAgentConfig = {
	agentUrl: string
	name: string
	skillTags: string[]
	basePriceUsdc: number
	capacity: number
	/** If true, this agent always fails after negotiation — used to test self-healing failover. */
	alwaysFails?: boolean
}

/**
 * MockCapClient simulates the CAP runtime flow in-memory so the planner and
 * self-healing executor can be built and tested without a live API key.
 * Each agent gets its own CapacityBondingCurve, so quotes genuinely move
 * with simulated demand.
 */
export class MockCapClient implements CapClient {
	private readonly agents = new Map<string, MockAgentConfig>()
	private readonly curves = new Map<string, CapacityBondingCurve>()
	private readonly orders = new Map<string, Order>()
	private orderCounter = 0

	registerAgent(config: MockAgentConfig): void {
		this.agents.set(config.agentUrl, config)
		this.curves.set(config.agentUrl, new CapacityBondingCurve(config.capacity, config.capacity * config.basePriceUsdc))
	}

	async discoverAgents(skill: string): Promise<AgentListing[]> {
		return [...this.agents.values()]
			.filter((a) => a.skillTags.includes(skill))
			.map((a) => ({ agentUrl: a.agentUrl, name: a.name, skillTags: a.skillTags, basePriceUsdc: a.basePriceUsdc }))
	}

	async quotePrice(agentUrl: string): Promise<number> {
		const curve = this.curves.get(agentUrl)
		if (!curve) throw new Error(`Unknown agent ${agentUrl}`)
		return curve.quote(1)
	}

	async negotiateOrder(input: NegotiateOrderInput): Promise<Order> {
		const config = this.agents.get(input.providerAgentUrl)
		if (!config) throw new Error(`Unknown agent ${input.providerAgentUrl}`)
		const orderId = `order-${++this.orderCounter}`
		const order: Order = {
			orderId,
			providerAgentUrl: input.providerAgentUrl,
			skill: input.skill,
			priceUsdc: 0,
			phase: "NEGOTIATION",
		}
		this.orders.set(orderId, order)
		return order
	}

	async payOrder(orderId: string): Promise<Order> {
		const order = this.orders.get(orderId)
		if (!order) throw new Error(`Unknown order ${orderId}`)
		const curve = this.curves.get(order.providerAgentUrl)!
		const price = curve.quoteAndConsume(1)
		const updated: Order = { ...order, priceUsdc: price, phase: "LOCK" }
		this.orders.set(orderId, updated)
		return updated
	}

	async awaitDelivery(orderId: string): Promise<Order> {
		const order = this.orders.get(orderId)
		if (!order) throw new Error(`Unknown order ${orderId}`)
		const config = this.agents.get(order.providerAgentUrl)!
		const curve = this.curves.get(order.providerAgentUrl)!

		if (config.alwaysFails) {
			curve.release(1) // agent frees the slot back up even though it failed
			const failed: Order = { ...order, phase: "FAILED" }
			this.orders.set(orderId, failed)
			throw new Error(`Agent ${order.providerAgentUrl} failed to deliver`)
		}

		const delivered: Order = {
			...order,
			phase: "CLEAR",
			deliverable: { result: `mock output for ${order.skill}`, from: order.providerAgentUrl },
		}
		this.orders.set(orderId, delivered)
		return delivered
	}
}
