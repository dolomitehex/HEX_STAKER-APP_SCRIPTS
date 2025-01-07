# HEX_STAKER-APP_SCRIPTS
Attempt to unstake and move tokens out of the buggy Staker.app wallet

when using a Gnosis Safe, the transaction typically requires multiple steps:

The transaction is first proposed (which is what our script did)
It needs to be confirmed/signed by the required number of owners (depending on your Safe's configuration)
Finally, it needs to be executed on the Safe

Since I see the transaction was proposed successfully (you have a transaction hash), you now need to:

Go to the Gnosis Safe web interface (https://app.safe.global)
Connect to PulseChain network
Open your Safe
Look for the pending transaction
Confirm and execute it from there

Or, if you prefer to do it programmatically, we can modify the script to handle the execution. Would you like me to provide a script for that?
Also, to verify:

Are you sure the stake ID (YOUR_STAKE_ID) was correct in the script?
Did you set the correct stakeIndex?


