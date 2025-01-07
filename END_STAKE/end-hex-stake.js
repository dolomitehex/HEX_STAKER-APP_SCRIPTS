const { ethers } = require("ethers");
const Safe = require('@safe-global/protocol-kit');
const { EthersAdapter } = require('@safe-global/protocol-kit');

const PULSECHAIN_RPC_URL = "https://rpc.pulsechain.com";
const provider = new ethers.providers.JsonRpcProvider(PULSECHAIN_RPC_URL);

// IMPORTANT: Never share your private key and store it securely
const privateKey = "YOUR_PRIVATE_KEY";  // Replace with your private key
const signer = new ethers.Wallet(privateKey, provider);

const hexContractAddress = "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39";
const hexAbi = [
    "function endStake(uint256 stakeIndex, uint40 stakeId) external"
];

async function connectToSafe() {
    try {
        const ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: signer
        });

        const safeAddress = "YOUR_SAFE_ADDRESS";
        const safeSdk = await Safe.default.create({
            ethAdapter,
            safeAddress
        });

        console.log("Connected to Safe:", await safeSdk.getAddress());
        return safeSdk;
    } catch (error) {
        console.error("Error connecting to Safe:", error);
        throw error;
    }
}

async function endHexStake(safe) {
    try {
        const hexContract = new ethers.Contract(hexContractAddress, hexAbi, signer);

        const stakeIndex = YOUR_STAKE_INDEX;  // Verify this is correct for your stake
        const stakeId = "YOUR_STAKE_ID";  // Replace with your actual stake ID

        // Create transaction data using the contract interface
        const iface = new ethers.utils.Interface(hexAbi);
        const data = iface.encodeFunctionData("endStake", [stakeIndex, stakeId]);

        // Create safe transaction data object
        const safeTransactionData = {
            to: hexContractAddress,
            value: "0",
            data: data,
            operation: 0, // 0 for Call, 1 for DelegateCall
            safeTxGas: 0,
            baseGas: 0,
            gasPrice: 0,
            gasToken: ethers.constants.AddressZero,
            refundReceiver: ethers.constants.AddressZero,
            nonce: await safe.getNonce()
        };

        const safeTransaction = await safe.createTransaction({
            safeTransactionData
        });

        console.log("Transaction created:", safeTransaction);
        return safeTransaction;
    } catch (error) {
        console.error("Error creating transaction:", error);
        throw error;
    }
}

async function signAndExecuteTransaction(safe, safeTransaction) {
    try {
        const signedTransaction = await safe.signTransaction(safeTransaction);
        console.log("Transaction signed");

        const txResponse = await safe.executeTransaction(signedTransaction);
        console.log("Transaction executed:", txResponse);
        return txResponse;
    } catch (error) {
        console.error("Error executing transaction:", error);
        throw error;
    }
}

async function main() {
    try {
        const safe = await connectToSafe();
        const transaction = await endHexStake(safe);
        await signAndExecuteTransaction(safe, transaction);
    } catch (error) {
        console.error("Error in main execution:", error);
        process.exit(1);
    }
}

main();