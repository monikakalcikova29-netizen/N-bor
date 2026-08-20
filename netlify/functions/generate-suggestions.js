// Umístit do: /netlify/functions/generate-suggestions.js

exports.handler = async (event) => {
    console.log('Function called with:', event.body);
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        let body = {};
        if (event.body) {
            body = JSON.parse(event.body);
        }

        const { pozice, pole } = body;
        console.log('Pozice:', pozice, 'Pole:', pole);

        if (!pozice || !pole) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Chybí pozice nebo pole' })
            };
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        console.log('API Key available:', !!apiKey);
        
        if (!apiKey) {
            console.error('ANTHROPIC_API_KEY not set');
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        const requestBody = {
            model: 'claude-sonnet-4-6',
            max_tokens: 500,
            messages: [{
                role: 'user',
                content: `Pro pozici "${pozice}" v České republice vygeneruj POUZE 3 konkrétní návrhy do pole "${pole}". 
                
Vrať POUZE seznam - každý návrh na novém řádku, bez čísel, bez "- ", jen samotný text.

Příklad formátu:
Návrh číslo 1
Návrh číslo 2
Návrh číslo 3`
            }]
        };

        console.log('Calling Claude API...');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        console.log('API Response status:', response.status);
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data).substring(0, 200));

        if (!response.ok) {
            console.error('Claude API error:', response.status, data);
            throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(data)}`);
        }

        const textContent = data.content[0]?.text || '';
        const suggestions = textContent
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .slice(0, 3);

        console.log('Suggestions generated:', suggestions);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggestions })
        };
    } catch (error) {
        console.error('Function error:', error.message);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
};
