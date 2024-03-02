/**
 * @author Matter Labs
 * @custom:security-contact security@matterlabs.dev
 * @notice The contract used to emulate RIP-7212's P256VERIFY precompile.
 * @dev It uses `precompileCall` to call the zkEVM built-in precompiles.
 */
object "Sekp256r1" {
    code {
        return(0, 0)
    }
    object "Sekp256r1_deployed" {
        code {
            ////////////////////////////////////////////////////////////////
            //                      CONSTANTS
            ////////////////////////////////////////////////////////////////

            /// @notice Subgroup order of secp256r1, see https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md
            function SECP256K1_GROUP_SIZE() -> ret {
                ret := 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551
            }

            /// @notice Curve prime field modulus, see https://eips.ethereum.org/EIPS/eip-7212
            function PRIME_FIELD_MODULUS() -> ret {
                ret := 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff
            }

            /// @dev The gas cost of processing sekp256r1 circuit precompile.
            function SEKP256_VERIFY_GAS_COST() -> ret {
                ret := 12000
            }

            ////////////////////////////////////////////////////////////////
            //                      HELPER FUNCTIONS
            ////////////////////////////////////////////////////////////////
            
            /// @dev Packs precompile parameters into one word.
            /// Note: functions expect to work with 32/64 bits unsigned integers.
            /// Caller should ensure the type matching before!
            function unsafePackPrecompileParams(
                uint32_inputOffsetInWords,
                uint32_inputLengthInWords,
                uint32_outputOffsetInWords,
                uint32_outputLengthInWords,
                uint64_perPrecompileInterpreted
            ) -> rawParams {
                rawParams := uint32_inputOffsetInWords
                rawParams := or(rawParams, shl(32, uint32_inputLengthInWords))
                rawParams := or(rawParams, shl(64, uint32_outputOffsetInWords))
                rawParams := or(rawParams, shl(96, uint32_outputLengthInWords))
                rawParams := or(rawParams, shl(192, uint64_perPrecompileInterpreted))
            }

            /// @dev Executes the `precompileCall` opcode.
            function precompileCall(precompileParams, gasToBurn) -> ret {
                // Compiler simulation for calling `precompileCall` opcode
                ret := verbatim_2i_1o("precompile", precompileParams, gasToBurn)
            }

            ////////////////////////////////////////////////////////////////
            //                      FALLBACK
            ////////////////////////////////////////////////////////////////

            let digest := calldataload(0)
            let r := calldataload(32)
            let s := calldataload(64)
            let x := calldataload(96)
            let y := calldataload(128)

            // Validate the input by the RIP-7212 specification (Required Checks in Verification)
            let sIsInvalid := or(eq(s, 0), gt(s, sub(SECP256K1_GROUP_SIZE(), 1)))
            let rIsInvalid := or(eq(r, 0), gt(r, sub(SECP256K1_GROUP_SIZE(), 1)))

            if or(sIsInvalid, rIsInvalid) {
                return(0, 0)
            }

            // No need for us to check whether the point is on curve as it is done in the internal precompile implementation

            // Store the data in memory, so the sekp256r1 circuit will read it 
            mstore(0, digest)
            mstore(32, r)
            mstore(64, s)
            mstore(96, x)
            mstore(128, y)

            let precompileParams := unsafePackPrecompileParams(
                0, // input offset in words
                5, // input length in words (the signed digest, r, s, x, y)
                0, // output offset in words
                1, // output length in words (success)
                0  // No special meaning, sekp256r1 circuit doesn't check this value
            )
            let gasToPay := SEKP256_VERIFY_GAS_COST()

            // Check whether the call is successfully handled by the sekp256r1 circuit
            let success := precompileCall(precompileParams, gasToPay)
            let internalSuccess := mload(0)

            switch and(success, internalSuccess)
            case 0 {
                return(0, 0)
            }
            default {
                return(32, 32)
            }
        }
    }
}
