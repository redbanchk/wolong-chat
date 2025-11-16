document.addEventListener('DOMContentLoaded', () => {
    // 这个地址将在 Vercel 部署后确定
    const BACKEND_API_URL = "/api/chat"; // 使用相对路径，Vercel 会自动代理

    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    let chatHistory = [];

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        userInput.value = '';
        sendBtn.disabled = true;
        sendBtn.textContent = '思考中...';
        appendMessage(message, 'user');

        try {
            const response = await fetch(BACKEND_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, history: chatHistory })
            });

            if (!response.ok) throw new Error(`API 请求失败: ${response.statusText}`);

            const result = await response.json();
            const assistantReply = result.reply;

            appendMessage(assistantReply, 'assistant');
            chatHistory.push([message, assistantReply]);

        } catch (error) {
            console.error('错误:', error);
            appendMessage('抱歉，在下思绪稍有混乱，请稍后再试。', 'assistant');
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = '发送';
        }
    }

    function appendMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});