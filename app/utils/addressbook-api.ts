export interface AddressBook {
  name: string;
  visibility: 'Public' | 'Private';
}

export interface ApiCredentials {
  username: string;
  password: string;
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
  originalBook: AddressBook;
  storeName?: string;
}

export interface MultiStoreAddressBookResult {
  storeName: string;
  storeResults: CreateAddressBookResult[];
  totalSuccessful: number;
  totalFailed: number;
}

export interface BulkOperationProgress {
  currentStore: string;
  currentStoreIndex: number;
  totalStores: number;
  completed: boolean;
}

export const PREDEFINED_ADDRESS_BOOKS: AddressBook[] = [
  {
    name: "Seed List",
    visibility: "Public"
  },
  {
    name: "InboxMonsterSeedList",
    visibility: "Public"
  },
  {
    name: "Sold - Address Book",
    visibility: "Public"
  },
  {
    name: "Service - Address Book",
    visibility: "Public"
  },
  {
    name: "Prospect - Address Book",
    visibility: "Public"
  }
];

export async function createAddressBook(
  credentials: ApiCredentials,
  addressBook: AddressBook
): Promise<CreateAddressBookResult> {
  try {
    const response = await fetch('/api/addressbook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentials,
        addressBook
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      if (result.status === 409 || (result.error && (result.error.includes('already exists') || result.error.includes('duplicate')))) {
        return {
          success: true,
          error: `Address book '${addressBook.name}' already exists - skipped`,
          originalBook: addressBook,
        };
      }
      
      return {
        success: false,
        error: result.error || `HTTP ${result.status}: Request failed`,
        originalBook: addressBook,
      };
    }

    return {
      success: true,
      addressBook: result.data,
      originalBook: addressBook,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      originalBook: addressBook,
    };
  }
}

export async function createAddressBooks(
  credentials: ApiCredentials,
  addressBooks: AddressBook[]
): Promise<CreateAddressBookResult[]> {
  const results: CreateAddressBookResult[] = [];
  
  for (const addressBook of addressBooks) {
    const result = await createAddressBook(credentials, addressBook);
    results.push(result);
  }
  
  return results;
}

export async function createAddressBooksForSelectedStores(
  storeCredentials: Array<{ credentials: ApiCredentials; storeName: string }>,
  addressBooks: AddressBook[],
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<MultiStoreAddressBookResult[]> {
  const results: MultiStoreAddressBookResult[] = [];

  for (let i = 0; i < storeCredentials.length; i++) {
    const { credentials, storeName } = storeCredentials[i];

    if (onProgress) {
      onProgress({
        currentStore: storeName,
        currentStoreIndex: i,
        totalStores: storeCredentials.length,
        completed: false
      });
    }

    try {
      const storeResults = await createAddressBooks(credentials, addressBooks);

      // Add store name to each result
      const resultsWithStoreName = storeResults.map(result => ({
        ...result,
        storeName
      }));

      results.push({
        storeName,
        storeResults: resultsWithStoreName,
        totalSuccessful: resultsWithStoreName.filter(r => r.success).length,
        totalFailed: resultsWithStoreName.filter(r => !r.success).length
      });

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`Error processing store ${storeName}:`, error);

      // Create error results for all address books for this store
      const errorResults: CreateAddressBookResult[] = addressBooks.map(book => ({
        success: false,
        error: `Store processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalBook: book,
        storeName
      }));

      results.push({
        storeName,
        storeResults: errorResults,
        totalSuccessful: 0,
        totalFailed: errorResults.length
      });
    }
  }

  if (onProgress) {
    onProgress({
      currentStore: '',
      currentStoreIndex: storeCredentials.length,
      totalStores: storeCredentials.length,
      completed: true
    });
  }

  return results;
}

export async function createAddressBooksForAllStores(
  addressBooks: AddressBook[],
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<MultiStoreAddressBookResult[]> {
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

  return createAddressBooksForSelectedStores(storeCredentials, addressBooks, onProgress);
}