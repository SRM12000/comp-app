import { useState } from "react";
import { toast } from "sonner";
import type { Route } from "./+types/contact-imports";
import {
  parseExcelFile,
  importContactsForAllStores,
  importContactsForStores,
  type Contact,
  type ParsedExcelData,
  type ApiCredentials,
  type ContactImportResult,
  type BulkOperationProgress,
  type ColumnMapping,
} from "../utils/contact-import-api";
import StoreSelector from "../components/StoreSelector";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import {
  CheckCircle2Icon,
  XCircleIcon,
  UploadIcon,
  Loader2Icon,
  CheckIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Imports - DotDigital Manager" },
    { name: "description", content: "Import and manage contacts" },
  ];
}

export default function ContactImports() {
  const [selectedStores, setSelectedStores] = useState<Array<{ credentials: ApiCredentials; storeName: string }>>([]);
  const [isAllStoresMode, setIsAllStoresMode] = useState(false);
  const [listName, setListName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({ email: null, firstName: null, lastName: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkOperationProgress | null>(null);
  const [importResults, setImportResults] = useState<ContactImportResult[]>([]);

  const handleStoreSelect = (stores: Array<{ credentials: ApiCredentials; storeName: string }>) => {
    setSelectedStores(stores);
    setIsAllStoresMode(false);
  };
  const handleAllStoresSelect = () => { setIsAllStoresMode(true); setSelectedStores([]); };
  const handleClear = () => { setSelectedStores([]); setIsAllStoresMode(false); };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsLoading(true);
    setParsedData(null);
    setImportResults([]);
    try {
      const data = await parseExcelFile(file);
      setParsedData(data);
      setColumnMapping(data.detectedColumns);
    } catch (error) {
      toast.error("Error parsing file", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping((prev) => ({ ...prev, [field]: value || null }));
  };

  const handleImport = async () => {
    if (!listName.trim()) { toast.error("Please enter a list name"); return; }
    if (!parsedData || parsedData.contacts.length === 0) { toast.error("No valid contacts to import"); return; }
    if (!columnMapping.firstName || !columnMapping.lastName) { toast.error("Please map both First Name and Last Name columns"); return; }
    if (!isAllStoresMode && selectedStores.length === 0) { toast.error("Please select at least one store or choose 'All Stores'"); return; }

    setIsImporting(true);
    setBulkProgress(null);
    setImportResults([]);

    try {
      let results: ContactImportResult[];
      if (isAllStoresMode) {
        results = await importContactsForAllStores(listName, parsedData.contacts, setBulkProgress);
      } else {
        results = await importContactsForStores(selectedStores, listName, parsedData.contacts, setBulkProgress);
      }
      setImportResults(results);
      const successCount = results.filter((r) => r.success).length;
      toast.success(`Import complete: ${successCount} / ${results.length} stores succeeded`);
    } catch (error) {
      toast.error("Import failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setIsImporting(false);
      setBulkProgress(null);
    }
  };

  const columns = parsedData ? Object.keys(parsedData.contacts[0] || {}) : [];
  const totalSuccessful = importResults.reduce((sum, r) => sum + r.successCount, 0);
  const totalFailed = importResults.reduce((sum, r) => sum + r.failureCount, 0);
  const successfulStores = importResults.filter((r) => r.success).length;
  const failedStores = importResults.filter((r) => !r.success).length;
  const progressValue = bulkProgress
    ? Math.round(((bulkProgress.currentStoreIndex + 1) / bulkProgress.totalStores) * 100)
    : 0;

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Contact Imports</h1>

        {/* Step 1: Store selection */}
        <div className="mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Step 1 — Select Store(s)</p>
          <StoreSelector onStoreSelect={handleStoreSelect} onAllStoresSelect={handleAllStoresSelect} onClear={handleClear} />
        </div>

        {/* Step 2: List name */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Step 2 — Enter List Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g., Newsletter Subscribers"
            />
          </CardContent>
        </Card>

        {/* Step 3: File upload */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Step 3 — Upload Excel File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-muted/30 transition-colors">
              <UploadIcon className="size-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">Click to upload</span>
              <span className="text-xs text-muted-foreground mt-1">.xlsx, .xls, or .csv</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                disabled={isLoading || isImporting}
                className="sr-only"
              />
            </label>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                <CheckIcon className="size-3.5 text-green-600" />
                {selectedFile.name}
              </div>
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Parsing file…
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 4: Column mapping + preview + import */}
        {parsedData && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Step 4 — Verify Column Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Column selects */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["email", "firstName", "lastName"] as const).map((field) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      {field === "email" ? "Email" : field === "firstName" ? "First Name" : "Last Name"}
                      {columnMapping[field] && <CheckCircle2Icon className="size-3.5 text-green-600" />}
                    </Label>
                    <Select
                      value={columnMapping[field] || ""}
                      onValueChange={(v) => handleColumnMappingChange(field, v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="— Select column —" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Validation stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-xl font-bold text-green-700">{parsedData.contacts.length}</p>
                  <p className="text-xs text-green-600 mt-0.5">Valid Contacts</p>
                </div>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
                  <p className="text-xl font-bold text-destructive">{parsedData.invalidRows.length}</p>
                  <p className="text-xs text-destructive/80 mt-0.5">Invalid Rows</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-xl font-bold">{parsedData.totalRows}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Rows</p>
                </div>
              </div>

              {/* Preview table */}
              <div>
                <p className="text-sm font-medium mb-2">Preview (first 5 contacts)</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.contacts.slice(0, 5).map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{c.email}</TableCell>
                          <TableCell className="text-sm">{c.firstName || "—"}</TableCell>
                          <TableCell className="text-sm">{c.lastName || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedData.contacts.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-1.5 px-1">
                    … and {parsedData.contacts.length - 5} more contacts
                  </p>
                )}
              </div>

              {/* Invalid rows */}
              {parsedData.invalidRows.length > 0 && (
                <Alert variant="destructive">
                  <XCircleIcon className="size-4" />
                  <AlertTitle>Invalid Rows ({parsedData.invalidRows.length})</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 max-h-36 overflow-y-auto space-y-1">
                      {parsedData.invalidRows.map((row, i) => (
                        <p key={i} className="text-xs">
                          <strong>Row {row.rowNumber}:</strong> {row.reason}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Import button */}
              <Button
                onClick={handleImport}
                disabled={
                  isImporting ||
                  !listName ||
                  parsedData.contacts.length === 0 ||
                  !columnMapping.firstName ||
                  !columnMapping.lastName ||
                  (!isAllStoresMode && selectedStores.length === 0)
                }
                className="w-full"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2Icon className="size-4 mr-2 animate-spin" />
                    Importing…
                  </>
                ) : (
                  `Import ${parsedData.contacts.length} Contacts to ${
                    isAllStoresMode
                      ? "All Stores"
                      : selectedStores.length === 1
                      ? selectedStores[0].storeName
                      : `${selectedStores.length} Stores`
                  }`
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        {bulkProgress && !bulkProgress.completed && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Import Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Processing: <strong>{bulkProgress.currentStore}</strong></span>
                <span>{bulkProgress.currentStoreIndex + 1} / {bulkProgress.totalStores}</span>
              </div>
              <Progress value={progressValue} className="h-2" />
              {bulkProgress.currentStep && (
                <p className="text-xs text-muted-foreground">{bulkProgress.currentStep}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {importResults.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Import Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Successful Stores", value: successfulStores, color: "text-green-700", bg: "bg-green-50 border-green-200" },
                  { label: "Failed Stores", value: failedStores, color: "text-destructive", bg: "bg-destructive/5 border-destructive/20" },
                  { label: "Contacts Imported", value: totalSuccessful, color: "text-foreground", bg: "bg-muted/30 border-border" },
                  { label: "Contacts Failed", value: totalFailed, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
                ].map((stat) => (
                  <div key={stat.label} className={cn("rounded-lg border p-3 text-center", stat.bg)}>
                    <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Per-store breakdown */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {importResults.map((result, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-lg border p-4",
                      result.success ? "bg-green-50 border-green-200" : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {result.success
                        ? <CheckCircle2Icon className="size-4 text-green-600 shrink-0" />
                        : <XCircleIcon className="size-4 text-destructive shrink-0" />}
                      <span className="font-medium text-sm">{result.storeName}</span>
                    </div>
                    {result.success ? (
                      <div className="pl-6 space-y-0.5 text-xs text-muted-foreground">
                        <p>List: {result.addressBookName} (ID: {result.addressBookId})</p>
                        <p>Import ID: {result.importId}</p>
                        <p>Status: {result.importStatus}</p>
                        <p className="text-green-700">Success: {result.successCount} / {result.totalContacts}</p>
                        {result.failureCount > 0 && <p className="text-orange-700">Failed: {result.failureCount}</p>}
                      </div>
                    ) : (
                      result.error && <p className="pl-6 text-xs text-destructive">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
