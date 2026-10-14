export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const name = body?.name?.trim();
    const email = (body?.email || body?.contact)?.trim();
    const message = body?.message?.trim();

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields (name, email, message) are required.' });
    }

    if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ error: 'RESEND_API_KEY is not configured in Vercel environment variables.' });
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Enlightenment is Now <onboarding@resend.dev>',
                to: ['matthewcarltyson@gmail.com'],
                reply_to: email,
                subject: `New Reader Inquiry: ${name}`,
                text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Resend API Error:', result);
            return res.status(response.status).json({ error: result });
        }

        return res.status(200).json({ success: true, id: result.id });
    } catch (err) {
        console.error('Server catch error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}