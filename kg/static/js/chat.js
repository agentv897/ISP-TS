// chat.js - Frontend logic for the SPKG AI Assistant

const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add User Message
    appendMessage('user', text);
    chatInput.value = '';

    // Add AI Typing Indicator
    const typingId = appendMessage('ai', 'Thinking...', true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        
        // Replace typing indicator with response
        updateMessage(typingId, data.response);
    } catch (err) {
        updateMessage(typingId, "Sorry, I'm having trouble connecting to the GQL engine.");
    }
}

function appendMessage(role, text, isTyping = false) {
    const id = 'msg-' + Math.random().toString(36).substr(2, 9);
    const bubble = document.createElement('div');
    bubble.id = id;
    bubble.className = `chat-bubble ${role === 'user' ? 'chat-user' : 'chat-ai'} transition-all opacity-0 translate-y-2`;
    bubble.innerHTML = text;
    
    chatHistory.appendChild(bubble);
    
    // Animation
    setTimeout(() => {
        bubble.classList.remove('opacity-0', 'translate-y-2');
    }, 10);

    chatHistory.scrollTop = chatHistory.scrollHeight;
    return id;
}

function updateMessage(id, text) {
    const bubble = document.getElementById(id);
    if (bubble) {
        bubble.innerHTML = text;
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
