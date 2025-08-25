// Test script untuk debug Base Chain issue
require('./src/contract_addresses_patch.js');

const { getContractAddressesForChainOrThrow } = require('@0x/contract-addresses');

console.log('Testing contract addresses patch...');

try {
    const addresses = getContractAddressesForChainOrThrow(8453);
    console.log('✅ Base chain contract addresses:', addresses);
} catch (error) {
    console.log('❌ Error getting Base chain addresses:', error.message);
}

// Test other chains
try {
    const ethAddresses = getContractAddressesForChainOrThrow(1);
    console.log('✅ Ethereum addresses work:', Object.keys(ethAddresses));
} catch (error) {
    console.log('❌ Error getting Ethereum addresses:', error.message);
}

console.log('Test completed!');
