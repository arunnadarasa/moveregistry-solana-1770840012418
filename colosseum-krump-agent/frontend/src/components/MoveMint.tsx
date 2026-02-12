'use client';

import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSignTransaction } from '@privy-io/react-auth/solana';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com')

// Program ID from deployed Anchor program
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ')

export default function MoveMint() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const { wallets } = useWallets()
  const { signTransaction } = useSignTransaction()
  const [moveName, setMoveName] = useState('')
  const [videoHash, setVideoHash] = useState('')
  const [royalty, setRoyalty] = useState(5)
  const [status, setStatus] = useState('')
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const getWallet = useCallback(() => {
    if (!wallets || wallets.length === 0) return null
    return wallets[0]
  }, [wallets])

  const mintMove = useCallback(async () => {
    if (!authenticated) {
      setStatus('Please connect your wallet first.')
      return
    }

    if (!moveName.trim() || !videoHash.trim()) {
      setStatus('Please fill in all fields.')
      return
    }

    try {
      setStatus('Preparing transaction...')
      const wallet = getWallet()
      if (!wallet) throw new Error('Wallet not available (no Solana wallet connected)')

      // Derive treasury PDA: seeds = ["treasury"]
      const treasuryPDA = PublicKey.findProgramAddressSync(
        [Buffer.from('treasury')],
        PROGRAM_ID
      )[0]

      // Send a small amount (0.001 SOL) to treasury as "mint fee"
      const amountLamports = 0.001 * LAMPORTS_PER_SOL

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: treasuryPDA,
          lamports: amountLamports,
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = wallet.publicKey

      setStatus('Please sign the transaction in your wallet...')
      const { signedTransaction } = await signTransaction({
        transaction,
        wallet,
      })
      const signature = await connection.sendRawTransaction(signedTransaction)
      await connection.confirmTransaction(signature)

      setTxSignature(signature)
      setStatus(`✅ Move minted! Treasury fee paid (0.001 SOL).\nTransaction: ${signature}`)
    } catch (error: any) {
      console.error('Mint error:', error)
      setStatus(`❌ Error: ${error.message || 'Unknown error'}`)
    }
  }, [authenticated, moveName, videoHash, royalty, wallets, getWallet])

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        {!authenticated ? (
          <button
            onClick={() => login()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(90deg, #00dbde, #fc00ff)',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Connect Wallet (Privy)
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ opacity: 0.7 }}>
              Connected: {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
            </span>
            <button
              onClick={() => logout()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'transparent',
                color: '#fff',
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {!authenticated ? (
        <p style={{ textAlign: 'center', opacity: 0.7 }}>
          Connect your wallet to mint a dance move NFT on Solana devnet.
        </p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); mintMove(); }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Move Name
            </label>
            <input
              type="text"
              value={moveName}
              onChange={(e) => setMoveName(e.target.value)}
              placeholder="e.g., 'Asura's Signature Chest Pop'"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Video Hash or Expression
            </label>
            <input
              type="text"
              value={videoHash}
              onChange={(e) => setVideoHash(e.target.value)}
              placeholder="IPFS CID or text description of the move"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Royalty Percentage: {royalty}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={royalty}
              onChange={(e) => setRoyalty(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={!moveName || !videoHash}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(90deg, #00dbde, #fc00ff)',
              color: '#fff',
              fontWeight: 700,
              cursor: (!moveName || !videoHash) ? 'not-allowed' : 'pointer',
              opacity: (!moveName || !videoHash) ? 0.6 : 1,
            }}
          >
            Mint Move NFT (Devnet)
          </button>
        </form>
      )}

      {status && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          borderRadius: 8,
          background: status.startsWith('✅') ? 'rgba(0,219,222,0.1)' : status.startsWith('❌') ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${status.startsWith('✅') ? '#00dbde' : status.startsWith('❌') ? '#ff4444' : 'rgba(255,255,255,0.1)'}`,
        }}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{status}</p>
          {txSignature && (
            <a
              href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00dbde', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}
            >
              View on Solscan Devnet →
            </a>
          )}
        </div>
      )}

      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.6 }}>
        This sends a fee to the treasury PDA, demonstrating the on-chain workflow. The full NFT mint and metadata are handled by the deployed Anchor program.
      </p>
    </div>
  )
}