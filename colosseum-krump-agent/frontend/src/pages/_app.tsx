import type { AppProps } from 'next/app'
import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import '../../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'YOUR_PRIVY_APP_ID'}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#00dbde',
          walletChainType: 'solana-only', // Only show Solana wallets
          // Explicitly list Solana wallets - Phantom should be detected if installed
          walletList: [
            'phantom', // Explicitly include Phantom
            'detected_solana_wallets', // Show other detected browser extensions
            // Exclude QR code for cleaner UX on desktop
          ],
          showWalletLoginFirst: false, // Fix warning: we only have wallet login, so this should be false
        },
        // Configure external Solana wallet connectors
        // Note: solana.rpcs is only needed for embedded wallets, not external ones like Phantom
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
      }}
    >
      <Component {...pageProps} />
    </PrivyProvider>
  )
}