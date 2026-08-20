exports.handler = async (event) => {
    try {
        const { pozice, pole } = JSON.parse(event.body);
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            throw new Error('Chybí ANTHROPIC_API_KEY');
        }

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: `Pro pozici "${pozice}" v České republice vygeneruj POUZE 3 konkrétní návrhy do pole "${pole}". Vrať POUZE seznam - každý návrh na novém řádku, bez čísel, bez "-".`
                }]
            })
        });

        const data = await res.json();

        if (!res.ok) {
            console.error(data);
            throw new Error(data.error?.message || 'API error');
        }

        const suggestions = data.content[0]?.text
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .slice(0, 3) || [];

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggestions })
        };

    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: e.message })
        };
    }
};
