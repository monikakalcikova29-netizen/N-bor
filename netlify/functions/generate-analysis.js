exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { data } = JSON.parse(event.body);
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey || !data) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing data' }) };
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 5000,
                messages: [{
                    role: 'user',
                    content: `Jsi expert na HR a nábor v České republice. Na základě těchto dat vytvoř 5 věcí:

## 1. JOB DESCRIPTION
Detailní interní popis pozice (200-300 slov).

## 2. INZERÁT
Atraktivní text pro LinkedIn (300-400 slov).

## 3. SROVNĚNÍ MEZD
- Zadané rozpětí vs reálné platy v ČR
- Je to competitive?
- Doporučení

## 4. REALITA TRHU
- Počet kandidátů
- Obtížnost náboru
- Čas na obsazení
- Top kanály
- Expectations kandidátů

## 5. HR STRATEGIE
- Rizika
- Red flags
- Tipy na hledání
- Retention

DATA:
${data}`
                }],
                tools: [{ type: 'web_search_20250305', name: 'web_search' }]
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const result = await response.json();
        const analysis = result.content.filter(b => b.type === 'text').map(b => b.text).join('\n');

        return {
            statusCode: 200,
            body: JSON.stringify({ analysis })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
