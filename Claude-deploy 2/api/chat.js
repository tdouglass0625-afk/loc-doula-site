export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error: 'Method not allowed'});
  }

  const {system, messages} = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({error: 'Missing messages array in request body.'});
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({error: 'Anthropic API key is not configured.'});
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system,
        messages
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({error: data.error || data});
    }

    const reply = data.content?.map(item => item.text || '').join('') || '';
    return res.status(200).json({reply, raw: data});
  } catch (error) {
    return res.status(500).json({error: error.message || 'Unexpected error'});
  }
}
