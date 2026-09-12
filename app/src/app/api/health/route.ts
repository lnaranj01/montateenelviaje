export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'montateenelviaje',
    timestamp: new Date().toISOString(),
  });
}
