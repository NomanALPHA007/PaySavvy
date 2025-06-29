// Vercel serverless function for Stripe payments
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'myr', description } = req.body;
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Payment system not configured. Please add STRIPE_SECRET_KEY environment variable.' 
      });
    }

    // Import Stripe dynamically
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: 'PaySavvy Pro Coffee Tip',
            description: description,
            images: ['https://img.icons8.com/emoji/96/000000/coffee-emoji.png']
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://your-app.vercel.app'}/?payment=success`,
      cancel_url: `${req.headers.origin || 'https://your-app.vercel.app'}/?payment=cancelled`,
      metadata: {
        service: 'PaySavvy Pro Coffee Tip',
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
    
  } catch (error) {
    console.error('Stripe payment error:', error);
    res.status(500).json({ 
      error: 'Payment processing error. Please try again.',
      details: error.message
    });
  }
}