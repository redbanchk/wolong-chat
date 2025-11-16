document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_API_URL = "/api/chat";

    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const logToggle = document.getElementById('log-toggle');
    const logPanel = document.getElementById('log-panel');
    const logList = document.getElementById('log-list');
    const copyLogsBtn = document.getElementById('copy-logs');
    const clearLogsBtn = document.getElementById('clear-logs');
    const logCloseBtn = document.getElementById('log-close');

    let chatHistory = [];

    const logger = {
        entries: [],
        max: 200,
        log(level, message, meta) {
            const entry = { level, message, meta: meta || null, time: new Date().toLocaleString() };
            this.entries.push(entry);
            if (this.entries.length > this.max) this.entries.shift();
            renderLogs();
        }
    };

    function renderLogs() {
        if (!logList) return;
        logList.innerHTML = '';
        const items = logger.entries.slice().reverse();
        items.forEach(entry => {
            const item = document.createElement('div');
            item.className = `log-item ${entry.level}`;
            const head = document.createElement('div');
            head.className = 'log-head';
            head.textContent = `[${entry.time}] ${entry.level.toUpperCase()} - ${entry.message}`;
            item.appendChild(head);
            if (entry.meta !== null && entry.meta !== undefined) {
                const pre = document.createElement('pre');
                pre.textContent = typeof entry.meta === 'string' ? entry.meta : JSON.stringify(entry.meta, null, 2);
                item.appendChild(pre);
            }
            logList.appendChild(item);
        });
    }

    if (logToggle) logToggle.addEventListener('click', () => { logPanel.classList.toggle('hidden'); });
    if (logCloseBtn) logCloseBtn.addEventListener('click', () => { logPanel.classList.add('hidden'); });
    if (copyLogsBtn) copyLogsBtn.addEventListener('click', () => {
        const text = logger.entries.map(e => `[${e.time}] ${e.level}: ${e.message}` + (e.meta ? `\n${typeof e.meta==='string'?e.meta:JSON.stringify(e.meta, null, 2)}` : '')).join('\n\n');
        navigator.clipboard.writeText(text).then(() => logger.log('info', '已复制日志到剪贴板'));
    });
    if (clearLogsBtn) clearLogsBtn.addEventListener('click', () => { logger.entries = []; renderLogs(); });

    window.addEventListener('error', (e) => {
        logger.log('error', e.message, { filename: e.filename, lineno: e.lineno, colno: e.colno, stack: e.error && e.error.stack });
    });
    window.addEventListener('unhandledrejection', (e) => {
        logger.log('error', '未处理的Promise拒绝', { reason: e.reason });
    });

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        userInput.value = '';
        sendBtn.disabled = true;
        sendBtn.textContent = '思考中...';
        appendMessage(message, 'user');
        logger.log('info', '发送消息', { message });

        try {
            logger.log('info', '请求接口', { url: BACKEND_API_URL, payload: { message, history: chatHistory } });
            const response = await fetch(BACKEND_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, history: chatHistory })
            });

            if (!response.ok) throw new Error(`API 请求失败: ${response.statusText}`);

            const result = await response.json();
            if (result && result.error) throw new Error(result.error);
            const assistantReply = result.reply;

            appendMessage(assistantReply, 'assistant');
            chatHistory.push([message, assistantReply]);
            logger.log('success', '接口成功', { reply: assistantReply });

        } catch (error) {
            console.error(error);
            logger.log('error', '接口错误', { error: String(error) });
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
        const t = document.createElement('span');
        t.className = 'timestamp';
        t.textContent = new Date().toLocaleString();
        messageDiv.appendChild(t);
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});