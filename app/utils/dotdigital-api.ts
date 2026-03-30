export interface DataField {
  name: string;
  type: 'String' | 'Numeric' | 'Date' | 'Boolean';
  visibility: 'Private' | 'Public';
  defaultValue?: string | number | boolean;
}

export interface ApiCredentials {
  username: string;
  password: string;
}

export interface DataFieldResponse {
  id: number;
  name: string;
  type: string;
  visibility: string;
  defaultValue?: any;
}

export interface CreateDataFieldResult {
  success: boolean;
  dataField?: DataFieldResponse;
  error?: string;
  originalField: DataField;
  storeName?: string;
}

export interface MultiStoreDataFieldResult {
  storeName: string;
  storeResults: CreateDataFieldResult[];
  totalSuccessful: number;
  totalFailed: number;
}

export interface BulkOperationProgress {
  currentStore: string;
  currentStoreIndex: number;
  totalStores: number;
  completed: boolean;
}

export interface DeleteDataFieldResult {
  success: boolean;
  fieldName: string;
  error?: string;
  storeName?: string;
}

export interface MultiStoreDeleteResult {
  storeName: string;
  storeResults: DeleteDataFieldResult[];
  totalSuccessful: number;
  totalFailed: number;
}

const DOTDIGITAL_API_BASE = 'https://r2-api.dotdigital.com/v2';

export const PREDEFINED_DATA_FIELDS: DataField[] = [
  {
    name: "ADDRESS",
    type: "String",
    visibility: "Private"
  },
  {
    name: "ADDRESS2",
    type: "String",
    visibility: "Private"
  },
  {
    name: "BIRTHDAY",
    type: "Date",
    visibility: "Private"
  },
  {
    name: "BIRTHDAYPHONE",
    type: "String",
    visibility: "Public"
  },
  {
    name: "CELL",
    type: "String",
    visibility: "Private"
  },
  {
    name: "CITY",
    type: "String",
    visibility: "Private"
  },
  {
    name: "CPAAS_PROFILE_ID",
    type: "String",
    visibility: "Private"
  },
  {
    name: "DISCLAIMERTEXTSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "DISCLAMIERLINKSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "DOMAINSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "EDSOURCE",
    type: "String",
    visibility: "Private"
  },
  {
    name: "EOMEXPIRE",
    type: "Date",
    visibility: "Private"
  },
  {
    name: "EXPIRATIONSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "FIRSTNAME",
    type: "String",
    visibility: "Public",
    defaultValue: "Valued Customer"
  },
  {
    name: "FULLNAME",
    type: "String",
    visibility: "Public"
  },
  {
    name: "GENDER",
    type: "String",
    visibility: "Public"
  },
  {
    name: "HEADLINE01CLRSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "HEADLINE01TXTSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "HEADLINE02CLRSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "HEADLINE02TXTSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "HEADLINE03CLRSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "HEADLINE03TXTSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "IMAGELINKSMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "IMAGESMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "LASTNAME",
    type: "String",
    visibility: "Public"
  },
  {
    name: "LASTPAYMENTDATE",
    type: "Date",
    visibility: "Private"
  },
  {
    name: "LASTSERVICEDATE",
    type: "Date",
    visibility: "Private"
  },
  {
    name: "LASTSUBSCRIBED",
    type: "Date",
    visibility: "Private"
  },
  {
    name: "LEASEPURCHASE",
    type: "String",
    visibility: "Private"
  },
  {
    name: "MAKE",
    type: "String",
    visibility: "Private",
    defaultValue: "current vehicle"
  },
  {
    name: "MAKESER",
    type: "String",
    visibility: "Private"
  },
  {
    name: "MODEL",
    type: "String",
    visibility: "Private",
    defaultValue: "model"
  },
  {
    name: "MODELSER",
    type: "String",
    visibility: "Private"
  },
  {
    name: "MODELYEAR",
    type: "Numeric",
    visibility: "Private"
  },
  {
    name: "MODELYEARSER",
    type: "Numeric",
    visibility: "Private"
  },
  {
    name: "NEWUSED",
    type: "String",
    visibility: "Private"
  },
  {
    name: "OWNERADDRESS",
    type: "String",
    visibility: "Public"
  },
  {
    name: "OWNEREMAIL",
    type: "String",
    visibility: "Private"
  },
  {
    name: "OWNERFIRSTNAME",
    type: "String",
    visibility: "Private"
  },
  {
    name: "OWNERLASTNAME",
    type: "String",
    visibility: "Private"
  },
  {
    name: "OWNERROLE",
    type: "String",
    visibility: "Public"
  },
  {
    name: "OWNERWEBSITE",
    type: "String",
    visibility: "Public"
  },
  {
    name: "PHONE",
    type: "String",
    visibility: "Private"
  },
  {
    name: "PHONEICO",
    type: "String",
    visibility: "Public"
  },
  {
    name: "PHONELUCKY",
    type: "String",
    visibility: "Private"
  },
  {
    name: "PHONEREPUTATION",
    type: "String",
    visibility: "Public"
  },
  {
    name: "PHONESMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "PHONESVC",
    type: "String",
    visibility: "Private"
  },
  {
    name: "POSTCODE",
    type: "String",
    visibility: "Public"
  },
  {
    name: "PURCHASEDATE",
    type: "Date",
    visibility: "Private"
  },
  {
    name: "PURCHASEPRICE",
    type: "Numeric",
    visibility: "Private"
  },
  {
    name: "PURPOSE",
    type: "String",
    visibility: "Private"
  },
  {
    name: "REPWORKFLOWFOLLOWUP",
    type: "Boolean",
    visibility: "Private"
  },
  {
    name: "SALESPERSON",
    type: "String",
    visibility: "Private"
  },
  {
    name: "SERVICEDATE",
    type: "Date",
    visibility: "Private"
  },
  {
    name: "STATE",
    type: "String",
    visibility: "Private"
  },
  {
    name: "STILLOWNS",
    type: "String",
    visibility: "Private"
  },
  {
    name: "STORELOGO",
    type: "String",
    visibility: "Public"
  },
  {
    name: "STORENAME",
    type: "String",
    visibility: "Public"
  },
  {
    name: "STOREPHONE",
    type: "String",
    visibility: "Public"
  },
  {
    name: "SVC2NDCAREXPIRE",
    type: "Date",
    visibility: "Private"
  },
  {
    name: "SVC2NDCAROFFERAMOUNT",
    type: "Numeric",
    visibility: "Private"
  },
  {
    name: "SVC2NDCAROFFERDESC",
    type: "String",
    visibility: "Private"
  },
  {
    name: "TEMPLATESMA",
    type: "String",
    visibility: "Private"
  },
  {
    name: "TERM",
    type: "Numeric",
    visibility: "Private"
  },
  {
    name: "TRIM",
    type: "String",
    visibility: "Private"
  },
  {
    name: "TRIMSER",
    type: "String",
    visibility: "Private"
  },
  {
    name: "VIN",
    type: "String",
    visibility: "Private"
  },
  {
    name: "VINSER",
    type: "String",
    visibility: "Private"
  },
  {
    name: "ZIPCODE",
    type: "String",
    visibility: "Private",
  }
];

export function encodeBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return btoa(credentials);
}

export async function createDataField(
  credentials: ApiCredentials,
  dataField: DataField
): Promise<CreateDataFieldResult> {
  try {
    const response = await fetch('/api/dotdigital', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentials,
        dataField
      }),
    });

    const result = await response.json();

    if (!result.success) {
      if (result.status === 409 || (result.error && (result.error.includes('already exists') || result.error.includes('duplicate')))) {
        return {
          success: true,
          error: `Data field '${dataField.name}' already exists - skipped`,
          originalField: dataField,
        };
      }

      return {
        success: false,
        error: result.error || `HTTP ${result.status}: Request failed`,
        originalField: dataField,
      };
    }

    return {
      success: true,
      dataField: result.data,
      originalField: dataField,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      originalField: dataField,
    };
  }
}

export async function createDataFields(
  credentials: ApiCredentials,
  dataFields: DataField[]
): Promise<CreateDataFieldResult[]> {
  const results: CreateDataFieldResult[] = [];

  for (const dataField of dataFields) {
    const result = await createDataField(credentials, dataField);
    results.push(result);
  }

  return results;
}

export async function createDataFieldsForSelectedStores(
  storeCredentials: Array<{ credentials: ApiCredentials; storeName: string }>,
  dataFields: DataField[],
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<MultiStoreDataFieldResult[]> {
  const results: MultiStoreDataFieldResult[] = [];

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
      const storeResults = await createDataFields(credentials, dataFields);

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

      // Create error results for all fields for this store
      const errorResults: CreateDataFieldResult[] = dataFields.map(field => ({
        success: false,
        error: `Store processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalField: field,
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

export async function createDataFieldsForAllStores(
  dataFields: DataField[],
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<MultiStoreDataFieldResult[]> {
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

  return createDataFieldsForSelectedStores(storeCredentials, dataFields, onProgress);
}

export async function deleteDataField(
  credentials: ApiCredentials,
  fieldName: string
): Promise<DeleteDataFieldResult> {
  try {
    const response = await fetch('/api/dotdigital-delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentials,
        fieldName
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        fieldName,
        error: result.error || `HTTP ${result.status}: Request failed`,
      };
    }

    return {
      success: true,
      fieldName,
    };
  } catch (error) {
    return {
      success: false,
      fieldName,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deleteDataFields(
  credentials: ApiCredentials,
  fieldNames: string[]
): Promise<DeleteDataFieldResult[]> {
  const results: DeleteDataFieldResult[] = [];

  for (const fieldName of fieldNames) {
    const result = await deleteDataField(credentials, fieldName);
    results.push(result);
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

export async function deleteDataFieldsForSelectedStores(
  storeCredentials: Array<{ credentials: ApiCredentials; storeName: string }>,
  fieldNames: string[],
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<MultiStoreDeleteResult[]> {
  const results: MultiStoreDeleteResult[] = [];

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
      const storeResults = await deleteDataFields(credentials, fieldNames);

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

      // Create error results for all fields for this store
      const errorResults: DeleteDataFieldResult[] = fieldNames.map(fieldName => ({
        success: false,
        fieldName,
        error: `Store processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

export async function deleteDataFieldsForAllStores(
  fieldNames: string[],
  onProgress?: (progress: BulkOperationProgress) => void
): Promise<MultiStoreDeleteResult[]> {
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

  return deleteDataFieldsForSelectedStores(storeCredentials, fieldNames, onProgress);
}