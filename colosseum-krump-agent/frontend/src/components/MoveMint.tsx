'use client';

import { useState } from 'react'

export default function MoveMint() {
  const [moveName, setMoveName] = useState('')
  const [videoHash, setVideoHash] = useState('')
  const [royalty, setRoyalty] = useState(5)
  const [status, setStatus] = useState('')

  const handleMint = () => {
    if (!moveName || !videoHash) {
      setStatus('Please fill in all fields to demo the workflow.')
      return
    }
    setStatus(`Demo: Would mint NFT for "${moveName}" with ${royalty}% royalties on Solana devnet.`)
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          padding: '0.75rem 1.5rem',
          borderRadius: 8,
          border: 'none',
          background: 'linear-gradient(90deg, #00dbde, #fc00ff)',
          color: '#fff',
          fontWeight: 700,
          display: 'inline-block'
        }}>
          Demo Mode: Wallet Not Required
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleMint() }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Move Name
          </label>
          <input
            type="text"
            value={moveName}
            onChange={(e) => setMoveName(e.target.value)}
            placeholder="e.g., Asura's Signature Chest Pop"
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
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(90deg, #00dbde, #fc00ff)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Mint Move NFT (Simulated)
        </button>
      </form>

      {status && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          borderRadius: 8,
          background: 'rgba(0,219,222,0.1)',
          border: '1px solid #00dbde',
        }}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{status}</p>
        </div>
      )}

      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.6 }}>
        In production, this connects to a Solana wallet to mint an NFT via our Anchor program.
      </p>
    </div>
  )
}