export interface VendorAccount {
  vendorAccountsId: number
  name: string
  apiCredentials: {
    apiUser: string | null
    apiPassword: string | null
  }
  active: boolean
}

// Configuration from environment variables
const KEYCLOAK_LOGIN_URL = process.env.KEYCLOAK_LOGIN_URL!
const MASTER_API_URL = process.env.MASTER_API_URL!

const KEYCLOAK_CREDENTIALS = {
  grant_type: "password",
  client_id: process.env.KEYCLOAK_CLIENT_ID!,
  username: process.env.KEYCLOAK_USERNAME!,
  password: process.env.KEYCLOAK_PASSWORD!,
}

const DD_MASTER_ACCOUNTS_QUERY = `
  query {
    vendorAccounts(vendorIds:[12]) {
      vendorAccountsId
      name
      apiCredentials {
        apiUser
        apiPassword
      }
      active
    }
  }
`

export function base64Encode(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64")
}

/**
 * Login to Keycloak and get access token
 */
export async function keycloakLogin(): Promise<string> {
  try {
    const formData = new URLSearchParams()
    Object.entries(KEYCLOAK_CREDENTIALS).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const response = await fetch(KEYCLOAK_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`Keycloak login failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("Couldn't login to Keycloak:", error)
    throw error
  }
}

/**
 * Fetch active vendor accounts from GraphQL API
 */
export async function getActiveVendorAccounts(): Promise<VendorAccount[]> {
  try {
    const accessToken = await keycloakLogin()

    const response = await fetch(MASTER_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: DD_MASTER_ACCOUNTS_QUERY }),
    })

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    const activeAccounts: VendorAccount[] = result.data.vendorAccounts.filter(
      (account: VendorAccount) =>
        account.active &&
        account.apiCredentials.apiUser &&
        account.apiCredentials.apiPassword
    )

    console.log(`Received ${activeAccounts.length} active accounts`)
    return activeAccounts
  } catch (error) {
    console.error("Error fetching vendor accounts:", error)
    throw error
  }
}
