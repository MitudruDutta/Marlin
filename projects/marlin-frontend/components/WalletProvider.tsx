"use client"
import { WalletProvider as UseWalletProvider, WalletManager, WalletId, NetworkId } from "@txnlab/use-wallet-react"
import type { ReactNode } from "react"

// Create wallet manager instance
const manager = new WalletManager({
  wallets: [
    WalletId.LUTE,
    {
      id: WalletId.WALLETCONNECT,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
        enableExplorer: true,
        explorerRecommendedWalletIds: [],
        privacyPolicyUrl: "",
        termsOfServiceUrl: "",
        themeMode: "light",
        themeVariables: {
          "--wcm-z-index": "1000",
        },
      },
    },
  ],
  defaultNetwork: NetworkId.TESTNET,
})

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  return <UseWalletProvider manager={manager}>{children}</UseWalletProvider>
}

// Export Wallet component for use in other components
export { useWallet } from "@txnlab/use-wallet-react"
