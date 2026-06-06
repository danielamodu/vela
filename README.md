# Vela — Verifiable AI Dataset Registry

Vela is a full-stack Web3 application for publishing, discovering, and subscribing to AI training datasets with verifiable on-chain provenance. Built for the hackathon.

## Hackathon Judging Criteria Mapping

Vela was designed explicitly to meet and exceed the hackathon criteria by combining the Sui blockchain, Walrus decentralized storage, Groq-powered AI, and Tatum RPC into a cohesive, premium product.

### 1. Technical Execution & Sui Integration
* **Custom Move Contract (`vela.move`):** A fully custom registry that tokenizes datasets, tracks authorized subscribers, and handles SUI payments seamlessly. Includes an `update_price` feature for publishers.
* **Cryptographic Data Integrity:** The frontend calculates a SHA-256 hash of the dataset *before* upload, storing it as `file_hash` on the Sui contract. When a user downloads the dataset, the app recalculates the hash from the Walrus blob and strictly verifies it against the on-chain record to guarantee data provenance.
* **dApp Kit & PTBs:** Deep integration with `@mysten/dapp-kit` for wallet connections and Programmable Transaction Blocks (PTBs) to process dataset publishing and subscription payments.

### 2. Decentralized Storage (Walrus)
* **Immutable Dataset Storage:** Raw dataset CSV files are uploaded directly to the Walrus testnet.
* **AI Metadata Storage:** The AI-generated dataset cards (JSON metadata) are also stored on Walrus, ensuring that the AI's analysis of the dataset is verifiable and decentralized.

### 3. AI Capabilities (Groq LLaMA 3)
* **Automated AI Dataset Cards:** When a publisher uploads a dataset, Vela samples the data and sends it to Groq (LLaMA 3 70B). Groq generates a comprehensive Dataset Card including a summary, data type, feature extraction, potential use cases, bias warnings, and a Quality Score (1-10).
* **Interactive Chat Terminal:** Users can "Chat with the Dataset" directly from the dataset detail page. The frontend fetches the first 50 rows from the Walrus blob and provides it as context to Groq, allowing users to ask questions and explore the data before paying for a subscription.

### 4. Ecosystem Integration (Tatum)
* **Tatum Sui RPC:** All on-chain reads and API interactions use the Tatum managed Sui node (`sui-testnet.gateway.tatum.io`).
* **Publisher Trust Score (Tatum MCP):** We leverage Tatum's transaction indexing (`suix_queryTransactionBlocks`) to fetch the historical on-chain activity of dataset publishers. This data is used to calculate a dynamic "Trust Score" (0-100) displayed on the AI Dataset Card, providing a reputation metric for buyers.

### 5. User Experience & Design
* **Premium UI/UX:** Vela features a strict, modern design system utilizing a "gray canvas" aesthetic, #f3f3f3 pill buttons, no shadows, and crisp typography (Syne + SuisseIntlMono).
* **Publisher Profiles:** Dedicated profile pages (`/profile/[address]`) provide public views of a publisher's datasets, and private dashboard views for the publisher to track their SUI earnings and edit dataset prices inline.

---

## Architecture Flow

```text
User uploads dataset file
  ↓
1. Raw file → Walrus (get blob_id)
2. File sample → Groq API (get dataset card JSON)
3. Card JSON → Walrus (get card_blob_id)
4. publish_dataset PTB → Sui testnet (signed by wallet, includes SHA-256 hash)

User views dataset:
  ↓
1. Fetch Dataset object from Sui via Tatum RPC
2. Fetch Card JSON from Walrus via card_blob_id
3. Render AI Dataset Card + Tatum Trust Score + Chat Terminal

User subscribes to dataset:
  ↓
1. subscribe PTB → pay SUI to publisher
2. Download raw blob from Walrus
3. Calculate SHA-256 hash of downloaded blob
4. Verify against on-chain file_hash -> Save to disk
```

## Setup & Local Development

### 1. Install Sui CLI
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### 2. Deploy Move Contract
```bash
cd move
sui move build
sui client publish --gas-budget 100000000
```
Copy the **Package ID** and the **Registry object ID** from the output.

### 3. Configure Environment
Create `.env.local` in the root:
```env
TATUM_API_KEY=your_tatum_api_key
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_TATUM_SUI_RPC=https://sui-testnet.gateway.tatum.io
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...your_package_id
NEXT_PUBLIC_REGISTRY_ID=0x...your_registry_object_id
```

### 4. Install & Run
```bash
npm install
npm run dev
```
Open http://localhost:3000

## License
MIT
