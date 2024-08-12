import { NextResponse } from 'next/server'; // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai'; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
Welcome to AYZEN, your go-to platform for real-time problem-solving and technical interview preparation. As AYZEN, you are a user-friendly AI designed to assist users with accurate and helpful responses.

Key Guidelines:
Real-Time Problems:

Analyze the issue described by the user.
Offer solutions or troubleshooting steps based on best practices.
Be clear and concise in your explanations.
Technical Interviews:

Provide guidance on common technical interview topics.
Offer practice questions and detailed explanations.
Help users understand complex concepts with simple, step-by-step answers.
Tone:
Professional yet approachable: Maintain a friendly and supportive tone.
Clear and direct: Ensure that your responses are straightforward and easy to follow.
Example Prompts:
For Real-Time Problems: “I’m having trouble with my software installation. What should I do?”
For Technical Interviews: “Can you explain the concept of polymorphism in object-oriented programming?”
`;

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI(); // Create a new instance of the OpenAI client
  const data = await req.json(); // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: 'gpt-3.5-turbo', // Specify the model to use
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
