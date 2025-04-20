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

const checkDepositParameterSchema = z.object({
  humanReadable: z.boolean().describe('Returns in a human readable format'),
  // address: z.number().describe('The address to check'),
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

// Check deposit method - this uses a dev inspection call to get the deposit amount
// const checkDepositMethod = async (
//   walletClient: SuiWalletClient,
//   parameters: z.infer<typeof checkDepositParameterSchema>,
// ) => {
//   const { humanReadable = true } = parameters;
//   const sender = walletClient.getAddress();
//
//   // Create a transaction to inspect
//   const tx = new Transaction();
//   tx.setSender(sender);
//
//   // Add the function call to get user deposit
//   tx.moveCall({
//     target: `${contractAddress}::lending_market::get_user_deposit`,
//     typeArguments: [
//       `${contractAddress}::pawmise::PAWMISE`,
//       `${contractAddress}::usdc::USDC`,
//     ],
//     arguments: [tx.object(lendingMarketId), tx.pure.address(sender)],
//   });
//
//   // Build the transaction
//   await tx.build({ client: walletClient.getClient() });
//
//   // Execute in dev-inspect mode
//   const inspectResult = await walletClient
//     .getClient()
//     .devInspectTransactionBlock({
//       sender,
//       transactionBlock: tx,
//     });
//
//   // Check if the call was successful
//   if (
//     !inspectResult ||
//     !inspectResult.results ||
//     inspectResult.results.length === 0
//   ) {
//     throw new Error('Failed to get deposit information');
//   }
//
//   // Parse the returned value (a u64)
//   const returnValue = inspectResult.results[0]?.returnValues?.[0];
//   if (!returnValue) {
//     return {
//       success: true,
//       amount: 0,
//       amountHumanReadable: 0,
//       marketId: lendingMarketId,
//     };
//   }
//
//   // The return value is a base64-encoded BCS serialized u64
//   // Convert it to a number
//   const valueHex = returnValue[0];
//   if (!valueHex) {
//     return {
//       success: true,
//       amount: 0,
//       amountHumanReadable: 0,
//       marketId: lendingMarketId,
//     };
//   }
//
//   // Parse the returned value which is a BCS encoded u64
//   let amount = 0;
//   try {
//     // First remove the "0x" prefix if present
//     const hex = valueHex.startsWith('0x') ? valueHex.slice(2) : valueHex;
//
//     // Convert hex string to bytes (little endian format in BCS)
//     const bytes = new Uint8Array(
//       hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
//     );
//
//     // Convert bytes to a number (u64 in little endian format)
//     let value = 0n;
//     for (let i = 0; i < bytes.length; i++) {
//       value += BigInt(bytes[i]) << BigInt(8 * i);
//     }
//     amount = Number(value);
//   } catch (e) {
//     console.error('Error parsing return value:', e);
//     throw new Error('Failed to parse deposit amount');
//   }
//
//   return {
//     success: true,
//     amount,
//     amountHumanReadable: humanReadable ? amount / 1e9 : amount, // Convert to human readable if requested
//     marketId: lendingMarketId,
//   };
// };
const checkDepositMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof checkDepositParameterSchema>,
) => {
  const { humanReadable = true } = parameters;
  const sender = walletClient.getAddress();

  // Create a transaction to inspect
  const tx = new Transaction();
  tx.setSender(sender);

  // Add the function call to get user deposit
  tx.moveCall({
    target: `${contractAddress}::lending_market::get_user_deposit`,
    typeArguments: [
      `${contractAddress}::pawmise::PAWMISE`,
      `${contractAddress}::usdc::USDC`,
    ],
    arguments: [tx.object(lendingMarketId), tx.pure.address(sender)],
  });

  // Build the transaction
  await tx.build({ client: walletClient.getClient() });

  // Execute in dev-inspect mode
  const inspectResult = await walletClient
    .getClient()
    .devInspectTransactionBlock({
      sender,
      transactionBlock: tx,
    });

  // Check if the call was successful
  if (
    !inspectResult ||
    !inspectResult.results ||
    inspectResult.results.length === 0
  ) {
    throw new Error('Failed to get deposit information');
  }

  // The return value is a base64-encoded BCS serialized u64
  // Convert it to a number
  // Parse the returned value (a u64)
  const returnValue = inspectResult.results[0]?.returnValues?.[0];
  if (!returnValue) {
    return {
      success: true,
      amount: 0,
      amountHumanReadable: 0,
      marketId: lendingMarketId,
    };
  }

  // Parse the returned value which is a BCS encoded u64
  let amount = 0;
  try {
    // The return value can be in different formats depending on the RPC version
    // Let's handle both possible formats
    let hexString = '';

    if (Array.isArray(returnValue)) {
      // For older RPC versions, it might be an array of values
      if (
        returnValue.length > 0 &&
        returnValue[0] !== null &&
        returnValue[0] !== undefined
      ) {
        hexString = String(returnValue[0]);
      }
    } else if (typeof returnValue === 'string') {
      // For newer RPC versions, it might be a string directly
      hexString = returnValue;
    } else if (returnValue && typeof returnValue === 'object') {
      // It could also be an object with some structure
      const values = Object.values(returnValue);
      if (values.length > 0 && values[0] !== null && values[0] !== undefined) {
        // Make sure we only use stringifiable values
        const value = values[0];
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          hexString = String(value);
        } else {
          // Log what we received for debugging
          console.error('Unexpected return value type:', typeof value);
          throw new Error('Unexpected return value format from RPC');
        }
      }
    } else if (returnValue !== null && returnValue !== undefined) {
      // Fallback case for primitive values
      if (
        typeof returnValue === 'string' ||
        typeof returnValue === 'number' ||
        typeof returnValue === 'boolean'
      ) {
        hexString = String(returnValue);
      } else {
        console.error('Unexpected return value type:', typeof returnValue);
        throw new Error('Unexpected return value format from RPC');
      }
    }

    // Remove 0x prefix if present
    if (hexString.startsWith('0x')) {
      hexString = hexString.slice(2);
    }

    // Convert hex string to bytes (little endian format in BCS)
    const bytes = new Uint8Array(
      hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    );

    // Convert bytes to a number (u64 in little endian format)
    let value = 0n;
    for (let i = 0; i < bytes.length; i++) {
      value += BigInt(bytes[i]) << BigInt(8 * i);
    }
    amount = Number(value);
  } catch (e) {
    console.error('Error parsing return value:', e);
    throw new Error('Failed to parse deposit amount');
  }

  return {
    success: true,
    amount,
    amountHumanReadable: humanReadable ? amount / 1e9 : amount, // Convert to human readable if requested
    marketId: lendingMarketId,
  };
};

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

    const checkDepositTool = createTool(
      {
        name: 'check_deposit',
        description: 'Check the amount of tokens deposited by the user',
        parameters: checkDepositParameterSchema,
      },
      // Implement the method
      (parameters: z.infer<typeof checkDepositParameterSchema>) =>
        checkDepositMethod(walletClient, parameters),
    );

    return [mintTokenTool, stakeTokenTool, redeemTokenTool, checkDepositTool];
  }
}
