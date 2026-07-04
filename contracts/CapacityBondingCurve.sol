// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CapacityBondingCurve
/// @notice On-chain constant-product AMM applied to an agent's available
/// job-slot capacity instead of a token pair. Mirrors the logic in
/// src/pricing/bondingCurve.ts so the same pricing behaviour that is unit
/// tested off-chain can be deployed as a real, independently verifiable
/// contract on Base.
///
/// Reserves are scaled by PRECISION (1e18) to keep integer math accurate for
/// fractional USDC-equivalent prices. This contract is deliberately minimal:
/// it is a pricing oracle for a single agent/skill pair, not an escrow. Actual
/// fund custody for an Order continues to go through CAP's own CAPVault
/// contract; Wefspan only reads `quote(...)` here before calling CAP's
/// NegotiateOrder with that price as maxPriceUsdc.
contract CapacityBondingCurve {
	uint256 private constant PRECISION = 1e18;

	address public immutable owner; // the agent operator allowed to consume/release capacity
	uint256 public capacityReserve; // scaled by PRECISION
	uint256 public priceReserve; // scaled by PRECISION, USDC-equivalent units
	uint256 public immutable k; // capacityReserve * priceReserve, held constant

	event Quoted(uint256 slots, uint256 cost);
	event Consumed(uint256 slots, uint256 cost, uint256 newCapacityReserve, uint256 newPriceReserve);
	event Released(uint256 slots, uint256 newCapacityReserve, uint256 newPriceReserve);

	modifier onlyOwner() {
		require(msg.sender == owner, "CapacityBondingCurve: not owner");
		_;
	}

	constructor(uint256 initialCapacityReserve, uint256 initialPriceReserve) {
		require(initialCapacityReserve > 0 && initialPriceReserve > 0, "CapacityBondingCurve: zero reserve");
		owner = msg.sender;
		capacityReserve = initialCapacityReserve * PRECISION;
		priceReserve = initialPriceReserve * PRECISION;
		k = capacityReserve * priceReserve;
	}

	/// @notice Read-only quote for buying `slots` (whole units) of capacity right now.
	function quote(uint256 slots) public view returns (uint256 cost) {
		require(slots > 0, "CapacityBondingCurve: slots must be positive");
		uint256 slotsScaled = slots * PRECISION;
		require(slotsScaled < capacityReserve, "CapacityBondingCurve: insufficient capacity");
		uint256 newCapacityReserve = capacityReserve - slotsScaled;
		uint256 newPriceReserve = k / newCapacityReserve;
		cost = newPriceReserve - priceReserve;
	}

	/// @notice Commits a purchase of `slots` of capacity; only the agent operator
	/// (acting on a confirmed CAP order) calls this once a negotiation is accepted.
	function consume(uint256 slots) external onlyOwner returns (uint256 cost) {
		cost = quote(slots);
		uint256 slotsScaled = slots * PRECISION;
		capacityReserve -= slotsScaled;
		priceReserve = k / capacityReserve;
		emit Consumed(slots, cost, capacityReserve, priceReserve);
	}

	/// @notice Frees `slots` of capacity back up (job finished, or hire abandoned/refunded).
	function release(uint256 slots) external onlyOwner {
		require(slots > 0, "CapacityBondingCurve: slots must be positive");
		uint256 slotsScaled = slots * PRECISION;
		capacityReserve += slotsScaled;
		priceReserve = k / capacityReserve;
		emit Released(slots, capacityReserve, priceReserve);
	}

	function spotPrice() external view returns (uint256) {
		return (priceReserve * PRECISION) / capacityReserve;
	}

	function availableCapacity() external view returns (uint256) {
		return capacityReserve / PRECISION;
	}
}
