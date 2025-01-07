const ethers = require("ethers");

// Configuration
const PULSECHAIN_RPC_URL = "https://rpc.pulsechain.com";
const provider = new ethers.providers.StaticJsonRpcProvider(PULSECHAIN_RPC_URL);

// Your configuration
const privateKey = "YOUR_PRIVATE_KEY";  // Replace with your private key
const safeAddress = "YOUR_SAFE_ADDRESS"; // Replace with your Safe address
const signer = new ethers.Wallet(privateKey, provider);

// Contract addresses and ABIs
const HEX_CONTRACT = "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39";

const SAFE_ABI = [
    "function nonce() public view returns (uint256)",
    "function execTransaction(address to,uint256 value,bytes calldata data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address payable refundReceiver,bytes memory signatures) public payable returns (bool success)",
    "function getTransactionHash(address to,uint256 value,bytes memory data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 _nonce) public view returns (bytes32)"
];

const HEX_ABI = ["function endStake(uint256 stakeIndex, uint40 stakeId) external"];

async function getGasPrice() {
    try {
        // Get current gas price and add 20%
        const gasPrice = await provider.getGasPrice();
        return gasPrice.mul(120).div(100);
    } catch (error) {
        console.error("Error getting gas price:", error);
        throw error;
    }
}

// ... (keep all the initial imports and configs the same until the signHash function)

async function signHash(signer, hash) {
    // Modified signature approach
    const messageBytes = ethers.utils.arrayify(hash);
    const signature = await signer.signMessage(messageBytes);
    const sig = ethers.utils.splitSignature(signature);
    
    // The v value needs to be 1 or 0 for the Safe
    const v = (sig.v === 27) ? 0 : 1;
    
    // Return the signature in the format the Safe expects
    return ethers.utils.solidityPack(
        ['bytes32', 'bytes32', 'uint8'],
        [sig.r, sig.s, v]
    );
}

async function executeEndStake(stakeIndex, stakeId) {
    try {
        console.log("Starting HEX stake end execution...");
        console.log(`Stake Index: ${stakeIndex}, Stake ID: ${stakeId}`);
        
        // Connect to contracts
        const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, signer);
        const hexContract = new ethers.Contract(HEX_CONTRACT, HEX_ABI, provider);
        
        // Get current nonce
        const nonce = await safeContract.nonce();
        console.log("Current nonce:", nonce.toString());

        // Get current gas price with a higher multiplier
        const baseGasPrice = await provider.getGasPrice();
        const gasPrice = baseGasPrice.mul(150).div(100); // 50% higher than current
        console.log("Base gas price (Gwei):", ethers.utils.formatUnits(baseGasPrice, "gwei"));
        console.log("Using gas price (Gwei):", ethers.utils.formatUnits(gasPrice, "gwei"));

        // Encode the HEX endStake function call
        const hexData = hexContract.interface.encodeFunctionData("endStake", [
            stakeIndex,
            stakeId
        ]);
        
        console.log("Encoded transaction data:", hexData);
        
        // Transaction parameters
        const tx = {
            to: HEX_CONTRACT,
            value: "0",
            data: hexData,
            operation: 0,
            safeTxGas: "0",
            baseGas: "0",
            gasPrice: "0",
            gasToken: ethers.constants.AddressZero,
            refundReceiver: ethers.constants.AddressZero,
            nonce: nonce.toNumber()
        };

        // Get transaction hash
        const txHash = await safeContract.getTransactionHash(
            tx.to, tx.value, tx.data, tx.operation,
            tx.safeTxGas, tx.baseGas, tx.gasPrice,
            tx.gasToken, tx.refundReceiver, tx.nonce
        );
        
        console.log("Transaction hash for signing:", txHash);

        // Sign the transaction hash
        const signature = await signHash(signer, txHash);
        console.log("Generated signature:", signature);

        // Execute the transaction with explicit gas settings
        const execTxParams = {
            gasLimit: ethers.BigNumber.from(1000000), // 1M gas limit
            maxFeePerGas: gasPrice.mul(2),
            maxPriorityFeePerGas: gasPrice.div(2),
            type: 2 // EIP-1559 transaction
        };

        console.log("Executing transaction with params:", execTxParams);
        
        const execTx = await safeContract.execTransaction(
            tx.to, tx.value, tx.data, tx.operation,
            tx.safeTxGas, tx.baseGas, tx.gasPrice,
            tx.gasToken, tx.refundReceiver, signature,
            execTxParams
        );
        
        console.log("Transaction submitted! Hash:", execTx.hash);
        console.log("Explorer URL:", `https://scan.pulsechain.com/tx/${execTx.hash}`);
        
        // Wait for transaction to be mined with a longer timeout
        console.log("Waiting for transaction to be mined...");
        const receipt = await execTx.wait(1); // Wait for 1 confirmation
        
        console.log("Transaction mined!");
        console.log("Status:", receipt.status ? "Success" : "Failed");
        console.log("Block number:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        return receipt;
    } catch (error) {
        if (error.error && error.error.data) {
            try {
                const decodedError = ethers.utils.defaultAbiCoder.decode(['string'], '0x' + error.error.data.slice(10));
                console.error("Decoded error:", decodedError[0]);
            } catch (decodeError) {
                console.error("Raw error data:", error.error.data);
            }
        }
        console.error("Detailed error:", error);
        throw error;
    }
}

// ... (keep the main function the same)

async function main() {
    try {
        const stakeIndex = "YOUR_STAKE_INDEX"; // Replace with your stake index
        const stakeId = "YOUR_STAKE_ID"; // Replace with your stake ID
        
        await executeEndStake(stakeIndex, stakeId);
    } catch (error) {
        console.error("Error in main:", error);
        process.exit(1);
    }
}

main();