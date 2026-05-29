export function getCORSHeaders(allowedOrigins: string, origin: string | null): Record<string, string> {
  const origins = allowedOrigins.split(',').map(o => o.trim());
  const allowedOrigin = origins.includes(origin || '') ? (origin || origins[0]) : origins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCORS(allowedOrigins: string, request: Request): Response {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(allowedOrigins, origin),
  });
}
