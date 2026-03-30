import type { Route } from "./+types/api.contact-import.status";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const { credentials, importId } = body;

    if (!credentials?.username || !credentials?.password || !importId) {
      return new Response('Missing required fields', { status: 400 });
    }

    const authHeader = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;

    // Get import status using v3 API
    const response = await fetch(`https://r2-api.dotdigital.com/contacts/v3/import/${importId}`, {
      method: 'GET',
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

    // Log the actual response to see what fields Dotdigital returns
    console.log('Dotdigital Import Status Response:', JSON.stringify(responseData, null, 2));

    // Extract status information from v3 API response structure
    const status = responseData?.status;

    // v3 API returns arrays of created/updated contacts and a summary object
    const createdCount = responseData?.created?.length ?? 0;
    const updatedCount = responseData?.updated?.length ?? 0;
    const failedCount = responseData?.failed?.length ?? 0;

    // Total successful = created + updated
    const successCount = createdCount + updatedCount;
    const totalContacts = successCount + failedCount;

    console.log('Extracted counts:', {
      status,
      totalContacts,
      successCount,
      failureCount: failedCount,
      createdCount,
      updatedCount
    });

    return new Response(JSON.stringify({
      success: response.ok,
      status: status,
      totalContacts: totalContacts,
      successCount: successCount,
      failureCount: failedCount,
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
