import { test } from "node:test"
import assert from "node:assert/strict"
import { CapacityBondingCurve } from "./bondingCurve"

test("spot price rises as capacity is consumed", () => {
	const curve = new CapacityBondingCurve(10, 100) // 10 slots, base price ~10 USDC/slot
	const priceBefore = curve.spotPrice
	curve.quoteAndConsume(1)
	const priceAfter = curve.spotPrice
	assert.ok(priceAfter > priceBefore, "price should increase after consuming capacity")
})

test("quote matches quoteAndConsume for the same state", () => {
	const curve = new CapacityBondingCurve(10, 100)
	const quoted = curve.quote(1)
	const actual = curve.quoteAndConsume(1)
	assert.equal(quoted, actual)
})

test("release lowers price back down", () => {
	const curve = new CapacityBondingCurve(10, 100)
	curve.quoteAndConsume(3)
	const busyPrice = curve.spotPrice
	curve.release(3)
	assert.ok(curve.spotPrice < busyPrice, "price should fall after releasing capacity")
	assert.equal(curve.availableCapacity, 10)
})

test("quoting more slots than available capacity is infinite (cannot buy)", () => {
	const curve = new CapacityBondingCurve(2, 20)
	assert.equal(curve.quote(2), Infinity)
	assert.equal(curve.quote(5), Infinity)
})

test("a busier agent (less capacity) quotes a higher price than an idle one with the same base rate", () => {
	const idle = new CapacityBondingCurve(10, 100)
	const busy = new CapacityBondingCurve(10, 100)
	busy.quoteAndConsume(8) // busy agent already has 8 of 10 slots taken
	assert.ok(busy.quote(1) > idle.quote(1), "busy agent should be more expensive for the next slot")
})
