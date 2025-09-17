import { NextRequest, NextResponse } from 'next/server';

// AI Agent configuration
const AI_AGENT_BASE_URL = process.env.AI_AGENT_BASE_URL || 'http://localhost:8000';

interface OptimizationRequest {
  coin_id?: string;
  risk_profile?: 'conservative' | 'moderate' | 'aggressive';
  maturity_months?: 3 | 6 | 9 | 12;
  amount_algo?: number;
}

interface ContractInteractionRequest {
  action: string;
  amount?: number;
  maturity_timestamp?: number;
  user_address?: string;
}

// GET: Health check and status
export async function GET() {
  try {
    const response = await fetch(`${AI_AGENT_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AI Agent health check failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({
      status: 'connected',
      ai_agent_status: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Agent connection error:', error);
    return NextResponse.json(
      {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// POST: AI optimization requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let endpoint = '';
    let requestData = {};

    switch (action) {
      case 'optimize':
        endpoint = '/optimize';
        requestData = {
          coin_id: params.coin_id || 'algorand',
          risk_profile: params.risk_profile,
          maturity_months: params.maturity_months || 6,
          amount_algo: params.amount_algo,
        } as OptimizationRequest;
        break;

      case 'contract_interact':
        endpoint = '/contracts/interact';
        requestData = {
          action: params.contract_action,
          amount: params.amount,
          maturity_timestamp: params.maturity_timestamp,
          user_address: params.user_address,
        } as ContractInteractionRequest;
        break;

      case 'contract_status':
        endpoint = '/contracts/status';
        requestData = {};
        break;

      case 'coin_data':
        endpoint = `/coins/${params.coin_id || 'algorand'}`;
        requestData = {};
        break;

      case 'coin_history':
        endpoint = `/coins/${params.coin_id || 'algorand'}/history`;
        requestData = {};
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const response = await fetch(`${AI_AGENT_BASE_URL}${endpoint}`, {
      method: endpoint.includes('/coins/') && !endpoint.includes('/history') && action === 'coin_data' ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: Object.keys(requestData).length > 0 ? JSON.stringify(requestData) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Agent request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Agent request error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
