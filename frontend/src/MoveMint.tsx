'use client';

import { useState, useCallback } from 'react';
import { useWallet, WalletMultiButton } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Metaplex, bundlrStorage, keypairIdentity, Nft } from '@metaplex-foundation/js';

const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com');
const METAPLEX = Metaplex.make(connection).use(keypairIdentity(/* signer */)).use(bundlrStorage());

export default function SkillMint() {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [skillName, setMoveName] = useState('');
  const [expression, setVideoHash] = useState('');
  const [royalty, setRoyalty] = useState(5);
  const [mintedNft, setMintedNft] = useState<Nft | null>(null);
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

  const mintMove = useCallback(async () => {
    if (!publicKey || !signTransaction || !sendTransaction) return;

    // Build the transaction to call our Anchor program
    // This is a simplified example; the real transaction requires
    // constructing the instruction with proper accounts and data.

    const tx = new Transaction().add(
      SystemProgram.nonceWipeAccount(SystemProgram.id, publicKey) // placeholder
    );

    // In a real implementation:
    // - Derive MoveData PDA: seeds = ["movedata", mintPubkey]
    // - Add instruction to create mint and metadata via Metaplex
    // - Add instruction to initialize MoveData

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = publicKey;

    const signed = await signTransaction(tx);
    const signature = await sendTransaction(signed, connection);
    await connection.confirmTransaction(signature);

    // After minting, we would fetch the minted NFT from Metaplex
    // For now we just log.
    console.log('Minted with signature', signature);
  }, [publicKey, signTransaction, sendTransaction]);

  return (
    <div style={{ padding: 20 }}>
      <h2>OpenClaw Dance Skill Registry — Mint Your dance Move</h2>
      <WalletMultiButton />
      {publicKey && (
        <form onSubmit={(e) => { e.preventDefault(); mintMove(); }}>
          <input placeholder="Move name" value={skillName} onChange={e => setMoveName(e.currentTarget.value)} required />
          <input placeholder="Expression (video URL or text DSL) (IPFS CID)" value={expression} onChange={e => setVideoHash(e.currentTarget.value)} required />
          <label>Royalty %: <input type="number" min="0" max="100" value={royalty} onChange={e => setRoyalty(Number(e.currentTarget.value))} /></label>
          <button type="submit">Mint Skill NFT</button>
        </form>
      )}
      {mintedNft && (
        <div>
          <h3>Minted NFT</h3>
          <p>Mint address: {mintedNft.address.toBase58()}</p>
          <img src={mintedNft.json?.image} alt={mintedNft.name} />
        </div>
      )}
    </div>
  );
}
