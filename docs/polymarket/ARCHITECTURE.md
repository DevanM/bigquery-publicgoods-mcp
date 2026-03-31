# Architecture & Schema: BigQuery Polymarket PubGoods

> Modern tooling for community public goods, powered by Google BigQuery.

This document outlines the technical design, data schema, and cross-chain routing architecture of the MCP server.

## 1. The Local Intelligence Bridge
The MCP server runs entirely on your local machine, creating a secure, zero-friction bridge between your preferred AI client and Google's BigQuery infrastructure.

```mermaid
graph LR
    subgraph Local Environment
        A[AI Client: Gemini CLI/Claude] <-->|Stdio Pipe / JSON-RPC| B(MCP Server: Polymarket PubGoods)
    end
    B <-->|Google Cloud SDK / ADC| C{Google BigQuery}
    C <--> D[(Polygon Public Datasets)]
```

## 2. The Zero-Simulation Settlement Schema
Polymarket's matching engine operates off-chain, but every matched trade is settled on the Polygon blockchain via the `OrderFilled` event. This MCP calculates the true market price (Implied Probability) directly from the raw EVM hexadecimal payload, requiring no external APIs.

```mermaid
classDiagram
    class OrderFilled_Event {
        +topic[0] : Signature (0xd0a0...)
        +topic[1] : conditionId (Market Address)
        +topic[2] : makerAddress (The AMM/Proxy)
        +topic[3] : takerAddress (The Community)
        +data : ABI_Encoded_Payload
    }
    class HexToNumeric_UDF {
        +decode(hex_str) : FLOAT64
    }
    class Settlement_Truth {
        +maker_amount_usdc
        +taker_amount_usdc
        +implied_probability
    }
    OrderFilled_Event --> HexToNumeric_UDF : Extracts 64-char Chunks
    HexToNumeric_UDF --> Settlement_Truth : Absolute Math Calculation
```

## 3. The Cross-Chain Capital Mesh
To understand where liquidity originates, the advanced tools (e.g., `flows_bridge_stablecoin`) perform massive cross-dataset joins. This maps the journey of a USDC dollar from an Ethereum deposit directly to a Polymarket trade on Polygon.

```mermaid
graph TD
    subgraph Ethereum Dataset
        E1[crypto_ethereum.logs] -->|Filter: PoS Bridge Topic| E2(USDC Deposits)
    end
    subgraph Polygon Dataset
        P1[goog_blockchain_polygon_mainnet_us.logs] -->|Filter: OrderFilled Topic| P2(Polymarket Trades)
    end
    E2 -->|JOIN: recipient = taker| P2
    P2 --> Result(Bridged Capital Signal)
```

## 4. On-Chain vs. Off-Chain Anatomy
When analyzing a Polymarket event page, it is critical for AI agents to understand which elements are verifiable on-chain truths versus off-chain interfaces.

*   **The Price (e.g., 65¢)**: 🔴 **ON-CHAIN**. This is the **Implied Probability** calculated in `trades_filled` by dividing Maker and Taker execution amounts.
*   **The "Buy" Execution**: 🔴 **ON-CHAIN**. Clicking buy and signing the transaction emits the **`OrderFilled`** event our server audits.
*   **The Market ID**: 🔴 **ON-CHAIN**. The `conditionId` in the URL (e.g., `0x0647...`) is the **`topics[1]`** hash we use for all dataset filters.
*   **The Order Book Depth**: ⚪ **OFF-CHAIN**. The list of resting limit orders is maintained in Polymarket's private API. We only see them once they "settle" on-chain.
*   **The Question Text**: ⚪ **OFF-CHAIN**. The human-readable string (e.g., "Will BTC hit $100k?") is generally stored in IPFS or a private database, mapped to the on-chain hash.
