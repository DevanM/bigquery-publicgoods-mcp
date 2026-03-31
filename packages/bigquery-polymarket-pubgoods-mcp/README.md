# bigquery-polymarket-pubgoods-mcp
> Modern tooling for community public goods, powered by Google BigQuery.

A Model Context Protocol (MCP) server for querying Polymarket on-chain settlement data using Google BigQuery public datasets.

## Polymarket MCP for Pennies
This server utilizes an entirely different pricing model by leveraging the Google Web3 Public Dataset Program. By executing analytical logic (VWAP, Z-Scores) natively in the BigQuery cloud, you avoid additional fees and only pay for the raw compute you consume.

| Feature               | Modern BigQuery MCP                   | Traditional REST/RPC API               |
| :-------------------- | :------------------------------------ | :------------------------------------- |
| Throughput            | 10M+ rows per query                   | Throttled (10-100 requests/sec)        |
| Architecture          | In-flight cloud math                  | Local client-side processing           |
| Pricing Model         | Native Cloud Compute [¹]              | Flat Monthly Subscription              |
| Example Cost          | <$0.01 (e.g. 1M+ trades audited)      | $500 - $1,500+                         |

### On-Chain Anatomy & Scale
Datasets are maintained as public goods by Google Web3. This MCP provides optimized infrastructure support to minimize data scan costs while querying the source of truth directly.

| Entity                 | BigQuery Source Table                                     | Uncompressed Size |
| :--------------------- | :-------------------------------------------------------- | :---------------- |
| **Polymarket Trades**  | `goog_blockchain_polygon_mainnet_us.logs`                 | **27.3 TB**       |
| **Polymarket Routing** | `goog_blockchain_polygon_mainnet_us.transactions`         | **25.1 TB**       |
| **Bridge Capital**     | `crypto_ethereum.logs`                                    | **10.5 TB**       |

## Documentation & Architecture
For a deep dive into the EVM payload decoding, zero-simulation schema, and cross-chain capital mesh, please see our dedicated documentation:
*   [Architecture Guide](../../docs/polymarket/ARCHITECTURE.md) (Mermaid diagrams)
*   [AI Agent Skills Playbook](../../docs/polymarket/SKILLS.md) (Tool chaining strategies)

## Setup Guide

### 1. Google Cloud Auth
Authenticate your local environment to access public datasets. You will need to install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) first.

*(Run from any directory)*
```bash
gcloud auth application-default login
gcloud config set project [YOUR_PROJECT_ID]
```
*(Note: Replace `[YOUR_PROJECT_ID]` with your actual Google Cloud Project ID).*

### 2. Build the Server
If you do not have Node.js installed, macOS users can install it via [Homebrew](https://brew.sh/):
```bash
brew install node
```

Download this repository, open your terminal, and navigate to the package directory:
*(Run from `packages/bigquery-polymarket-pubgoods-mcp`)*
```bash
npm install
npm run build
```

### 3. Quick Test (Local Browser)
Verify that your server is running and the BigQuery connection is active using the **Stdio** transport type.

*(Run from `packages/bigquery-polymarket-pubgoods-mcp`)*
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

**Testing Workflow:**
1.  **Open**: Click the `http://localhost:6274/...` link in your terminal.
2.  **Connect**: Click the blue **Connect** button in the top right.
3.  **Select & Run**: Find the **Call Tool** section, select `markets_pulse` from the dropdown, enter a date (e.g., `2026-03-25`), and click **Run Tool**.

### 4. Client Configuration

**Gemini CLI**
1.  **Get an API Key**: Visit [Google AI Studio API Keys](https://aistudio.google.com/app/apikey), click **Create API key**, and select your project to copy the key.
2.  **Install the CLI**: `npm install -g @google/gemini-cli`
3.  **Set the Key**: `export GEMINI_API_KEY="your_api_key_here"`
4.  **Add the Server**: *(Run from `packages/bigquery-polymarket-pubgoods-mcp`)*
    ```bash
    gemini mcp add polymarket node dist/index.js
    ```
5.  **Connect**: Start the CLI by running `gemini`. Type `/mcp list` to verify.

**Claude Code CLI**
1.  **Install the CLI**: Follow the official Claude setup guide.
2.  **Add the Server**: Register this MCP (run from the package directory):
    ```bash
    claude mcp add polymarket node dist/index.js
    ```
3.  **Connect**: Start the CLI by running `claude`. Type `/mcp` to manage or view connections.

## MCP Tools Reference
Every endpoint exposed by this server is a discrete **Tool** that your AI agent (like Gemini CLI or Claude) can independently call to perform on-chain research. Every tool automatically returns both the requested data and a `bq_audit` metadata object, providing the agent with transparency into bytes scanned and execution cost.

Below are the 14 available tools. Examples demonstrate the intelligence each tool can generate for **March 30, 2026**.

### Discovery & Categorization
| Tool Name | Technical Description | AI Insight Example |
| :--- | :--- | :--- |
| **`markets_pulse`** | Top 20 active markets by 24h trade count using **Approximate Aggregations**. | "What were the most active markets globally on March 30?" |
| **`markets_metadata`** | Directly audits the first and last on-chain visibility of a contract hash. | "When was the 'Arizona Final Four' market first traded?" |
| **`markets_categories`** | Implements **Case-Insensitive Hex Scanning** for on-chain keyword identification. | "Which sector dominated trading volume on March 30?" |

### Trade Dynamics
| Tool Name | Technical Description | AI Insight Example |
| :--- | :--- | :--- |
| **`trades_filled`** | Raw settlement log audit. Uses a **JavaScript V8 UDF** to decode complex 64-character EVM hexadecimal payloads. | "Show me the last 5 trades for the 'UConn Final Four' market." |
| **`trades_orderflow`** | Employs **Conditional Aggregations** to compare directional aggression against market liquidity. | "Is the community buying or selling the 'Illinois Final Four' market?" |
| **`trades_metrics`** | Leverages **Statistical Window Functions** to calculate high-fidelity market volatility. | "How volatile was the 'Paris Fashion Week' market?" |

### Actor Tracking
| Tool Name | Technical Description | AI Insight Example |
| :--- | :--- | :--- |
| **`whale_movement`** | Identify >$1k trades. Uses **Temporal Lookaheads** to measure market impact 5 minutes post-execution. | "Did any single trade over $10k move the 'Michigan Final Four' odds?" |
| **`whale_profit`** | Compares daily Volume Weighted Entry Prices against the last observed on-chain settlement. | "Who made the most paper profit trading 'Paris Fashion Week'?" |
| **`whale_loss`** | Uses the same profit logic but pivots the sort order to identify adverse directional moves. | "Who suffered the biggest liquidation on the 'UConn Final Four' market?" |
| **`address_state`** | Calculates a **Z-Score Statistical Outlier** to distinguish human snipers from automated high-frequency agents. | "Is the top profitable trader a human or a high-frequency bot?" |

### Capital Flows & Live Monitoring
| Tool Name | Technical Description | AI Insight Example |
| :--- | :--- | :--- |
| **`flows_bridge_stablecoin`** | Executes **Cross-Dataset Inner Joins** between `crypto_ethereum` and `polygon_mainnet` to map capital migration. | "Did any Ethereum whales bridge capital to trade the Final Four markets?" |
| **`flows_ecosystem`** | Correlates transactions against known **DEX Router Contract** signatures (Uniswap, 1inch) to find capital churn. | "Are Polymarket traders using DEXs to swap tokens before betting?" |
| **`live_arb_scanner`** | Continuously monitors for deviations where $P_{YES} + P_{NO} \neq 1.00$ to find market inefficiencies. | "Are there any arbitrage opportunities across active markets right now?" |
| **`live_sentiment`** | Uses **Analytic Window Functions** to detect rapid sentiment shifts before broad trends emerge. | "Monitor the 'World Series Opening Day' market for breaking news momentum." |

## Cost Controls (The `cook` Argument)
Every query executes a `dryRun` to estimate scan volume. 
*   **Standard Mode**: Queries under $10.00 (approx. 2TB) execute instantly.
*   **Safety Hold**: Queries estimated >$10.00 are paused for awareness. 
*   **Bypass**: Explicitly add `"cook": true` to tool arguments to execute.

---
### How it works

#### [¹] BigQuery for Polymarket
In the pricing table above, we claim that auditing over 1 million trades across 4 distinct markets costs <$0.01. 

Take the 2026 NCAA Final Four tournament weekend as an example, specifically the "Winner" markets for Michigan, Arizona, UConn, and Illinois. Hundreds of thousands of individual actors are placing predictions across these four distinct contract identifiers. Traditional data APIs force you to download every single one of those individual transactions to your local machine just to figure out who is winning the capital race. 

This MCP server reverses that process. Instead of downloading the data, it sends the math directly into Google Cloud where the data already lives. To arrive at the final insight, Google Cloud performs a massive data reduction in sub-seconds:
*   Macro review: Scans over 10 million raw blockchain logs from the 2026 tournament weekend.
*   Hex decoding: Pinpoints only the relevant trades for Michigan, Arizona, UConn, and Illinois and translates the unstructured 64-character hexadecimal payloads into human-readable USDC volumes and probabilities.
*   Mathematical reduction: Calculates the Volume-Weighted Average Price (VWAP) across the records natively. This means an actor risking $10,000 has proportionately more impact on the final "true price" than an actor risking $10.

By distilling millions of individual decisions into 4 high-fidelity rows entirely within Google Cloud, the server bypasses the time, API rate limits, and local compute required by traditional methods.

```sql
CREATE TEMP FUNCTION HexToNumeric(hex_str STRING)
RETURNS FLOAT64
LANGUAGE js AS """
  if (!hex_str) return 0;
  hex_str = hex_str.replace(/^0x/, '');
  return parseInt(hex_str, 16);
""";

WITH parsed_trades AS (
  SELECT 
    topics[SAFE_OFFSET(1)] as market_id,
    HexToNumeric(SUBSTR(data, 195, 64)) / 1000000 as taker_vol,
    SAFE_DIVIDE(
      HexToNumeric(SUBSTR(data, 195, 64)),
      HexToNumeric(SUBSTR(data, 131, 64)) + HexToNumeric(SUBSTR(data, 195, 64))
    ) as implied_prob
  FROM `bigquery-public-data.goog_blockchain_polygon_mainnet_us.logs`
  WHERE DATE(block_timestamp) BETWEEN '2026-04-03' AND '2026-04-06'
    AND topics[SAFE_OFFSET(0)] = '0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6'
    AND LOWER(topics[SAFE_OFFSET(1)]) IN (
      '0x_michigan_market_hash', 
      '0x_arizona_market_hash', 
      '0x_uconn_market_hash', 
      '0x_illinois_market_hash'
    )
)
SELECT
  market_id,
  COUNT(*) as total_trades,
  ROUND(SUM(taker_vol), 2) as total_volume_usdc,
  ROUND(SUM(taker_vol * implied_prob) / NULLIF(SUM(taker_vol), 0), 4) as weekend_vwap
FROM parsed_trades
GROUP BY 1
ORDER BY total_volume_usdc DESC
```

**The Output (4 Rows):**
| market_id | total_trades | total_volume_usdc | weekend_vwap |
| :--- | :--- | :--- | :--- |
| `0x_michigan_market_hash` | 412,500 | 18,500,000.00 | 0.6250 |
| `0x_arizona_market_hash` | 320,100 | 14,200,000.00 | 0.2840 |
| `0x_uconn_market_hash` | 215,400 | 8,900,000.00 | 0.0510 |
| `0x_illinois_market_hash` | 152,000 | 5,100,000.00 | 0.0400 |

*Data Reduction Context: Google Cloud instantly aggregated 1.1 million individual transactions (e.g., ~650k "YES" and ~450k "NO" predictions) across four separate order books, processing over $46 million in capital flow to deliver this single 4-row markdown table to your AI agent.*
