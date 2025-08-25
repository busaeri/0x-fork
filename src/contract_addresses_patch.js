// Must patch before any imports that use @0x/contract-addresses
const Module = require("module");
const originalRequire = Module.prototype.require;

// Patch the require function to intercept @0x/contract-addresses
Module.prototype.require = function (id) {
  if (id === "@0x/contract-addresses") {
    const originalModule = originalRequire.apply(this, arguments);

    // Store the original function
    const originalGetContractAddresses = originalModule.getContractAddressesForChainOrThrow;

    // Create our patched version
    function patchedGetContractAddressesForChainOrThrow(chainId) {
      // If Base chain (8453), return Base-specific contract addresses
      if (chainId === 8453) {
        return {
          // Use actual Base Chain addresses where available
          zrxToken: "0x0000000000000000000000000000000000000000", // ZRX not deployed on Base
          etherToken: "0x4200000000000000000000000000000000000006", // Base WETH
          
          // For 0x v2, these legacy addresses are not needed as the API uses Permit2/AllowanceHolder
          // But we provide placeholder addresses to prevent errors
          zeroExGovernor: "0x0000000000000000000000000000000000000000",
          zrxVault: "0x0000000000000000000000000000000000000000",
          staking: "0x0000000000000000000000000000000000000000",
          stakingProxy: "0x0000000000000000000000000000000000000000",
          erc20BridgeProxy: "0x0000000000000000000000000000000000000000",
          erc20BridgeSampler: "0x0000000000000000000000000000000000000000",
          exchangeProxyGovernor: "0x0000000000000000000000000000000000000000",
          exchangeProxy: "0x0000000000000000000000000000000000000000",
          exchangeProxyTransformerDeployer: "0x0000000000000000000000000000000000000000",
          exchangeProxyFlashWallet: "0x0000000000000000000000000000000000000000",
          exchangeProxyLiquidityProviderSandbox: "0x0000000000000000000000000000000000000000",
          zrxTreasury: "0x0000000000000000000000000000000000000000",
          transformers: {
            wethTransformer: "0x0000000000000000000000000000000000000000",
            payTakerTransformer: "0x0000000000000000000000000000000000000000",
            affiliateFeeTransformer: "0x0000000000000000000000000000000000000000",
            fillQuoteTransformer: "0x0000000000000000000000000000000000000000",
            positiveSlippageFeeTransformer: "0x0000000000000000000000000000000000000000",
          },
        };
      }

      // For all other chains, use the original implementation
      return originalGetContractAddresses(chainId);
    }

    // Replace the function in the module
    originalModule.getContractAddressesForChainOrThrow = patchedGetContractAddressesForChainOrThrow;

    return originalModule;
  }

  return originalRequire.apply(this, arguments);
};

console.log("Contract addresses patch loaded for Base chain (8453)");
console.log("⚠️  Note: 0x API v2 uses Permit2 and AllowanceHolder contracts:");
console.log("   • Permit2: 0x000000000022D473030F116dDEE9F6B43aC78BA3 (universal)");
console.log("   • AllowanceHolder: 0x0000000000001fF3684f28c67538d4D072C22734 (Base Chain)");
console.log("   • Entry points are dynamic and returned in API responses");
