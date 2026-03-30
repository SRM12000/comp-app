import * as XLSX from 'xlsx';

export interface ApiCredentials {
  username: string;
  password: string;
}

export interface Contact {
  email: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any; // Additional data fields
}

export interface ParsedExcelData {
  contacts: Contact[];
  detectedColumns: ColumnMapping;
  invalidRows: InvalidRow[];
  totalRows: number;
}

export interface ColumnMapping {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  [key: string]: string | null;
}

export interface InvalidRow {
  rowNumber: number;
  reason: string;
  data: any;
}

export interface AddressBookResponse {
  id: number;
  name: string;
  visibility: string;
  contacts: number;
}

export interface CreateAddressBookResult {
  success: boolean;
  addressBook?: AddressBookResponse;
  error?: string;
  storeName?: string;
}

export interface ImportContactsResult {
  success: boolean;
  importId?: string;
  error?: string;
  storeName?: string;
}

export interface ImportStatusResult {
  success: boolean;
  status?: string;
  totalContacts?: number;
  successCount?: number;
  failureCount?: number;
  error?: string;
}

export interface ContactImportResult {
  success: boolean;
  storeName: string;
  addressBookId?: number;
  addressBookName?: string;
  importId?: string;
  importStatus?: string;
  totalContacts: number;
  successCount: number;
  failureCount: number;
  error?: string;
}

export interface BulkOperationProgress {
  currentStore: string;
  currentStoreIndex: number;
  totalStores: number;
  completed: boolean;
  currentStep?: string;
}

const DOTDIGITAL_API_BASE_V2 = 'https://r2-api.dotdigital.com/v2';
const DOTDIGITAL_API_BASE_V3 = 'https://r2-api.dotdigital.com/v3';

// Helper function to detect email columns
function detectEmailColumn(headers: string[]): string | null {
  const emailPatterns = [
    'email',
    'e-mail',
    'emailaddress',
    'email address',
    'mail',
    'email_address',
  ];

  for (const header of headers) {
    const lowerHeader = header.toLowerCase().trim();
    if (emailPatterns.some(pattern => lowerHeader.includes(pattern))) {
      return header;
    }
  }

  return null;
}

// Helper function to detect first name columns
function detectFirstNameColumn(headers: string[]): string | null {
  const firstNamePatterns = [
    'firstname',
    'first name',
    'first_name',
    'fname',
    'given name',
    'givenname',
  ];

  for (const header of headers) {
    const lowerHeader = header.toLowerCase().trim();
    if (firstNamePatterns.some(pattern => lowerHeader === pattern || lowerHeader.includes(pattern))) {
      return header;
    }
  }

  return null;
}

// Helper function to detect last name columns
function detectLastNameColumn(headers: string[]): string | null {
  const lastNamePatterns = [
    'lastname',
    'last name',
    'last_name',
    'lname',
    'surname',
    'family name',
    'familyname',
  ];

  for (const header of headers) {
    const lowerHeader = header.toLowerCase().trim();
    if (lastNamePatterns.some(pattern => lowerHeader === pattern || lowerHeader.includes(pattern))) {
      return header;
    }
  }

  return null;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse Excel file and extract contact data
 */
export function parseExcelFile(file: File): Promise<ParsedExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: ''
        });

        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        // Get headers
        const headers = Object.keys(jsonData[0]);

        // Detect columns
        const detectedColumns: ColumnMapping = {
          email: detectEmailColumn(headers),
          firstName: detectFirstNameColumn(headers),
          lastName: detectLastNameColumn(headers),
        };

        // Parse contacts
        const contacts: Contact[] = [];
        const invalidRows: InvalidRow[] = [];

        jsonData.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because Excel rows start at 1 and we skip header

          // Get email
          const emailColumn = detectedColumns.email;
          if (!emailColumn) {
            invalidRows.push({
              rowNumber,
              reason: 'No email column detected',
              data: row
            });
            return;
          }

          const email = row[emailColumn]?.toString().trim();

          if (!email) {
            invalidRows.push({
              rowNumber,
              reason: 'Email is empty',
              data: row
            });
            return;
          }

          if (!isValidEmail(email)) {
            invalidRows.push({
              rowNumber,
              reason: `Invalid email format: ${email}`,
              data: row
            });
            return;
          }

          // Build contact object
          const contact: Contact = {
            email: email.toLowerCase(),
          };

          // Add first name if detected
          if (detectedColumns.firstName && row[detectedColumns.firstName]) {
            contact.firstName = row[detectedColumns.firstName].toString().trim();
          }

          // Add last name if detected
          if (detectedColumns.lastName && row[detectedColumns.lastName]) {
            contact.lastName = row[detectedColumns.lastName].toString().trim();
          }

          // Add all other columns as data fields
          Object.keys(row).forEach(key => {
            if (key !== detectedColumns.email &&
                key !== detectedColumns.firstName &&
                key !== detectedColumns.lastName &&
                row[key]) {
              contact[key] = row[key].toString().trim();
            }
          });

          contacts.push(contact);
        });

        resolve({
          contacts,
          detectedColumns,
          invalidRows,
          totalRows: jsonData.length,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Create address book via API route (v2 endpoint)
 */
export async function createAddressBook(
  credentials: ApiCredentials,
  listName: string,
  visibility: 'Public' | 'Private' = 'Public'
): Promise<CreateAddressBookResult> {
  try {
    console.log('Creating address book:', listName);
    const response = await fetch('/api/contact-import/create-list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentials,
        listName,
        visibility
      }),
    });

    console.log('Create address book response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create address book error:', errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || 'Request failed'}`,
      };
    }

    const result = await response.json();
    console.log('Create address book result:', result);

    if (!result.success) {
      return {
        success: false,
        error: result.error || `HTTP ${result.status}: Request failed`,
      };
    }

    return {
      success: true,
      addressBook: result.data,
    };
  } catch (error) {
    console.error('Create address book exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Import contacts using v3 API
 */
export async function importContacts(
  credentials: ApiCredentials,
  addressBookId: number,
  contacts: Contact[]
): Promise<ImportContactsResult> {
  try {
    console.log('Importing contacts:', contacts.length, 'to address book:', addressBookId);
    const response = await fetch('/api/contact-import/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentials,
        addressBookId,
        contacts
      }),
    });

    console.log('Import contacts response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Import contacts error:', errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || 'Request failed'}`,
      };
    }

    const result = await response.json();
    console.log('Import contacts result:', result);

    if (!result.success) {
      return {
        success: false,
        error: result.error || `HTTP ${result.status}: Request failed`,
      };
    }

    return {
      success: true,
      importId: result.importId,
    };
  } catch (error) {
    console.error('Import contacts exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get import status using v3 API
 */
export async function getImportStatus(
  credentials: ApiCredentials,
  importId: string
): Promise<ImportStatusResult> {
  try {
    console.log('Getting import status for:', importId);
    const response = await fetch('/api/contact-import/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentials,
        importId
      }),
    });

    console.log('Import status response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Import status error:', errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || 'Request failed'}`,
      };
    }

    const result = await response.json();
    console.log('Import status result:', result);

    if (!result.success) {
      return {
        success: false,
        error: result.error || `HTTP ${result.status}: Request failed`,
      };
    }

    return {
      success: true,
      status: result.status,
      totalContacts: result.totalContacts,
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  } catch (error) {
    console.error('Import status exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Poll import status until complete (with timeout)
 */
async function pollImportStatus(
  credentials: ApiCredentials,
  importId: string,
  maxAttempts: number = 60, // 60 attempts = 5 minutes
  interval: number = 5000 // 5 seconds
): Promise<ImportStatusResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const statusResult = await getImportStatus(credentials, importId);

    if (!statusResult.success) {
      return statusResult;
    }

    // Check if import is complete
    if (statusResult.status === 'Finished' ||
        statusResult.status === 'Complete' ||
        statusResult.status === 'CompletedWithErrors') {
      return statusResult;
    }

    // If failed, return immediately
    if (statusResult.status === 'Failed' || statusResult.status === 'RejectedByWatchdog') {
      return {
        success: false,
        error: `Import failed with status: ${statusResult.status}`,
        status: statusResult.status,
      };
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return {
    success: false,
    error: 'Import status check timed out after 5 minutes',
  };
}

/**
 * Import contacts for a single store (complete workflow)
 */
export async function importContactsForStore(
  credentials: ApiCredentials,
  storeName: string,
  listName: string,
  contacts: Contact[]
): Promise<ContactImportResult> {
  try {
    // Step 1: Create address book
    const createResult = await createAddressBook(credentials, listName);

    if (!createResult.success) {
      return {
        success: false,
        storeName,
        totalContacts: contacts.length,
        successCount: 0,
        failureCount: contacts.length,
        error: `Failed to create address book: ${createResult.error}`,
      };
    }

    const addressBookId = createResult.addressBook!.id;

    // Step 2: Import contacts
    const importResult = await importContacts(credentials, addressBookId, contacts);

    if (!importResult.success) {
      return {
        success: false,
        storeName,
        addressBookId,
        addressBookName: listName,
        totalContacts: contacts.length,
        successCount: 0,
        failureCount: contacts.length,
        error: `Failed to import contacts: ${importResult.error}`,
      };
    }

    const importId = importResult.importId!;

    // Step 3: Poll for import status
    const statusResult = await pollImportStatus(credentials, importId);

    if (!statusResult.success) {
      return {
        success: false,
        storeName,
        addressBookId,
        addressBookName: listName,
        importId,
        totalContacts: contacts.length,
        successCount: 0,
        failureCount: contacts.length,
        error: `Failed to get import status: ${statusResult.error}`,
      };
    }

    return {
      success: true,
      storeName,
      addressBookId,
      addressBookName: listName,
      importId,
      importStatus: statusResult.status,
      totalContacts: statusResult.totalContacts ?? contacts.length,
      successCount: statusResult.successCount ?? 0,
      failureCount: statusResult.failureCount ?? 0,
    };
  } catch (error) {
    return {
      success: false,
      storeName,
      totalContacts: contacts.length,
      successCount: 0,
      failureCount: contacts.length,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Import contacts for selected stores or all stores
 */
export async function importContactsForStores(
  storeCredentials: Array<{ credentials: ApiCredentials; storeName: string }>,
  listName: string,
  contacts: Contact[],
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<ContactImportResult[]> {
  const results: ContactImportResult[] = [];

  for (let i = 0; i < storeCredentials.length; i++) {
    const { credentials, storeName } = storeCredentials[i];

    if (onProgress) {
      onProgress({
        currentStore: storeName,
        currentStoreIndex: i,
        totalStores: storeCredentials.length,
        completed: false,
        currentStep: 'Creating address book...',
      });
    }

    try {
      const result = await importContactsForStore(
        credentials,
        storeName,
        listName,
        contacts
      );

      results.push(result);

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`Error processing store ${storeName}:`, error);

      results.push({
        success: false,
        storeName,
        totalContacts: contacts.length,
        successCount: 0,
        failureCount: contacts.length,
        error: `Store processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  if (onProgress) {
    onProgress({
      currentStore: '',
      currentStoreIndex: storeCredentials.length,
      totalStores: storeCredentials.length,
      completed: true,
    });
  }

  return results;
}

/**
 * Import contacts for all active stores
 */
export async function importContactsForAllStores(
  listName: string,
  contacts: Contact[],
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<ContactImportResult[]> {
  const response = await fetch('/api/accounts');
  if (!response.ok) throw new Error('Failed to fetch accounts');
  const activeStores: import("../data/dotdigital_accounts").VendorAccount[] = await response.json();

  const storeCredentials = activeStores.map(store => ({
    credentials: {
      username: store.apiCredentials.apiUser!,
      password: store.apiCredentials.apiPassword!
    },
    storeName: store.name
  }));

  return importContactsForStores(storeCredentials, listName, contacts, onProgress);
}
