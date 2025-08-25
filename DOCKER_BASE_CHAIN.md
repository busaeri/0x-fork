# Docker Commands untuk Base Chain

## Build Docker Image dengan Base Chain Support
```bash
docker-compose -f docker-compose.ubuntu.yml build --no-cache
```

## Run Docker dengan Base Chain
```bash
docker-compose -f docker-compose.ubuntu.yml up -d
```

## Check Logs
```bash
docker-compose -f docker-compose.ubuntu.yml logs -f api
```

## Test API Endpoints
```bash
# Test root endpoint
curl http://localhost:3000/

# Test sources (should work now)
curl http://localhost:3000/swap/v1/sources

# Test Base Chain quote
curl "http://localhost:3000/swap/v1/quote?sellToken=USDC&buyToken=ETH&sellAmount=1000000&chainId=8453"
```

## Environment Variables untuk Base Chain
- CHAIN_ID=8453 (Base Chain)
- ETHEREUM_RPC_URL=https://base-mainnet.g.alchemy.com/v2/XQThs8cMbJ1DlLHkOqu8R
- ZERO_EX_GAS_API_URL=https://api.0x.org/sources?chainId=8453

## Troubleshooting
1. Pastikan contract_addresses_patch.js ada di image
2. Check logs untuk error contract addresses
3. Verify RPC URL bisa diakses dari container
4. Database connection ke PostgreSQL

## Docker Compose Services
- postgres: Database untuk order storage
- api: 0x-API dengan Base Chain support
- ganache: Removed (tidak diperlukan untuk Base Chain)
