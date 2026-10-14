export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Defensive body check in case it arrives as a string
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { name, email, message } = body || {};

    console.info("FOO: " + email);

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ error: 'RESEND_API_KEY is not set in environment variables.' });
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Crestone Websites <onboarding@resend.dev>',
                // IMPORTANT: Replace this with the exact email address you used to register at Resend:
                to: [`matthewcarltyson@gmail.com`],
                subject: `New Lead: ${name}`,
                text: `Name: ${name}\nContact: ${email}\n\nMessage:\n${message}`,
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
        return res.status(500).json({ error: err.message });
    }
}