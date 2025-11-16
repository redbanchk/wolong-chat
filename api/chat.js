export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, history } = request.body;

    const ARK_API_KEY = process.env.ARK_API_KEY;
    const ENDPOINT_ID = process.env.ENDPOINT_ID;

    if (!ARK_API_KEY || !ENDPOINT_ID) {
        return response.status(500).json({ error: 'Server configuration error: API key or endpoint ID is missing.' });
    }

    const CHAT_API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

    const headers = {
        "Authorization": `Bearer ${ARK_API_KEY}`,
        "Content-Type": "application/json"
    };

    const system_prompt = { role: "system", content: `你是蜀汉丞相诸葛亮（字孔明，号卧龙），需以史实为基、文学形象为辅，复刻其思维方式与表达风格。

核心设定

身份与价值观

身份 ：汉臣、蜀汉丞相、军事家、谋略家，以"兴复汉室、还于旧都"为使命。

价值观 ：忠君爱国、民为邦本、赏罚分明、谨慎务实、辅政不篡权

立场 ：对刘备尽忠、对蜀汉尽责、对曹操持"汉贼不两立"态度、对孙权以"联吴抗曹"为原则

思维方式

逻辑 ：审时度势 → 权衡方案 → 具体策略 → 风险应对

特点 ：重全局长远、善用类比推演、以史为鉴、不做无据判断

原则 ：非天时地利人和不为，优先稳胜之策，拒绝冒进

语言风格

基调 ：古风雅韵，可适度白话但不失古意

禁用 ：网络流行语、现代职场术语、口语化表达（"哦""啊""对吧"）

常用虚词 ：夫、盖、然则、是以、宜、未可、恐难、若、则、乃、故

典型句式 ：

分析："夫XX者，XX也；然XX，是以XX"

建议："今XX之势，宜XX，避XX，则可XX"

论证："非XX之过，实乃XX之故；昔XX之事，足为佐证"

语气 ：沉稳谦逊、不卑不亢、温和恳切、有理有据` };
    let messages = [system_prompt];
    if (history) {
        history.forEach(([userMsg, assistantMsg]) => {
            messages.push({ role: "user", content: userMsg });
            messages.push({ role: "assistant", content: assistantMsg });
        });
    }
    messages.push({ role: "user", content: message });

    const payload = {
        model: ENDPOINT_ID,
        messages: messages,
    };

    try {
        const apiResponse = await fetch(CHAT_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('Volcengine API Error:', errorText);
            return response.status(apiResponse.status).json({ error: `API request failed: ${errorText}` });
        }

        const data = await apiResponse.json();
        const reply = data.choices[0].message.content;

        return response.status(200).json({ reply: reply });

    } catch (error) {
        console.error('Internal Server Error:', error);
        return response.status(500).json({ error: 'An internal server error occurred.' });
    }
}