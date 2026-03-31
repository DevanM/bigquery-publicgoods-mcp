# SKILLS.md: BigQuery Polymarket PubGoods Playbook

This document defines the standard operating procedures for integrating the `polymarket` MCP server into LLM agent workflows, such as Google AI Studio or Claude. 

## Strategic Chaining

The server exposes 14 distinct tools. Effective agents do not call tools randomly; they chain them to produce composite analysis.

### The "Deep Dive" Pattern
When tasked with evaluating a specific event or market:
1.  Call `markets_pulse` to identify the most active `market_address` for a given day.
    *   *Example Insight:* "What were the most active markets globally on March 30?"
2.  Pass the `market_address` to `trades_filled` to audit the raw `maker/taker` settlement data.
    *   *Example Insight:* "Show me the last 5 trades for the 'UConn Final Four' market."
3.  Pass the `market_address` to `trades_orderflow` to calculate the `implied_prob` and taker conviction.
    *   *Example Insight:* "Is the community buying or selling the 'Illinois Final Four' market?"

### The "Actor Profile" Pattern
When tracking specific addresses or high-volume counterparties:
1.  Call `whale_movement` to locate addresses executing trades larger than $1,000.
    *   *Example Insight:* "Did any single trade over $10k move the 'Michigan Final Four' odds?"
2.  Pass the `whale_address` to `address_state` to review their complete daily `total_trades`, `total_volume_usdc`, and `bot_probability_zscore`.
    *   *Example Insight:* "Is the top profitable trader a human or a high-frequency bot?"

### The "Ecosystem Flow" Pattern
When tracking capital migration across chains:
1.  Call `flows_bridge_stablecoin` to locate Ethereum addresses depositing USDC to Polygon PoS.
    *   *Example Insight:* "Did any Ethereum whales bridge capital to trade the Final Four markets?"
2.  Call `flows_ecosystem` to verify if those addresses interacted with major DEX routers prior to placing Polymarket trades.
    *   *Example Insight:* "Are Polymarket traders using DEXs to swap tokens before betting?"

## Data Schema & Performance Optimization

When analyzing these public datasets, you must leverage Google BigQuery's native optimizations. Both `polygon_mainnet.logs` and `crypto_ethereum.logs` are massive (multi-terabyte) datasets. 

To ensure your queries are performant and cost-effective:
1.  **Mandatory Time-Partitioning**: The datasets are strictly partitioned by `DATE(block_timestamp)`. You **must** always include a hard `DATE` filter (e.g., `DATE(block_timestamp) = '2026-03-30'`) in your WHERE clause to hit the partition and minimize bytes scanned.
2.  **Event Signature Clustering**: The datasets are clustered by `topics`. For Polymarket settlement data, you **must** filter on the exact `OrderFilled` event signature: `topics[SAFE_OFFSET(0)] = '0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6'`.
3.  **Market Filtering**: The `conditionId` (Market Address) is always located in `topics[SAFE_OFFSET(1)]`. Always apply a `LOWER()` function when filtering by market address to prevent case-sensitivity bugs.
4.  **Categorical Heuristics**: Polymarket covers diverse global events. You can heuristically filter markets by analyzing the ABI-encoded `data` payload for specific hex-encoded strings. Examples include:
    *   **Politics**: Filter for 'Election' or 'President'
    *   **Sports**: Filter for 'NCAA', 'MLB', or 'NBA' (e.g., `LOWER(data) LIKE '%4e4241%'`)
    *   **Fashion & Culture**: Filter for 'Grammy', 'Oscar', or 'Fashion Week'
    *   **Tech & Science**: Filter for 'SpaceX' or 'OpenAI'

## The `$10 Cook` Protocol

The MCP utilizes a sub-second BigQuery `dryRun` API. If a query is estimated to scan >2TB ($10.00), it will return an error object.

**Handling the Block:**
*   Inform the user of the estimated scan cost.
*   Prompt the user to refine the date range.
*   **Do not** automatically retry the query with `"cook": true` unless the user explicitly provides consent.

## Visual Output Rendering

If your client interface supports markdown rendering (e.g., AI Studio, Jupyter, Roo Code), prioritize formatting:
*   Output time-series data from `trades_orderflow` or `live_sentiment` in basic markdown tables.
*   For advanced clients, generate basic Vega-Lite or Mermaid.js schema blocks to map `whale_address` interactions with the `market_address`.
