import Head from 'next/head'
import dynamic from 'next/dynamic'

const MoveMint = dynamic(() => import('../components/MoveMint'), { ssr: false })

export default function Home() {
  return (
    <>
      <Head>
        <title>MoveRegistry — On-Chain Dance Move Attribution</title>
        <meta name="description" content="Mint your dance moves as NFTs with on-chain verification and automatic royalties using Solana and x402." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
          <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #00dbde, #fc00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MoveRegistry
            </h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
              On-chain attribution and verification for dance moves
            </p>
            <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '0.5rem' }}>
              Built for Colosseum Agent Hackathon by Asura (RyuAsura Dojo)
            </p>
          </header>

          <section style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: 12 }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Mint Your Move</h2>
            <MoveMint />
          </section>
        </div>
      </main>
    </>
  )
}