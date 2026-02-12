import type { AppProps } from 'next/app'
import { PrivyProvider } from '@privy-io/react-auth'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'YOUR_PRIVY_APP_ID'}
      config={{
        loginMethods: ['wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#00dbde',
        },
      }}
    >
      <Component {...pageProps} />
    </PrivyProvider>
  )
}