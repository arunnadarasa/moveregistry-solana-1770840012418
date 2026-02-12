'use client';

import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor'

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com')

// Program ID - replace with your actual deployed program ID
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'YOUR_PROGRAM_ID_HERE')

// Program interface (IDL)
import idl from '../../../../programs/move-registry/src/idl/move_registry.json' assert { type: 'json' }

export default function MoveMint() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const { wallets } = useWallets()
  const [moveName, setMoveName] = useState('')
  const [videoHash, setVideoHash] = useState('')
  const [royalty, setRoyalty] = useState(5)
  const [status, setStatus] = useState('')
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const getProvider = useCallback(() => {
    if (!wallets || wallets.length === 0) return null
    const wallet = wallets[0]
    return new anchor.AnchorProvider(connection, wallet as anchor.Wallet, {
      preflightCommitment: 'confirmed',
    })
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
      setStatus('Initializing transaction...')
      const provider = getProvider()
      if (!provider) {
        throw new Error('Wallet provider not available')
      }

      const program = new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider)

      // Get the wallet's public key
      const walletPublicKey = (await wallets)[0].publicKey

      // Derive PDA for the move data account
      const movePDA = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('movedata'), walletPublicKey.toBuffer()],
        PROGRAM_ID
      )[0]

      setStatus('Calling Anchor program to mint move NFT...')

      // Call the program
      const tx = await program.methods
        .mintSkill(moveName, videoHash, new anchor.BN(royalty))
        .accounts({
          creator: walletPublicKey,
          moveMint: movePDA, // In production, this would be the newly created mint
          treasury: movePDA, // Simplified: treasury is the same PDA
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      setTxSignature(tx)
      setStatus(`✅ Move NFT minted! Transaction: ${tx}`)
    } catch (error: any) {
      console.error('Mint error:', error)
      setStatus(`❌ Error: ${error.message || 'Unknown error'}`)
    }
  }, [authenticated, moveName, videoHash, royalty, wallets, getProvider])

  const verifyWithX401 = useCallback(async () => {
    if (!authenticated) {
      setStatus('Please connect wallet first')
      return
    }

    try {
      setStatus('Requesting x402 verification payment...')
      // In production, this would call your x402 service (PayAI, etc.)
      // For demo, we'll simulate the flow
      const response = await fetch('/api/verify-x402', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveName, amount: '0.01' }),
      })
      const data = await response.json()
      setStatus(`✅ Verification initiated: ${data.paymentRequest}`)
    } catch (error: any) {
      setStatus(`❌ x402 error: ${error.message}`)
    }
  }, [authenticated, moveName])

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

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button
              type="submit"
              disabled={!moveName || !videoHash}
              style={{
                flex: 1,
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

            <button
              type="button"
              onClick={verifyWithX401}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: 8,
                border: '1px solid #00dbde',
                background: 'transparent',
                color: '#00dbde',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Verify (x402)
            </button>
          </div>
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
    </div>
  )
}