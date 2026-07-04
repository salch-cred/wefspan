/**
 * CapacityBondingCurve — a constant-product AMM (the same primitive behind
 * Uniswap-style DEXes) applied to an agent's available job-slot capacity
 * instead of a token pair.
 *
 * Reserves:
 *   - capacityReserve: how many more job slots the agent can take right now
 *   - priceReserve: an abstract USDC-denominated reserve
 *   - k = capacityReserve * priceReserve (held constant across swaps)
 *
 * Buying `slots` of capacity is modeled exactly like an AMM swap: capacity
 * goes down, the implied price reserve goes up along the curve, and the
 * marginal price genuinely rises as the agent gets busier — instead of the
 * flat, human-set price every other agent marketplace uses today.
 */
export class CapacityBondingCurve {
	private capacityReserve: number
	private priceReserve: number
	private readonly k: number

	constructor(initialCapacityReserve: number, initialPriceReserve: number) {
		if (initialCapacityReserve <= 0 || initialPriceReserve <= 0) {
			throw new Error("reserves must be positive")
		}
		this.capacityReserve = initialCapacityReserve
		this.priceReserve = initialPriceReserve
		this.k = initialCapacityReserve * initialPriceReserve
	}

	/** Read-only quote: what would `slots` of capacity cost right now, without committing. */
	quote(slots: number): number {
		if (slots <= 0) throw new Error("slots must be positive")
		if (slots >= this.capacityReserve) return Infinity
		const newCapacityReserve = this.capacityReserve - slots
		const newPriceReserve = this.k / newCapacityReserve
		return newPriceReserve - this.priceReserve
	}

	/** Commits the purchase: mutates reserves and returns the price actually paid. */
	quoteAndConsume(slots: number): number {
		const cost = this.quote(slots)
		if (!Number.isFinite(cost)) throw new Error("insufficient capacity")
		const newCapacityReserve = this.capacityReserve - slots
		this.priceReserve = this.k / newCapacityReserve
		this.capacityReserve = newCapacityReserve
		return cost
	}

	/** Called when a job finishes (or a hire is abandoned) and capacity frees back up. */
	release(slots: number): void {
		if (slots <= 0) throw new Error("slots must be positive")
		const newCapacityReserve = this.capacityReserve + slots
		this.priceReserve = this.k / newCapacityReserve
		this.capacityReserve = newCapacityReserve
	}

	get spotPrice(): number {
		return this.priceReserve / this.capacityReserve
	}

	get availableCapacity(): number {
		return this.capacityReserve
	}
}
