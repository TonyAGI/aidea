
async function test() {
    try {
        const response = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen/qwen3-235b-a22b:free',
                messages: [
                    { role: 'user', content: 'Run the command: echo "Hello from test script"' }
                ]
            })
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
