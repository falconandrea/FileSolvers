# FileSolvers

## Project Description

FileSolvers is a decentralized platform designed to simplify the process of requesting and accessing specific files within the Filecoin Network. Our goal is to connect users seeking particular files with providers who can fulfill those requests in a seamless and secure manner.

## Features

FileSolvers offers a range of decentralized features designed to streamline the process of requesting and accessing specific files within the Filecoin Network:

1. **Create Requests:** Users can create requests to specify their desired files, formats, expiration dates, and rewards for fulfilling the request.

2. **Participate in Requests:** Users can participate by submitting files that meet the requested formats.

3. **Filecoin Integration:** Submitted files are stored on the Filecoin blockchain network, ensuring secure and decentralized storage.

4. **Automated Closure:** A daily cron job managed by Chainlink Automation automatically closes requests on their respective expiration dates.

5. **Winner Selection:** When a request expires, the author has the option to choose a winner from the submitted files, who will receive the specified reward.

6. **Owner Intervention:** In case the author does not select a winner, the contract owner can step in to make the decision.

7. **Unclaimed Rewards:** If no one participates in a request, the author or owner of the contract can recover the deposited funds, which will always reach the author of the request.

These features combine to create a user-friendly and efficient platform for requesting and fulfilling file-related needs within the Filecoin Network.

## Project Participation

FileSolvers was developed as part of the [Open Data Hack](https://encodeclub.notion.site/Open-Data-Hack-Powered-by-Filecoin-81ee101b984d44cd915bac6e350cbf6f), powered by Filecoin. I participated in multiple bounties during the hackathon, including:

- **FVM Bounty:** FileSolvers leverages Filecoin's FVM (Filecoin Verification Market) to securely store and retrieve data, contributing to the decentralized data economy.

- **Lighthouse Bounty:** The project integrates with Lighthouse.storage to enhance data onboarding and retrieval mechanisms, ensuring reliable and perpetual storage solutions.

- **Chainlink Bounty:** Chainlink Automation is used to automate certain contract actions, such as closing requests on their expiration dates, enhancing the functionality and reliability of the platform.

I proud to have contributed to the Open Data Hack and used cutting-edge technologies to build FileSolvers.

## Technologies Used

- [Rainbowkit](https://www.rainbowkit.com/docs/introduction): RainbowKit is a React library that makes it easy to add wallet connection to your dapp.
- [Wagmi](https://wagmi.sh/): Collection of React Hooks containing everything you need to start working with Ethereum.
- [Viem](https://viem.sh/): TypeScript Interface for Ethereum.
- [Next.js](https://nextjs.org/): A React framework.
- [TypeScript](https://www.typescriptlang.org/): A typed superset of JavaScript.
- [Filecoin](https://filecoin.io/): A decentralized storage and retrieval network.
- [Lighthouse.storage](https://lighthouse.storage/): Perpetual file storage protocol that allows you to pay once for your files and store them forever.
- [Chainlink Smart Contract Automation](https://chain.link/): Smart contract automation enables developers to trigger smart contract functions in an automated way.

## Getting Started Locally

To get started with FileSolvers locally, follow these steps:

1. Clone this repository to your local machine.
```shell
git clone https://github.com/falconandrea/FileSolvers.git
````
2. Copy `.env.example` file to `.env` file in the root directory with the required environment variables.
```shell
cp .env.example .env
```
3. Install project dependencies using npm command `npm install`.
```shell
npm install
```
4. Start the development server with `npm run dev`.
```shell
npm run dev
```
5. Access the application at [http://localhost:3000](http://localhost:3000).

## Disclaimer

FileSolvers is created for participation in a hackathon and is a work in progress. It may undergo significant changes and improvements as the project evolves.
