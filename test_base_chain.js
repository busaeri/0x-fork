// Test script untuk memeriksa konfigurasi Base Chain
const { ChainId } = require('@0x/contract-addresses');

// Import patch contract addresses
require('./src/contract_addresses_patch.ts');

console.log('Testing Base Chain Configuration...');

// Test 1: Check if constants can be imported
try {
    const constants = require('./lib/src/asset-swapper/utils/market_operation_utils/constants.js');
    console.log('✅ Constants imported successfully');
    
    // Test 2: Check if Base chain is in SELL_SOURCE_FILTER_BY_CHAIN_ID
    if (constants.SELL_SOURCE_FILTER_BY_CHAIN_ID[8453]) {
        console.log('✅ Base chain (8453) found in SELL_SOURCE_FILTER_BY_CHAIN_ID');
    } else {
        console.log('❌ Base chain (8453) NOT found in SELL_SOURCE_FILTER_BY_CHAIN_ID');
    }
    
    // Test 3: Check if Base chain is in DEFAULT_INTERMEDIATE_TOKENS_BY_CHAIN_ID
    if (constants.DEFAULT_INTERMEDIATE_TOKENS_BY_CHAIN_ID[8453]) {
        console.log('✅ Base chain (8453) found in DEFAULT_INTERMEDIATE_TOKENS_BY_CHAIN_ID');
        console.log('   Tokens:', constants.DEFAULT_INTERMEDIATE_TOKENS_BY_CHAIN_ID[8453]);
    } else {
        console.log('❌ Base chain (8453) NOT found in DEFAULT_INTERMEDIATE_TOKENS_BY_CHAIN_ID');
    }
    
} catch (error) {
    console.log('❌ Error importing constants:', error.message);
}

console.log('\nTesting complete!');
