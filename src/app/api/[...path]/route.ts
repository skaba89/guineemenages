import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    
    // Get query params
    const url = new URL(request.url);
    const queryString = url.search;
    
    // Build target URL - backend routes are already under /api/
    // So we forward to /api/{path} for normal routes
    // Special case for health endpoint
    let targetUrl: string;
    if (pathString === 'health') {
      // Health check is at root level on backend
      targetUrl = `${BACKEND_URL}/health${queryString}`;
    } else {
      // All other routes are under /api/ on backend
      targetUrl = `${BACKEND_URL}/api/${pathString}${queryString}`;
    }
    
    // Get request headers
    const headers: HeadersInit = {};
    
    // Forward authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }
    
    // Forward content-type
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers['content-type'] = contentType;
    }
    
    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    // Add body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch (e) {
        // No body
      }
    }
    
    console.log(`[Proxy] ${method} ${targetUrl}`);
    
    // Make request to backend
    const response = await fetch(targetUrl, fetchOptions);
    
    // Get response body
    const responseBody = await response.text();
    
    // Create response with CORS headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    
    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur de connexion au serveur backend' },
      { status: 500 }
    );
  }
}
