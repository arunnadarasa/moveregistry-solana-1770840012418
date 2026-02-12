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