import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { moveName, amount } = req.body

  // In production, this would:
  // 1. Generate an x402 payment request via PayAI or similar
  // 2. Return the payment request details to the frontend
  // 3. Handle the payment callback

  // For demo, we simulate a successful x402 flow
  const paymentRequest = {
    type: 'x402',
    amount: amount || '0.01',
    asset: 'USDC',
    network: 'devnet',
    description: `Verify authenticity of move: ${moveName || 'Unknown'}`,
    returnUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/verify-callback`,
  }

  res.status(200).json({
    success: true,
    message: 'x402 payment request generated',
    paymentRequest,
  })
}