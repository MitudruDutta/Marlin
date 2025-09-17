import { NextRequest } from 'next/server';

// AI Agent configuration
const AI_AGENT_BASE_URL = process.env.AI_AGENT_BASE_URL || 'http://localhost:8000';
const STREAM_INTERVAL = 10000; // 10 seconds

interface StreamData {
  timestamp: string;
  health: Record<string, unknown> | null;
  contracts: Record<string, unknown> | null;
  optimization?: Record<string, unknown> | null;
  coin_data?: Record<string, unknown> | null;
}

export async function GET(request: NextRequest) {
  // Check if the client accepts SSE
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;
  
  const stream = new ReadableStream({
    start(controller) {
      // Function to send data to client
      const sendData = async () => {
        try {
          const streamData: StreamData = {
            timestamp: new Date().toISOString(),
            health: null,
            contracts: null,
          };

          // Get health status
          try {
            const healthResponse = await fetch(`${AI_AGENT_BASE_URL}/health`);
            if (healthResponse.ok) {
              streamData.health = await healthResponse.json();
            }
          } catch (error) {
            console.error('Health check failed:', error);
            streamData.health = { error: 'Health check failed' };
          }

          // Get contract status
          try {
            const contractResponse = await fetch(`${AI_AGENT_BASE_URL}/contracts/status`);
            if (contractResponse.ok) {
              streamData.contracts = await contractResponse.json();
            }
          } catch (error) {
            console.error('Contract status failed:', error);
            streamData.contracts = { error: 'Contract status check failed' };
          }

          // Get coin data for algorand
          try {
            const coinResponse = await fetch(`${AI_AGENT_BASE_URL}/coins/algorand`);
            if (coinResponse.ok) {
              streamData.coin_data = await coinResponse.json();
            }
          } catch (error) {
            console.error('Coin data failed:', error);
            streamData.coin_data = { error: 'Coin data fetch failed' };
          }

          // Get optimization recommendation (sample)
          try {
            const optimizationResponse = await fetch(`${AI_AGENT_BASE_URL}/optimize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                coin_id: 'algorand',
                risk_profile: 'moderate',
                maturity_months: 6,
                amount_algo: 1000
              })
            });
            if (optimizationResponse.ok) {
              streamData.optimization = await optimizationResponse.json();
            }
          } catch (error) {
            console.error('Optimization failed:', error);
            streamData.optimization = { error: 'Optimization fetch failed' };
          }

          // Format as SSE data
          const data = `data: ${JSON.stringify(streamData)}\n\n`;
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.log('Stream closed, stopping data send');
            clearInterval(intervalId);
            return;
          }
        } catch (error) {
          console.error('Stream error:', error);
          const errorData = {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          const data = `data: ${JSON.stringify(errorData)}\n\n`;
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.log('Stream closed, stopping error send');
            clearInterval(intervalId);
            return;
          }
        }
      };

      // Send initial data
      sendData();

      // Set up interval for regular updates
      intervalId = setInterval(sendData, STREAM_INTERVAL);

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`;
        try {
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.log('Stream closed, stopping heartbeat');
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  return new Response(stream, { headers });
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    },
  });
}
