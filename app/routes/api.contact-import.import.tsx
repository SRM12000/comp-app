import type { Route } from "./+types/api.contact-import.import";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const { credentials, addressBookId, contacts } = body;

    if (!credentials?.username || !credentials?.password || !addressBookId || !contacts) {
      return new Response('Missing required fields', { status: 400 });
    }

    const authHeader = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;

    // Format contacts for DotDigital v3 API
    const contactsPayload = contacts.map((contact: any) => {
      const { email, firstName, lastName, ...otherFields } = contact;

      const payload: any = {
        matchIdentifier: "email",
        identifiers: {
          email: email
        }
      };

      // Build dataFields object (v3 API might expect an object, not an array)
      const dataFieldsObj: Record<string, any> = {};

      // Add firstname and lastname as data fields (lowercase to match Dotdigital account)
      if (firstName) {
        dataFieldsObj.firstname = firstName;
      }

      if (lastName) {
        dataFieldsObj.lastname = lastName;
      }

      // Add all other custom data fields
      Object.entries(otherFields).forEach(([key, value]) => {
        if (value) {
          dataFieldsObj[key.toUpperCase()] = value;
        }
      });

      // Only add dataFields if we have any
      if (Object.keys(dataFieldsObj).length > 0) {
        payload.dataFields = dataFieldsObj;
      }

      // Add list assignment (v3 API uses "lists" instead of "addressBooks")
      payload.lists = [addressBookId];

      return payload;
    });

    // Log the payload to verify firstName and lastName are included
    console.log('Contact Import Payload (first contact):', JSON.stringify(contactsPayload[0], null, 2));

    // Import contacts using v3 API
    const response = await fetch(`https://r2-api.dotdigital.com/contacts/v3/import`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contacts: contactsPayload
      }),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Extract import ID from response
    const importId = responseData?.importId || responseData?.id;

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      importId: importId,
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
