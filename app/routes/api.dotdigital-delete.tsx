import type { Route } from "./+types/api.dotdigital-delete";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const { credentials, fieldName } = body;

    if (!credentials?.username || !credentials?.password || !fieldName) {
      return new Response('Missing required fields', { status: 400 });
    }

    const authHeader = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;

    const response = await fetch(`https://r2-api.dotdigital.com/v2/data-fields/${encodeURIComponent(fieldName)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      data: responseData,
      error: response.ok ? null : responseText
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}