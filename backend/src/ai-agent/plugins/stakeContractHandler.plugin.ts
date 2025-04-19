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
  '0x0b50524fcb74867e27dc364f0cd2d66c4d466b2555933e87dca0bca8689e252d';
const lendingMarketId =
  '0x1db44eed61d40769519eac497bc6823dbff87e009a7068110c80e77eb94b9053';

const CLOCK_OBJECT_ID = '0x6'; // System clock object

const TOKENS = {
  USDC: `${contractAddress}::usdc::USDC`,
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

// const checkDepositParameterSchema = z.object({
//   humanReadable: z.boolean().describe('Returns in a human readable format'),
//   // address: z.number().describe('The address to check'),
//   // marketId: z.string().describe("The lending market object ID")
// });

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
    target: `${contractAddress}::usdc::request_tokens_for_self`,
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

  // Get the USDC tokens from the wallet
  const usdcTokens = await getCoinsOfType(walletClient, TOKENS.USDC);

  if (usdcTokens.length === 0) {
    throw new Error('No USDC found in wallet');
  }

  // Find suitable coins to use
  let totalBalance = 0;
  const tokensToUse: string[] = [];

  // Collect coins until we have enough
  for (const token of usdcTokens) {
    totalBalance += Number(token.balance);
    tokensToUse.push(token.coinObjectId);

    if (totalBalance >= actualAmount) break;
  }

  if (totalBalance < actualAmount) {
    throw new Error(
      `Insufficient USDC balance: have ${totalBalance}, need ${actualAmount}`,
    );
  }

  // Handling the coin merging and splitting
  let coinToUse: TransactionObjectArgument;

  if (tokensToUse.length === 1) {
    // If we only need one coin
    coinToUse = tx.object(tokensToUse[0]);

    // Split the exact amount if needed
    if (Number(usdcTokens[0].balance) > actualAmount) {
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
      `${contractAddress}::usdc::USDC`,
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
      `${contractAddress}::usdc::USDC`,
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

// Check deposit method
// const checkDepositMethod = async (
//   walletClient: SuiWalletClient,
//   parameters: z.infer<typeof checkDepositParameterSchema>,
// ) => {
//   const { humanReadable } = parameters;
//   const tx = new Transaction();
//   const marketId = lendingMarketId;
//   const sender = walletClient.getAddress();
//   tx.setSender(sender);
//
//   // Call the get_user_deposit function
//   tx.moveCall({
//     target: `${contractAddress}::lending_market::get_user_deposit`,
//     typeArguments: [
//       `${contractAddress}::pawmise::PAWMISE`,
//       `${contractAddress}::usdc::USDC`,
//     ],
//     arguments: [
//       tx.object(marketId), // lending market
//       tx.pure.address(sender), // user address
//     ],
//   });
//
//   // Build and send the transaction
//   await tx.build({ client: walletClient.getClient() });
//   const result = await walletClient.sendTransaction({ transaction: tx });
//   await walletClient.getClient().waitForTransaction({ digest: result.hash });
//
//   // Get the transaction effects to extract the return value
//   const effects = await walletClient.getClient().getTransactionBlock({
//     digest: result.hash,
//     options: {
//       showEffects: true,
//     },
//   });
//
//   if (
//     !effects.effects ||
//     !effects.effects.status ||
//     effects.effects.status.status !== 'success'
//   ) {
//     throw new Error('Failed to get deposit amount');
//   }
//
//   // Extract the return value from the effects
//   const returnValue = effects.effects.transactionDigest?.[0]?.[0];
//   if (!returnValue) {
//     throw new Error('No return value found');
//   }
//
//   // Convert the return value to a number
//   const amount = Number(returnValue);
//
//   return {
//     success: true,
//     txHash: result.hash,
//     amount: humanReadable ? amount / 1e9 : amount, // Convert to human readable if requested
//     marketId: marketId,
//   };
// };

export class USDCTokenPlugin extends PluginBase<SuiWalletClient> {
  constructor() {
    super('usdcContractTools', []);
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

    // const checkDepositTool = createTool(
    //   {
    //     name: 'check_deposit',
    //     description: 'Check the amount of tokens deposited by the user',
    //     parameters: checkDepositParameterSchema,
    //   },
    //   // Implement the method
    //   (parameters: z.infer<typeof checkDepositParameterSchema>) =>
    //     checkDepositMethod(walletClient, parameters),
    // );

    return [mintTokenTool, stakeTokenTool, redeemTokenTool];
  }
}
