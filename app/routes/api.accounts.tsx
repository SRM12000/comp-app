import { getActiveVendorAccounts } from "../data/dotdigital_accounts";

export async function loader() {
  try {
    const accounts = await getActiveVendorAccounts();
    return Response.json(accounts);
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return Response.json(
      { error: "Failed to fetch vendor accounts" },
      { status: 500 }
    );
  }
}
