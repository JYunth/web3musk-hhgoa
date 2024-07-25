# The Web3 Musketeers official submission for the hacker house goa garden finance task.

To set up the project, you will have to have docker and Merry installed on your machine.

After cloning the repository, first run `merry go` to activate the local development environment.
Then, run `bun install` to install all the dependencies.

To run the project on the localhost, run `bun run dev` inside the project root directory.

At the top of the page, use the METAMASK button to connect your wallet to the website.
Use `merry faucet --to <your-metamask-wallet-address>` to get some testnet funds on the WBTC wallet.

First swap WBTC to BTC to get some funds on the BTC wallet.
The BTC wallet is an OTA (one time address) wallet which gets automatically generated and filled at the bottom field using the same signer as the WBTC wallet.

Then, swap BTC to WBTC to get some funds on the WBTC wallet.
The OTA BTC wallet used in the first swap will be the source of the funds for the second swap.

