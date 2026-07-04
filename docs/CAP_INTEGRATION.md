# Wiring up the real CAP API

The code currently runs against `MockCapClient` (see `src/demoAgents.ts`). These
are the exact steps to switch Wefspan over to the live CROO Agent Protocol.
None of these steps can be done by an agent on your behalf — they require your
own CROO account/wallet.

## 1. Register agents on the CROO dashboard

1. Go to https://agent.croo.network and sign in (wallet, Google, or email).
2. My Agents -> Register Agent. Do this **twice**:
   - Once for Wefspan itself (the orchestrator/requester identity).
   - Optionally again for any provider agent you want to test against, if
     you're not just hiring third-party agents already on the Agent Store.
3. Copy each Agent's API key when shown — it is shown only once.
4. On the Configure page, give Wefspan a description and skill tags
   ("orchestration", "multi-agent", "workflow").

## 2. Install the real SDK

```bash
npm install @croo-network/sdk
```

## 3. Set environment variables

Copy `.env.example` to `.env` and fill in:

```bash
CROO_API_URL="https://api.croo.network"
CROO_WS_URL="wss://api.croo.network/ws"
CROO_SDK_KEY="croo_sk_..."        # Wefspan's own agent API key
CAP_API_BASE_URL="https://api.croo.network"
CAP_API_KEY="croo_sk_..."          # same key, used by src/cap/client.ts's HttpCapClient
```

With `CAP_API_BASE_URL` and `CAP_API_KEY` set, `src/index.ts` automatically
switches from `createDemoCapClient()` (mock) to `HttpCapClient` (real).

## 4. Confirm the exact endpoint shapes

`src/cap/client.ts`'s `HttpCapClient` was written from CROO's publicly
documented architecture and order lifecycle (NEGOTIATION -> LOCK -> DELIVER ->
CLEAR), but the **exact REST paths are marked as TODOs** in that file's
comments. Before relying on it:

1. Read the Node.js SDK reference at
   https://docs.croo.network/developer-docs/sdk-reference
2. Either:
   - Replace the `fetch(...)` calls in `HttpCapClient` with the real
     `@croo-network/sdk` client calls, or
   - Correct the REST paths in `HttpCapClient` to match the documented API
     exactly.

## 5. Fund a wallet with a small amount of USDC (Base)

Gas is sponsored by CROO's paymaster — you do not need ETH. You only need a
small amount of USDC (Base network) in the Requester agent's AA wallet
address (visible on its Configure page) to pay for Order service fees.

## 6. Deploy the on-chain bonding curve (optional but part of the pitch)

`contracts/CapacityBondingCurve.sol` and `contracts/AgentCapacityFactory.sol`
implement the same constant-product pricing on-chain. To deploy to Base
Sepolia you will need:

- A Hardhat or Foundry project (not scaffolded in this repo yet — add
  `hardhat` + `@nomicfoundation/hardhat-toolbox` as dev dependencies, or a
  Foundry `forge` setup)
- A funded Base Sepolia test wallet private key (get test ETH from a Base
  Sepolia faucet)
- An RPC URL (e.g. from Alchemy or the public Base Sepolia RPC)

This step requires your own wallet key and cannot be done without it.
