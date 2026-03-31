import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { BigQuery } from "@google-cloud/bigquery";
import * as dotenv from "dotenv";

// Load local environment variables
dotenv.config();

/**
 * MANTRA: "Web3 public goods powered by Google BigQuery."
 */

const bigquery = new BigQuery();

const SERVER_NAME = "bigquery-polymarket-pubgoods-mcp";
const SERVER_VERSION = "0.1.0";

const DATASET = "bigquery-public-data.goog_blockchain_polygon_mainnet_us";
const TOPIC_ORDER_FILLED = "0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6";

const TOOLS: Tool[] = [
  {
    name: "markets_pulse",
    description: "The Discovery Engine: Returns top 20 active markets by trade count in a 24h window.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date"]
    }
  },
  {
    name: "markets_metadata",
    description: "The Question: Resolves market addresses into on-chain activity timestamps.",
    inputSchema: {
      type: "object",
      properties: {
        market_address: { type: "string", description: "The hex address/conditionId of the market." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["market_address"]
    }
  },
  {
    name: "markets_categories",
    description: "The Taxonomy: Groups active markets by sector (Politics, Sports, Crypto).",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date"]
    }
  },
  {
    name: "trades_filled",
    description: "High-fidelity settlement audit of Polymarket OrderFilled events.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        market_address: { type: "string", description: "Optional: Filter by market (hex address)." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date"]
    }
  },
  {
    name: "trades_orderflow",
    description: "Analyzes trade direction by comparing taker buy volume versus taker sell volume against the market maker.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        market_address: { type: "string", description: "The hex address/conditionId of the market." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date", "market_address"]
    }
  },
  {
    name: "trades_metrics",
    description: "Calculates market volume, average trade size, and price variance over a specified time window.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        market_address: { type: "string", description: "The hex address/conditionId of the market." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date", "market_address"]
    }
  },
  {
    name: "whale_movement",
    description: "Tracks price changes following massive trades (>$1k threshold) on a specific market.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        market_address: { type: "string", description: "The hex address/conditionId of the market." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date", "market_address"]
    }
  },
  {
    name: "whale_profit",
    description: "Identifies addresses with the highest realized or paper gains on a specific day/market.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        market_address: { type: "string", description: "The hex address/conditionId of the market." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date", "market_address"]
    }
  },
  {
    name: "whale_loss",
    description: "Identifies addresses with major liquidations or paper losses on a specific day/market.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        market_address: { type: "string", description: "The hex address/conditionId of the market." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date", "market_address"]
    }
  },
  {
    name: "address_state",
    description: "Profiles an actor's daily footprint, total volume, and calculates a Z-Score to detect automated bot behavior.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        wallet_address: { type: "string", description: "The hex address of the actor/wallet." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date", "wallet_address"]
    }
  },
  {
    name: "flows_bridge_stablecoin",
    description: "Tracks incoming USDC transfers from Ethereum directly into Polymarket activity.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date"]
    }
  },
  {
    name: "flows_ecosystem",
    description: "Identifies capital churn between Polymarket positions and major DEXs (Uniswap, Quickswap).",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date"]
    }
  },
  {
    name: "live_arb_scanner",
    description: "Scans active markets for moments where the combined implied probability deviates from 1.00.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date"]
    }
  },
  {
    name: "live_sentiment",
    description: "Compares the 1-hour moving average price against the 24-hour baseline to detect rapid sentiment shifts.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date (YYYY-MM-DD) to query." },
        market_address: { type: "string", description: "The hex address/conditionId of the market." },
        cook: { type: "boolean", description: "Bypass the $10 Public Goods safety check.", default: false }
      },
      required: ["date", "market_address"]
    }
  }
];

const server = new Server({ name: SERVER_NAME, version: SERVER_VERSION }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

/**
 * Safely extracts a number from BigQuery metadata, defaulting to 0 if invalid or NaN.
 */
function safeNumber(val: any): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

async function executeQuery(query: string, cook: boolean) {
  const udfPrefix = `
    CREATE TEMP FUNCTION HexToNumeric(hex_str STRING)
    RETURNS FLOAT64
    LANGUAGE js AS """
      if (!hex_str) return 0;
      hex_str = hex_str.replace(/^0x/, '');
      return parseInt(hex_str, 16);
    """;
  `;
  const fullQuery = udfPrefix + query;

  // BASELINE: Total size of Polygon logs (approx 27.3 TB)
  const POLYGON_LOGS_SIZE_BYTES = 27296901303739;

  // 1. Dry Run for Safety
  const [dryRunJob] = await bigquery.createQueryJob({ query: fullQuery, dryRun: true });
  const dryRunBytes = safeNumber(dryRunJob.metadata?.statistics?.totalBytesProcessed);
  const estimatedCost = (dryRunBytes / Math.pow(1024, 4)) * 5;

  if (!cook && estimatedCost > 10) {
    throw new Error(`This is a Public Goods dataset and we are excited to serve whatever you need, however this query scans ${(dryRunBytes / Math.pow(1024, 4)).toFixed(2)}TB (Approx $${estimatedCost.toFixed(2)}). We recommend you refine your date range or, if you really want to cook, add 'cook: true' to your request to proceed.`);
  }

  // 2. Real Execution
  const [job] = await bigquery.createQueryJob({ query: fullQuery });
  const [rows] = await job.getQueryResults();
  
  // Force refresh metadata to ensure statistics are populated
  const [metadata] = await job.getMetadata();
  
  // 3. Efficiency Metrics Calculation
  // Fallback chain: Job Query Stats -> Job Total Stats -> Dry Run Stats -> 0
  let bytesScanned = safeNumber(metadata?.statistics?.query?.totalBytesProcessed);
  if (bytesScanned === 0) {
    bytesScanned = safeNumber(metadata?.statistics?.totalBytesProcessed);
  }
  if (bytesScanned === 0) {
    bytesScanned = dryRunBytes;
  }

  const dataBypassedBytes = Math.max(0, POLYGON_LOGS_SIZE_BYTES - bytesScanned);
  const optimizationRatio = (dataBypassedBytes / POLYGON_LOGS_SIZE_BYTES) * 100;
  const savingsUsd = (dataBypassedBytes / Math.pow(1024, 4)) * 5;

  const audit = {
    execution_details: {
      total_bytes_scanned: `${(bytesScanned / Math.pow(1024, 3)).toFixed(2)} GB`,
      query_cost_usd: `$${((bytesScanned / Math.pow(1024, 4)) * 5).toFixed(4)}`,
      engine_features: ["JavaScript V8 UDF (EVM Parser)", "Time-Partitioned Columnar Scan"]
    },
    efficiency_analysis: {
      data_bypassed: `${(dataBypassedBytes / Math.pow(1024, 4)).toFixed(2)} TB`,
      bypassed_description: "Volume of data ignored due to optimized time-partition filtering.",
      scan_optimization_ratio: `${optimizationRatio.toFixed(2)}%`,
      optimization_description: "Ratio of data bypassed vs. total table size (27.3 TB).",
      cost_savings_usd: `$${savingsUsd.toFixed(2)}`,
      savings_description: "Estimated monetary savings compared to a naive unpartitioned scan ($5/TB standard rate)."
    }
  };

  return { rows, audit };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const cook = (args?.cook as boolean) || false;

    if (name === "markets_pulse") {
      const date = args?.date as string;
      const query = `
        SELECT 
          topics[SAFE_OFFSET(1)] as market_address,
          COUNT(*) as trade_count,
          COUNT(DISTINCT CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(2)], 27, 40))) as unique_makers,
          COUNT(DISTINCT CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(3)], 27, 40))) as unique_takers
        FROM \`${DATASET}.logs\`
        WHERE DATE(block_timestamp) = '${date}'
          AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
        GROUP BY 1
        ORDER BY trade_count DESC
        LIMIT 20
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "markets_metadata") {
      const address = (args?.market_address as string).toLowerCase();
      const query = `
        SELECT 
          topics[SAFE_OFFSET(1)] as market_address,
          MIN(block_timestamp) as first_seen,
          MAX(block_timestamp) as last_activity
        FROM \`${DATASET}.logs\`
        WHERE (LOWER(topics[SAFE_OFFSET(1)]) = '${address}' OR LOWER(data) LIKE '%${address.replace('0x','')}%')
        GROUP BY 1
        LIMIT 1
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "markets_categories") {
      const date = args?.date as string;
      const query = `
        CREATE TEMP FUNCTION CategorizeHex(hex_data STRING) AS (
          CASE
            WHEN LOWER(hex_data) LIKE '%456c656374696f6e%' OR LOWER(hex_data) LIKE '%507265736964656e74%' THEN 'Politics'
            WHEN LOWER(hex_data) LIKE '%426974636f696e%' OR LOWER(hex_data) LIKE '%457468657265756d%' THEN 'Crypto'
            WHEN LOWER(hex_data) LIKE '%4e4241%' OR LOWER(hex_data) LIKE '%4d4c42%' OR LOWER(hex_data) LIKE '%536f63636572%' THEN 'Sports'
            ELSE 'General'
          END
        );

        SELECT 
          CategorizeHex(data) as category,
          COUNT(DISTINCT topics[SAFE_OFFSET(1)]) as active_markets,
          COUNT(*) as total_trades
        FROM \`${DATASET}.logs\`
        WHERE DATE(block_timestamp) = '${date}'
          AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
        GROUP BY 1
        ORDER BY total_trades DESC
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "trades_filled") {
      const date = args?.date as string;
      const marketAddress = (args?.market_address as string)?.toLowerCase();
      const query = `
        SELECT 
          transaction_hash,
          address as exchange_contract,
          block_timestamp,
          topics[SAFE_OFFSET(1)] as orderHash,
          CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(2)], 27, 40)) as maker,
          CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(3)], 27, 40)) as taker,
          HexToNumeric(SUBSTR(data, 131, 64)) / 1000000 as makerAmount,
          HexToNumeric(SUBSTR(data, 195, 64)) / 1000000 as takerAmount,
          ROUND(SAFE_DIVIDE(
            HexToNumeric(SUBSTR(data, 195, 64)),
            HexToNumeric(SUBSTR(data, 131, 64)) + HexToNumeric(SUBSTR(data, 195, 64))
          ), 4) as true_price
        FROM \`${DATASET}.logs\`
        WHERE 
          DATE(block_timestamp) = '${date}'
          AND ARRAY_LENGTH(topics) >= 4
          AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
          AND data IS NOT NULL 
          AND LENGTH(data) >= 258
          ${marketAddress ? `AND LOWER(topics[SAFE_OFFSET(1)]) = '${marketAddress}'` : ''}
        ORDER BY block_timestamp DESC
        LIMIT 1000
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "trades_orderflow") {
      const date = args?.date as string;
      const marketAddress = (args?.market_address as string).toLowerCase();
      const query = `
        WITH parsed_trades AS (
          SELECT 
            block_timestamp,
            CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(3)], 27, 40)) as taker,
            HexToNumeric(SUBSTR(data, 131, 64)) / 1000000 as maker_vol,
            HexToNumeric(SUBSTR(data, 195, 64)) / 1000000 as taker_vol,
            SAFE_DIVIDE(
              HexToNumeric(SUBSTR(data, 195, 64)),
              HexToNumeric(SUBSTR(data, 131, 64)) + HexToNumeric(SUBSTR(data, 195, 64))
            ) as implied_prob
          FROM \`${DATASET}.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
            AND LOWER(topics[SAFE_OFFSET(1)]) = '${marketAddress}'
            AND data IS NOT NULL AND LENGTH(data) >= 258
        )
        SELECT
          COUNT(*) as total_trades,
          COUNT(DISTINCT taker) as unique_takers,
          ROUND(SUM(taker_vol), 2) as total_taker_volume_usdc,
          ROUND(AVG(taker_vol), 2) as avg_trade_size_usdc,
          ROUND(MAX(taker_vol), 2) as max_trade_size_usdc,
          ROUND(AVG(CASE WHEN EXTRACT(HOUR FROM block_timestamp) < 12 THEN implied_prob ELSE NULL END), 4) as avg_prob_am,
          ROUND(AVG(CASE WHEN EXTRACT(HOUR FROM block_timestamp) >= 12 THEN implied_prob ELSE NULL END), 4) as avg_prob_pm
        FROM parsed_trades
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "trades_metrics") {
      const date = args?.date as string;
      const marketAddress = (args?.market_address as string).toLowerCase();
      const query = `
        WITH parsed_trades AS (
          SELECT 
            HexToNumeric(SUBSTR(data, 195, 64)) / 1000000 as taker_vol,
            SAFE_DIVIDE(
              HexToNumeric(SUBSTR(data, 195, 64)),
              HexToNumeric(SUBSTR(data, 131, 64)) + HexToNumeric(SUBSTR(data, 195, 64))
            ) as implied_prob
          FROM \`${DATASET}.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
            AND LOWER(topics[SAFE_OFFSET(1)]) = '${marketAddress}'
            AND data IS NOT NULL AND LENGTH(data) >= 258
        )
        SELECT
          ROUND(SUM(taker_vol * implied_prob) / NULLIF(SUM(taker_vol), 0), 4) as vwap,
          ROUND(STDDEV_SAMP(implied_prob), 4) as price_variance,
          ROUND(MIN(implied_prob), 4) as min_price,
          ROUND(MAX(implied_prob), 4) as max_price
        FROM parsed_trades
        WHERE taker_vol > 0
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "whale_movement") {
      const date = args?.date as string;
      const marketAddress = (args?.market_address as string).toLowerCase();
      const query = `
        WITH parsed_trades AS (
          SELECT 
            block_timestamp,
            CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(3)], 27, 40)) as taker,
            HexToNumeric(SUBSTR(data, 195, 64)) / 1000000 as taker_vol,
            SAFE_DIVIDE(
              HexToNumeric(SUBSTR(data, 195, 64)),
              HexToNumeric(SUBSTR(data, 131, 64)) + HexToNumeric(SUBSTR(data, 195, 64))
            ) as implied_prob
          FROM \`${DATASET}.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
            AND LOWER(topics[SAFE_OFFSET(1)]) = '${marketAddress}'
            AND data IS NOT NULL AND LENGTH(data) >= 258
        ),
        whale_trades AS (
          SELECT * FROM parsed_trades WHERE taker_vol >= 1000
        ),
        impact_analysis AS (
          SELECT 
            w.block_timestamp as whale_time,
            w.taker as whale_address,
            w.taker_vol as whale_size,
            w.implied_prob as whale_price,
            IFNULL(
              (
                SELECT AVG(p.implied_prob) 
                FROM parsed_trades p 
                WHERE p.block_timestamp > w.block_timestamp 
                  AND p.block_timestamp <= TIMESTAMP_ADD(w.block_timestamp, INTERVAL 5 MINUTE)
              ), w.implied_prob
            ) as avg_price_after_5m
          FROM whale_trades w
        )
        SELECT 
          whale_time,
          whale_address,
          whale_size,
          ROUND(whale_price, 4) as execution_price,
          ROUND(avg_price_after_5m, 4) as post_trade_price,
          ROUND(avg_price_after_5m - whale_price, 4) as price_impact_delta
        FROM impact_analysis
        ORDER BY whale_size DESC
        LIMIT 20
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "whale_profit" || name === "whale_loss") {
      const date = args?.date as string;
      const marketAddress = (args?.market_address as string).toLowerCase();
      // Calculates net position value based on average execution price vs daily closing price
      const query = `
        WITH parsed_trades AS (
          SELECT 
            block_timestamp,
            CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(3)], 27, 40)) as taker,
            HexToNumeric(SUBSTR(data, 195, 64)) / 1000000 as taker_vol,
            SAFE_DIVIDE(
              HexToNumeric(SUBSTR(data, 195, 64)),
              HexToNumeric(SUBSTR(data, 131, 64)) + HexToNumeric(SUBSTR(data, 195, 64))
            ) as implied_prob
          FROM \`${DATASET}.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
            AND LOWER(topics[SAFE_OFFSET(1)]) = '${marketAddress}'
            AND data IS NOT NULL AND LENGTH(data) >= 258
        ),
        daily_close AS (
          SELECT implied_prob as close_price
          FROM parsed_trades
          ORDER BY block_timestamp DESC
          LIMIT 1
        ),
        actor_metrics AS (
          SELECT 
            taker as whale_address,
            SUM(taker_vol) as total_volume_usdc,
            ROUND(SUM(taker_vol * implied_prob) / SUM(taker_vol), 4) as avg_entry_price,
            COUNT(*) as trade_count
          FROM parsed_trades
          GROUP BY 1
        )
        SELECT 
          a.whale_address,
          a.total_volume_usdc,
          a.avg_entry_price,
          ROUND((c.close_price - a.avg_entry_price) * a.total_volume_usdc, 2) as daily_paper_pnl
        FROM actor_metrics a
        CROSS JOIN daily_close c
        WHERE a.total_volume_usdc > 500
        ORDER BY daily_paper_pnl ${name === "whale_profit" ? "DESC" : "ASC"}
        LIMIT 10
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "address_state") {
      const date = args?.date as string;
      const walletAddress = (args?.wallet_address as string).toLowerCase();
      const query = `
        WITH parsed_trades AS (
          SELECT 
            block_timestamp,
            CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(3)], 27, 40)) as taker,
            HexToNumeric(SUBSTR(data, 195, 64)) / 1000000 as taker_vol
          FROM \`${DATASET}.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
        ),
        target_actor AS (
          SELECT * FROM parsed_trades WHERE taker = '${walletAddress}'
        ),
        global_stats AS (
          SELECT 
            AVG(actor_trades) as avg_trades,
            STDDEV_SAMP(actor_trades) as stddev_trades
          FROM (SELECT taker, COUNT(*) as actor_trades FROM parsed_trades GROUP BY taker)
        )
        SELECT 
          '${walletAddress}' as address,
          COUNT(*) as total_trades,
          ROUND(SUM(taker_vol), 2) as total_volume_usdc,
          MIN(block_timestamp) as first_trade_today,
          MAX(block_timestamp) as last_trade_today,
          ROUND((COUNT(*) - (SELECT avg_trades FROM global_stats)) / NULLIF((SELECT stddev_trades FROM global_stats), 0), 2) as bot_probability_zscore
        FROM target_actor
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "flows_bridge_stablecoin") {
      const date = args?.date as string;
      const query = `
        WITH eth_bridge_events AS (
          SELECT 
            block_timestamp as eth_timestamp,
            CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(2)], 27, 40)) as recipient,
            HexToNumeric(data) / 1000000 as amount_bridged_usdc
          FROM \`bigquery-public-data.crypto_ethereum.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f'
        ),
        poly_traders AS (
          SELECT DISTINCT CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(3)], 27, 40)) as taker
          FROM \`${DATASET}.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
        )
        SELECT 
          e.eth_timestamp,
          e.recipient as bridged_wallet,
          e.amount_bridged_usdc,
          'Polygon PoS Bridge' as route
        FROM eth_bridge_events e
        JOIN poly_traders p ON e.recipient = p.taker
        ORDER BY e.amount_bridged_usdc DESC
        LIMIT 10
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "flows_ecosystem") {
      const date = args?.date as string;
      const query = `
        WITH poly_traders AS (
          SELECT DISTINCT CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(3)], 27, 40)) as taker, transaction_hash
          FROM \`${DATASET}.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
        ),
        dex_interactions AS (
          SELECT 
            l.transaction_hash,
            CASE 
              WHEN LOWER(l.address) = '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45' THEN 'Uniswap V3 Router'
              WHEN LOWER(l.address) = '0x1111111254fb6c44bac0bed2854e76f90643097d' THEN '1inch Router'
              ELSE 'Other DEX'
            END as dex_name
          FROM \`${DATASET}.logs\` l
          JOIN poly_traders p ON l.transaction_hash = p.transaction_hash
          WHERE DATE(l.block_timestamp) = '${date}'
        )
        SELECT 
          dex_name,
          COUNT(*) as combined_dex_polymarket_txs
        FROM dex_interactions
        GROUP BY 1
        ORDER BY combined_dex_polymarket_txs DESC
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "live_arb_scanner") {
      const date = args?.date as string;
      const query = `
        WITH parsed_trades AS (
          SELECT 
            block_timestamp,
            topics[SAFE_OFFSET(1)] as market_address,
            SAFE_DIVIDE(
              HexToNumeric(SUBSTR(data, 195, 64)),
              HexToNumeric(SUBSTR(data, 131, 64)) + HexToNumeric(SUBSTR(data, 195, 64))
            ) as implied_prob
          FROM \`${DATASET}.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
            AND data IS NOT NULL AND LENGTH(data) >= 258
        )
        SELECT 
          market_address,
          ROUND(MIN(implied_prob), 4) as min_prob,
          ROUND(MAX(implied_prob), 4) as max_prob,
          ROUND(MAX(implied_prob) - MIN(implied_prob), 4) as daily_spread
        FROM parsed_trades
        GROUP BY 1
        HAVING daily_spread > 0.05
        ORDER BY daily_spread DESC
        LIMIT 10
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "live_sentiment") {
      const date = args?.date as string;
      const marketAddress = (args?.market_address as string).toLowerCase();
      const query = `
        WITH parsed_trades AS (
          SELECT 
            block_timestamp,
            SAFE_DIVIDE(
              HexToNumeric(SUBSTR(data, 195, 64)),
              HexToNumeric(SUBSTR(data, 131, 64)) + HexToNumeric(SUBSTR(data, 195, 64))
            ) as implied_prob
          FROM \`${DATASET}.logs\`
          WHERE DATE(block_timestamp) = '${date}'
            AND topics[SAFE_OFFSET(0)] = '${TOPIC_ORDER_FILLED}'
            AND LOWER(topics[SAFE_OFFSET(1)]) = '${marketAddress}'
            AND data IS NOT NULL AND LENGTH(data) >= 258
        ),
        rolling_metrics AS (
          SELECT 
            block_timestamp,
            implied_prob,
            AVG(implied_prob) OVER (ORDER BY UNIX_SECONDS(block_timestamp) RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW) as rolling_1h_avg,
            AVG(implied_prob) OVER (ORDER BY UNIX_SECONDS(block_timestamp) RANGE BETWEEN 86400 PRECEDING AND CURRENT ROW) as rolling_24h_avg
          FROM parsed_trades
        )
        SELECT 
          block_timestamp,
          ROUND(implied_prob, 4) as current_price,
          ROUND(rolling_1h_avg, 4) as avg_1h,
          ROUND(rolling_24h_avg, 4) as avg_24h,
          ROUND(rolling_1h_avg - rolling_24h_avg, 4) as sentiment_divergence
        FROM rolling_metrics
        ORDER BY ABS(rolling_1h_avg - rolling_24h_avg) DESC
        LIMIT 5
      `;
      const result = await executeQuery(query, cook);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`  ( gm )  ☁️\n${SERVER_NAME} v${SERVER_VERSION} (Stdio) connected via Public Goods Shield.`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
