exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { pozice, pole } = JSON.parse(event.body);
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey || !pozice || !pole) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing data' }) };
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: `Pro pozici "${pozice}" v České republice vygeneruj POUZE 3 konkrétní návrhy do pole "${pole}". 
                    
Vrať POUZE seznam - každý návrh na novém řádku, bez čísel, bez "-", jen samotný text.

Příklad:
Návrh 1
Návrh 2
Návrh 3`
                }]
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        const suggestions = data.content[0]?.text
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .slice(0, 3) || [];

        return {
            statusCode: 200,
            body: JSON.stringify({ suggestions })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
