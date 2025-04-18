import { Chain, PluginBase, createTool } from "@goat-sdk/core";
import { z } from "zod";
import { SuiWalletClient } from "@goat-sdk/wallet-sui";

const viewBalanceParametersSchema = z.object({
    address: z.string().optional().describe("The address to check (defaults to current wallet if not provided)"),
    formatted: z.boolean().optional().describe("Whether to return a human-readable format")
});

class BalanceViewerPlugin extends PluginBase<SuiWalletClient> {
    constructor() {
        super("balanceViewer", []);
    }

    supportsChain = (chain: Chain) => chain.type === "sui";

    getTools(walletClient: SuiWalletClient) {
        const viewBalanceTool = createTool(
            {
                name: "view_balance",
                description: "Check SUI balance of an address or the current wallet",
                parameters: viewBalanceParametersSchema,
            },
            async (parameters) => {
                const address = parameters.address || walletClient.getAddress();
                const balance = await walletClient.balanceOf(address);

                if (parameters.formatted) {
                    const formattedAmount = (Number(balance.value) / 10**balance.decimals).toFixed(4);
                    return `${formattedAmount} ${balance.symbol}`;
                }

                return balance;
            },
        );
        return [viewBalanceTool];
    }
}

export const myPlugin = () => new BalanceViewerPlugin();
