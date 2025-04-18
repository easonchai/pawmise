import { Chain, PluginBase, createTool } from "@goat-sdk/core";
// import { Transaction } from "@mysten/sui/transactions";
import { z } from "zod";
import { SuiWalletClient } from "@goat-sdk/wallet-sui";

const viewBalanceParametersSchema = z.object({
  address: z
    .string()
    .describe(
      "The address to check (defaults to current wallet if not provided)",
    ),
  formatted: z.number().describe("Whether to return a human-readable format"),
});

const viewBalanceMethod = async (
  walletClient: SuiWalletClient,
  parameters: z.infer<typeof viewBalanceParametersSchema>,
) => {
  const { address, formatted } = parameters;

  const balance = await walletClient.balanceOf(address);

  if (formatted) {
    const formattedAmount = (
      Number(balance.value) /
      10 ** balance.decimals
    ).toFixed(4);
    return `${formattedAmount} ${balance.symbol}`;
  }

  return balance;
  // const tx = new Transaction();
  // const [coin] = tx.splitCoins(tx.gas, [amount]);
  // tx.transferObjects([coin], to);
  // return walletClient.sendTransaction({
  //     transaction: tx,
  // });
};

export class ViewSUIBalancePlugin extends PluginBase<SuiWalletClient> {
  constructor() {
    super("viewSUIBalance", []);
  }

  supportsChain = (chain: Chain) => chain.type === "sui";

  getTools(walletClient: SuiWalletClient) {
    const sendTool = createTool(
      {
        name: "view_balance",
        description: "View balance of an address.",
        parameters: viewBalanceParametersSchema,
      },
      // Implement the method
      (parameters: z.infer<typeof viewBalanceParametersSchema>) =>
        viewBalanceMethod(walletClient, parameters),
    );
    return [sendTool];
  }
}
