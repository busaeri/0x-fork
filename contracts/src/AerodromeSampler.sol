// SPDX-License-Identifier: Apache-2.0
/*

  Copyright 2020 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.6;
pragma experimental ABIEncoderV2;

import "./SamplerUtils.sol";

contract AerodromeSampler is SamplerUtils {
    /// @dev Gas limit for Aerodrome calls.
    uint256 constant private AERODROME_CALL_GAS = 150e3; // 150k

    struct AerodromeRoute {
        address from;
        address to;
        bool stable;
        address factory;
    }

    /// @dev Sample sell quotes from Aerodrome.
    /// @param router Address of the Aerodrome router contract.
    /// @param path Token route. Should be length 2.
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token amount.
    function sampleSellsFromAerodrome(
        address router,
        address[] memory path,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        require(path.length == 2, "AerodromeSampler/INVALID_PATH_LENGTH");
        
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        
        // Create route for Aerodrome (try both stable and volatile)
        AerodromeRoute[] memory routes = new AerodromeRoute[](1);
        routes[0] = AerodromeRoute({
            from: path[0],
            to: path[1], 
            stable: false, // Try volatile first
            factory: address(0) // Let router use default factory
        });

        for (uint256 i = 0; i < numSamples; i++) {
            if (takerTokenAmounts[i] == 0) {
                makerTokenAmounts[i] = 0;
                continue;
            }
            
            try this._sampleSellFromAerodrome(
                router,
                takerTokenAmounts[i],
                routes
            ) returns (uint256 amount) {
                makerTokenAmounts[i] = amount;
            } catch (bytes memory) {
                // Try stable pool if volatile fails
                routes[0].stable = true;
                try this._sampleSellFromAerodrome(
                    router,
                    takerTokenAmounts[i],
                    routes
                ) returns (uint256 amount) {
                    makerTokenAmounts[i] = amount;
                } catch (bytes memory) {
                    makerTokenAmounts[i] = 0;
                }
                // Reset to volatile for next iteration
                routes[0].stable = false;
            }
        }
    }

    /// @dev Sample buy quotes from Aerodrome.
    /// @param router Address of the Aerodrome router contract.
    /// @param path Token route. Should be length 2.
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token amount.
    function sampleBuysFromAerodrome(
        address router,
        address[] memory path,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        require(path.length == 2, "AerodromeSampler/INVALID_PATH_LENGTH");
        
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        
        // For buy quotes, we need to reverse the path
        AerodromeRoute[] memory routes = new AerodromeRoute[](1);
        routes[0] = AerodromeRoute({
            from: path[1], // Reversed for buy
            to: path[0],   // Reversed for buy
            stable: false,
            factory: address(0)
        });

        for (uint256 i = 0; i < numSamples; i++) {
            if (makerTokenAmounts[i] == 0) {
                takerTokenAmounts[i] = 0;
                continue;
            }
            
            try this._sampleBuyFromAerodrome(
                router,
                makerTokenAmounts[i],
                routes
            ) returns (uint256 amount) {
                takerTokenAmounts[i] = amount;
            } catch (bytes memory) {
                // Try stable pool if volatile fails
                routes[0].stable = true;
                try this._sampleBuyFromAerodrome(
                    router,
                    makerTokenAmounts[i],
                    routes
                ) returns (uint256 amount) {
                    takerTokenAmounts[i] = amount;
                } catch (bytes memory) {
                    takerTokenAmounts[i] = 0;
                }
                // Reset to volatile for next iteration
                routes[0].stable = false;
            }
        }
    }

    function _sampleSellFromAerodrome(
        address router,
        uint256 takerTokenAmount,
        AerodromeRoute[] memory routes
    )
        public
        view
        returns (uint256 makerTokenAmount)
    {
        (bool success, bytes memory resultData) = router.staticcall{gas: AERODROME_CALL_GAS}(
            abi.encodeWithSignature(
                "getAmountsOut(uint256,(address,address,bool,address)[])",
                takerTokenAmount,
                routes
            )
        );
        if (!success) {
            return 0;
        }
        uint256[] memory amounts = abi.decode(resultData, (uint256[]));
        if (amounts.length < 2) {
            return 0;
        }
        return amounts[amounts.length - 1];
    }

    function _sampleBuyFromAerodrome(
        address router,
        uint256 makerTokenAmount,
        AerodromeRoute[] memory routes
    )
        public
        view
        returns (uint256 takerTokenAmount)
    {
        // For buy operations, we need to estimate the input amount
        // This is more complex and may require iterative approximation
        // For now, we'll return 0 to indicate buy quotes aren't supported
        return 0;
    }
}
