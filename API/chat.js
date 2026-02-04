export default async function handler(req, res) {
    // Configuração de CORS: Permite que seu app local (celular) acesse este servidor
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    try {
        // Chamada oficial para a API do Google Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ 
                        text: `Você é o Assistente do app 'Frases do Coração'. Responda de forma curta, acolhedora e poética. Gere frases ou dê conselhos inspiradores. Usuário disse: ${prompt}` 
                    }]
                }]
            })
        });

        const data = await response.json();
        
        // Extrai a resposta do formato específico do Gemini
        const respostaIA = data.candidates[0].content.parts[0].text;
        
        res.status(200).json({ resposta: respostaIA });
    } catch (error) {
        console.error("Erro no Gemini:", error);
        res.status(500).json({ error: "Erro ao processar sua mensagem." });
    }
}