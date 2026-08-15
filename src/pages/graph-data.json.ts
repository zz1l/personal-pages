import type { APIRoute } from 'astro';
import { getGraph } from '../lib/graph';

// Static JSON consumed by the /graph page canvas.
export const GET: APIRoute = async () => {
  const { data } = getGraph();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
