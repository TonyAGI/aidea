import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const app = express();
const port = 3001;
const execAsync = promisify(exec);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const apiKey = process.env.OPENROUTER_API_KEY || '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'; // Fallback to the one found in code if env not set
const baseURL = 'https://openrouter.ai/api/v1';

const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
});

// Tool definitions
const tools = [
    {
        type: 'function',
        function: {
            name: 'run_command',
            description: 'Execute a shell command on the user\'s machine. Use this to run system commands like ls, git, npm, etc.',
            parameters: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: 'The shell command to execute',
                    },
                },
                required: ['command'],
            },
        },
    },
];

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model } = req.body;

        console.log('Received chat request for model:', model);

        const response = await client.chat.completions.create({
            model: model,
            messages: messages,
            tools: tools,
            tool_choice: 'auto',
        });

        const message = response.choices[0].message;

        // Handle tool calls
        if (message.tool_calls) {
            console.log('Tool calls detected:', message.tool_calls);

            // Add the assistant's message with tool calls to history
            messages.push(message);

            for (const toolCall of message.tool_calls) {
                if (toolCall.function.name === 'run_command') {
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`Executing command: ${args.command}`);

                    try {
                        const { stdout, stderr } = await execAsync(args.command);
                        const output = stdout || stderr;

                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: output || 'Command executed successfully with no output.',
                        });
                    } catch (error) {
                        console.error(`Command execution failed: ${error.message}`);
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: `Error executing command: ${error.message}`,
                        });
                    }
                }
            }

            // Get a second response from the model with the tool outputs
            const secondResponse = await client.chat.completions.create({
                model: model,
                messages: messages,
            });

            return res.json(secondResponse);
        }

        // No tool calls, just return the response
        res.json(response);

    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
