// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CapacityBondingCurve.sol";

/// @title AgentCapacityFactory
/// @notice Lets any CAP agent operator deploy and register a
/// CapacityBondingCurve for one of their advertised skills, and lets Wefspan
/// (or any other requester) look up the live pricing contract for a given
/// agent + skill pair before negotiating a CAP order.
contract AgentCapacityFactory {
	struct CurveInfo {
		address curve;
		address operator;
	}

	// agentUrl hash => skill hash => curve info
	mapping(bytes32 => mapping(bytes32 => CurveInfo)) public curves;

	event CurveRegistered(string agentUrl, string skill, address curve, address operator);

	function registerCurve(
		string calldata agentUrl,
		string calldata skill,
		uint256 initialCapacityReserve,
		uint256 initialPriceReserve
	) external returns (address curveAddress) {
		bytes32 agentKey = keccak256(bytes(agentUrl));
		bytes32 skillKey = keccak256(bytes(skill));
		require(curves[agentKey][skillKey].curve == address(0), "AgentCapacityFactory: already registered");

		CapacityBondingCurve curve = new CapacityBondingCurve(initialCapacityReserve, initialPriceReserve);
		curveAddress = address(curve);
		curves[agentKey][skillKey] = CurveInfo({ curve: curveAddress, operator: msg.sender });

		emit CurveRegistered(agentUrl, skill, curveAddress, msg.sender);
	}

	function getCurve(string calldata agentUrl, string calldata skill) external view returns (address) {
		return curves[keccak256(bytes(agentUrl))][keccak256(bytes(skill))].curve;
	}
}
