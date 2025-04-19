import { Chain, PluginBase, createTool } from '@goat-sdk/core';
import {
  Transaction,
  TransactionObjectArgument,
} from '@mysten/sui/transactions';
import { z } from 'zod';
import { SuiWalletClient } from '@goat-sdk/wallet-sui';

interface CoinStruct {
  balance: string;
  coinObjectId: string;
  coinType: string;
  digest: string;
  previousTransaction: string;
  version: string;
}

// const contractAddress = "0x80a711cc6cc1f06067c915a672861f07c457616acb2570f0d3a7889f6f24847a";
const contractAddress =
  '0x3ba99780cae8374577a0ad2e128bdb5b6cda3574439fee8288295e0719127084';
const lendingMarketId =
  '0xcd279e79afb09db41e18906d64a11b29f9dbcb8f1c5788a7eed9324499f86116';

const CLOCK_OBJECT_ID = '0x6'; // System clock object

const TOKENS = {
  MOCK: `${contractAddress}::mock_token::MOCK_TOKEN`,
};

const mintTokenParameterSchema = z.object({
  // address: z.string().describe("The Address of wallet to mint nft to")
  // to: z.string().describe("The recipient's address"),
  amount: z.number().describe('The amount of tokens to mint'),
});

// Schema for deposit parameters
const depositParameterSchema = z.object({
  amount: z.number().describe('The amount of tokens to deposit'),
  // marketId: z.string().describe("The lending market object ID")
});

// Schema for redeem parameters
const redeemParameterSchema = z.object({
  amount: z.number().describe('The amount of tokens to redeem'),
  // marketId: z.string().describe("The lending market object ID")
});

// Helper function to get coins of a specific type
async function getCoinsOfType(walletClient: SuiWalletClient, coinType: string) {
  const client = walletClient.getClient();
  const owner = walletClient.getAddress();

  // Query for all coins of the specified type owned by this address
  const coinsResponse = await client.getCoins({
    owner,
    coinType,
  });

  return coinsResponse.data as CoinStruct[];
}

const mintTokenMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof mintTokenParameterSchema>,
) => {
  // const { to, amount } = parameters;
  const tx = new Transaction();
  const faucetId =
    '0xa017442bd11a0298c4bd918a4dd42a6b95e321538d8a8f6cc460ddfa06c532ef';

  const sender = walletClient.getAddress();
  const { amount } = parameters;
  const actualAmount = amount * 1e9;
  tx.setSender(sender);
  tx.moveCall({
    target: `${contractAddress}::mock_token::request_tokens_for_self`,
    arguments: [
      tx.object(faucetId),
      tx.pure.u64(actualAmount), // creator address (using the wallet's address)
    ],
  });

  await tx.build({ client: walletClient.getClient() });

  const result = await walletClient.sendTransaction({ transaction: tx });

  await walletClient.getClient().waitForTransaction({ digest: result.hash });

  return result;
};

// Deposit tokens method
const depositTokensMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof depositParameterSchema>,
) => {
  const { amount } = parameters;
  const tx = new Transaction();
  const actualAmount = amount * 1e9; // Convert to smallest unit (assuming 9 decimals)
  const marketId = lendingMarketId;

  const sender = walletClient.getAddress();
  tx.setSender(sender);

  // Get the MOCK tokens from the wallet
  const mockTokens = await getCoinsOfType(walletClient, TOKENS.MOCK);

  if (mockTokens.length === 0) {
    throw new Error('No MOCK tokens found in wallet');
  }

  // Find suitable coins to use
  let totalBalance = 0;
  const tokensToUse: string[] = [];

  // Collect coins until we have enough
  for (const token of mockTokens) {
    totalBalance += Number(token.balance);
    tokensToUse.push(token.coinObjectId);

    if (totalBalance >= actualAmount) break;
  }

  if (totalBalance < actualAmount) {
    throw new Error(
      `Insufficient MOCK balance: have ${totalBalance / 1e9}, need ${amount}`,
    );
  }

  // Handling the coin merging and splitting
  let coinToUse: TransactionObjectArgument;

  if (tokensToUse.length === 1) {
    // If we only need one coin
    coinToUse = tx.object(tokensToUse[0]);

    // Split the exact amount if needed
    if (Number(mockTokens[0].balance) > actualAmount) {
      [coinToUse] = tx.splitCoins(coinToUse, [actualAmount]);
    }
  } else {
    // If we need multiple coins, merge them first
    const primaryToken = tx.object(tokensToUse[0]);
    const otherTokens = tokensToUse.slice(1).map((id) => tx.object(id));

    tx.mergeCoins(primaryToken, otherTokens);

    // Then split the exact amount needed
    [coinToUse] = tx.splitCoins(primaryToken, [actualAmount]);
  }

  // Now call the deposit function
  tx.moveCall({
    target: `${contractAddress}::lending_market::deposit_liquidity_and_mint_ctokens`,
    typeArguments: [
      `${contractAddress}::pawmise::PAWMISE`,
      `${contractAddress}::mock_token::MOCK_TOKEN`,
    ],
    arguments: [
      tx.object(marketId), // lending market
      tx.pure.u64(0), // reserve_array_index (unused)
      tx.object(CLOCK_OBJECT_ID), // clock
      coinToUse, // The prepared coin
    ],
  });

  // Build and send the transaction
  await tx.build({ client: walletClient.getClient() });
  const result = await walletClient.sendTransaction({ transaction: tx });
  await walletClient.getClient().waitForTransaction({ digest: result.hash });

  return {
    success: true,
    txHash: result.hash,
    amount: amount,
    marketId: marketId,
  };
};

// Redeem tokens method
const redeemTokensMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof redeemParameterSchema>,
) => {
  const { amount } = parameters;
  const tx = new Transaction();
  // const actualAmount = amount * 1e9; // Convert to smallest unit (assuming 9 decimals)
  const marketId = lendingMarketId;
  const sender = walletClient.getAddress();
  tx.setSender(sender);
  console.log('DEBUG: ', {
    marketID: marketId,
    clock: CLOCK_OBJECT_ID,
    amount: amount,
  });

  // Call the redeem function
  const [redeemedToken] = tx.moveCall({
    target: `${contractAddress}::lending_market::redeem_ctokens_and_withdraw_liquidity`,
    typeArguments: [
      `${contractAddress}::pawmise::PAWMISE`,
      `${contractAddress}::mock_token::MOCK_TOKEN`,
    ],
    arguments: [
      tx.object(marketId), // lending market
      tx.pure.u64(0), // reserve_array_index (unused)
      tx.object(CLOCK_OBJECT_ID), // clock
      tx.pure.u64(amount), // amount to withdraw
    ],
  });

  tx.transferObjects([redeemedToken], sender);

  // Build and send the transaction
  await tx.build({ client: walletClient.getClient() });
  const result = await walletClient.sendTransaction({ transaction: tx });
  await walletClient.getClient().waitForTransaction({ digest: result.hash });

  return {
    success: true,
    txHash: result.hash,
    amount: amount,
    marketId: marketId,
    expectedWithInterest: amount * 1.1, // Based on the 10% interest rate in the contract
  };
};

export class MockTokenPlugin extends PluginBase<SuiWalletClient> {
  constructor() {
    super('mockContractTools', []);
  }

  supportsChain = (chain: Chain) => chain.type === 'sui';

  getTools(walletClient: SuiWalletClient) {
    const mintTokenTool = createTool(
      {
        name: 'mint_token',
        description: 'Mint a amount of tokens to self',
        parameters: mintTokenParameterSchema,
      },
      // Implement the method
      (parameters: z.infer<typeof mintTokenParameterSchema>) =>
        mintTokenMethod(walletClient, parameters),
    );

    const stakeTokenTool = createTool(
      {
        name: 'stake_token',
        description: 'Stake an amount of token',
        parameters: depositParameterSchema,
      },
      // Implement the method
      (parameters: z.infer<typeof depositParameterSchema>) =>
        depositTokensMethod(walletClient, parameters),
    );

    const redeemTokenTool = createTool(
      {
        name: 'redeem_token',
        description: 'Redeem staked token from a contract',
        parameters: redeemParameterSchema,
      },
      // Implement the method
      (parameters: z.infer<typeof redeemParameterSchema>) =>
        redeemTokensMethod(walletClient, parameters),
    );

    return [mintTokenTool, stakeTokenTool, redeemTokenTool];
  }
}
