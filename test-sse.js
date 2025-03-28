import EventSource from 'eventsource';
import fetch from 'node-fetch';

const BASE_URL = 'https://amadeus-mcp-server-production-5e4a.up.railway.app';

// Connect to SSE endpoint
const sse = new EventSource(`${BASE_URL}/sse`);
let connectionId = null;

// Listen for the initial connection message
sse.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.connectionId) {
        connectionId = data.connectionId;
        console.log('Connected with ID:', connectionId);
        
        // Once we have the connection ID, send a test message
        try {
            const response = await fetch(`${BASE_URL}/messages?connectionId=${connectionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'test',
                    payload: { message: 'Hello from test client!' }
                })
            });
            
            const result = await response.json();
            console.log('Message sent response:', result);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    } else {
        console.log('Received message:', data);
    }
};

sse.onerror = (error) => {
    console.error('SSE Error:', error);
};

// Keep the script running
process.on('SIGINT', () => {
    sse.close();
    process.exit();
}); 