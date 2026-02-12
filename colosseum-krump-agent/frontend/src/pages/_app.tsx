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
          // Prioritize browser extension wallets over QR code
          walletList: [
            'detected_solana_wallets', // Show detected browser extensions (Phantom, etc.) first
            // Optionally exclude QR code: 'wallet_connect_qr_solana' is not included
          ],
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