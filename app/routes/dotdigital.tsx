import { useState } from "react";
import { toast } from "sonner";
import type { Route } from "./+types/dotdigital";
import {
  createDataFields,
  createDataFieldsForAllStores,
  createDataFieldsForSelectedStores,
  deleteDataFields,
  deleteDataFieldsForAllStores,
  deleteDataFieldsForSelectedStores,
  PREDEFINED_DATA_FIELDS,
  type DataField,
  type ApiCredentials,
  type CreateDataFieldResult,
  type MultiStoreDataFieldResult,
  type DeleteDataFieldResult,
  type MultiStoreDeleteResult,
  type BulkOperationProgress,
} from "../utils/dotdigital-api";
import StoreSelector from "../components/StoreSelector";
import { Button } from "~/components/ui/button";
import { ConfirmButton } from "~/components/ui/confirm-button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import {
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "DotDigital Data Fields Manager" },
    { name: "description", content: "Manage DotDigital data fields" },
  ];
}

export default function DotDigital() {
  const [selectedStores, setSelectedStores] = useState<Array<{ credentials: ApiCredentials; storeName: string }>>([]);
  const [customFields, setCustomFields] = useState<DataField[]>([{ name: "", type: "String", visibility: "Private", defaultValue: "" }]);
  const [results, setResults] = useState<CreateDataFieldResult[]>([]);
  const [multiStoreResults, setMultiStoreResults] = useState<MultiStoreDataFieldResult[]>([]);
  const [deleteResults, setDeleteResults] = useState<DeleteDataFieldResult[]>([]);
  const [multiStoreDeleteResults, setMultiStoreDeleteResults] = useState<MultiStoreDeleteResult[]>([]);
  const [deleteFieldNames, setDeleteFieldNames] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAllStoresMode, setIsAllStoresMode] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkOperationProgress | null>(null);

  const handleCustomFieldChange = (index: number, field: keyof DataField, value: string) => {
    setCustomFields((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "type") {
          if (value !== "Date" && item.defaultValue === "1900-01-01T00:00:00") updated.defaultValue = "";
          else if (value !== "Numeric" && item.defaultValue === 0) updated.defaultValue = "";
          else if (value !== "Boolean" && (item.defaultValue === true || item.defaultValue === false)) updated.defaultValue = "";
        }
        return updated;
      })
    );
  };

  const addCustomField = () => setCustomFields((prev) => [...prev, { name: "", type: "String", visibility: "Private", defaultValue: "" }]);
  const removeCustomField = (i: number) => setCustomFields((prev) => prev.filter((_, idx) => idx !== i));
  const addDeleteFieldName = () => setDeleteFieldNames((prev) => [...prev, ""]);
  const removeDeleteFieldName = (i: number) => setDeleteFieldNames((prev) => prev.filter((_, idx) => idx !== i));
  const handleDeleteFieldNameChange = (i: number, val: string) =>
    setDeleteFieldNames((prev) => prev.map((n, idx) => (idx === i ? val : n)));

  const clearResults = () => { setResults([]); setMultiStoreResults([]); setDeleteResults([]); setMultiStoreDeleteResults([]); };

  const handleStoreSelect = (stores: Array<{ credentials: ApiCredentials; storeName: string }>) => {
    setSelectedStores(stores);
    setIsAllStoresMode(false);
    clearResults();
  };
  const handleAllStoresSelect = () => { setSelectedStores([]); setIsAllStoresMode(true); clearResults(); };
  const handleStoreClear = () => { setSelectedStores([]); setIsAllStoresMode(false); clearResults(); };

  const runBulkOp = async (
    opName: string,
    allStoresFn: () => Promise<MultiStoreDataFieldResult[]>,
    multiStoreFn: () => Promise<MultiStoreDataFieldResult[]>,
    singleStoreFn: () => Promise<CreateDataFieldResult[]>
  ) => {
    if (!isAllStoresMode && selectedStores.length === 0) { toast.error("Please select at least one store"); return; }
    setIsLoading(true);
    setBulkProgress(null);
    setResults([]);
    setMultiStoreResults([]);
    try {
      if (isAllStoresMode) {
        const r = await allStoresFn();
        setMultiStoreResults(r);
        toast.success(`${opName} complete across ${r.length} stores`);
      } else if (selectedStores.length === 1) {
        const r = await singleStoreFn();
        setResults(r);
        toast.success(`${opName} complete: ${r.filter((x) => x.success).length} / ${r.length} succeeded`);
      } else {
        const r = await multiStoreFn();
        setMultiStoreResults(r);
        toast.success(`${opName} complete across ${r.length} stores`);
      }
    } catch (err) {
      toast.error(`${opName} failed`, { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setIsLoading(false);
      setBulkProgress(null);
    }
  };

  const handleCreatePredefinedFields = () =>
    runBulkOp(
      "Predefined fields import",
      () => createDataFieldsForAllStores(PREDEFINED_DATA_FIELDS, setBulkProgress),
      () => createDataFieldsForSelectedStores(selectedStores, PREDEFINED_DATA_FIELDS, setBulkProgress),
      () => createDataFields(selectedStores[0].credentials, PREDEFINED_DATA_FIELDS)
    );

  const handleCreateCustomFields = () => {
    const validFields = customFields.filter((f) => f.name.trim());
    if (!validFields.length) { toast.error("Please add at least one valid field"); return; }
    runBulkOp(
      "Custom fields creation",
      () => createDataFieldsForAllStores(validFields, setBulkProgress),
      () => createDataFieldsForSelectedStores(selectedStores, validFields, setBulkProgress),
      () => createDataFields(selectedStores[0].credentials, validFields)
    );
  };

  const handleDeleteFields = async () => {
    const validNames = deleteFieldNames.filter((n) => n.trim());
    if (!validNames.length) { toast.error("Please add at least one field name to delete"); return; }
    if (!isAllStoresMode && selectedStores.length === 0) { toast.error("Please select at least one store"); return; }
    setIsLoading(true);
    setBulkProgress(null);
    setResults([]);
    setMultiStoreResults([]);
    setDeleteResults([]);
    setMultiStoreDeleteResults([]);
    try {
      if (isAllStoresMode) {
        const r = await deleteDataFieldsForAllStores(validNames, setBulkProgress);
        setMultiStoreDeleteResults(r);
        toast.success(`Delete complete across ${r.length} stores`);
      } else if (selectedStores.length === 1) {
        const r = await deleteDataFields(selectedStores[0].credentials, validNames);
        setDeleteResults(r);
        toast.success(`Delete complete: ${r.filter((x) => x.success).length} / ${r.length} succeeded`);
      } else {
        const r = await deleteDataFieldsForSelectedStores(selectedStores, validNames, setBulkProgress);
        setMultiStoreDeleteResults(r);
        toast.success(`Delete complete across ${r.length} stores`);
      }
    } catch (err) {
      toast.error("Delete failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setIsLoading(false);
      setBulkProgress(null);
    }
  };

  const progressValue = bulkProgress
    ? Math.round(((bulkProgress.currentStoreIndex + 1) / bulkProgress.totalStores) * 100)
    : 0;

  const isDisabled = isLoading || (!isAllStoresMode && selectedStores.length === 0);

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Data Fields Manager</h1>

        <StoreSelector onStoreSelect={handleStoreSelect} onAllStoresSelect={handleAllStoresSelect} onClear={handleStoreClear} />

        {/* Selected stores info */}
        {selectedStores.length > 0 && !isAllStoresMode && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {selectedStores.map((s) => (
              <Badge key={s.storeName} variant="secondary">{s.storeName}</Badge>
            ))}
          </div>
        )}

        {/* Predefined fields */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Predefined Data Fields</CardTitle>
            <CardDescription>
              Import {PREDEFINED_DATA_FIELDS.length} predefined fields for automotive dealership management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmButton onClick={handleCreatePredefinedFields} disabled={isDisabled} size="sm" confirmMessage="Import predefined fields to selected stores?">
              {isLoading ? <><Loader2Icon className="size-3.5 mr-1.5 animate-spin" />Processing…</> : "Import Predefined Fields"}
            </ConfirmButton>
          </CardContent>
        </Card>

        {/* Custom fields */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Custom Data Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customFields.map((field, index) => (
              <div key={index} className="rounded-lg border border-border p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => handleCustomFieldChange(index, "name", e.target.value)}
                      placeholder="Field name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <Select value={field.type} onValueChange={(v) => handleCustomFieldChange(index, "type", v ?? "")}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["String", "Numeric", "Date", "Boolean"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Visibility</Label>
                    <Select value={field.visibility} onValueChange={(v) => handleCustomFieldChange(index, "visibility", v ?? "")}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Default Value</Label>
                    {field.type === "Boolean" ? (
                      <Select
                        value={field.defaultValue?.toString() || ""}
                        onValueChange={(v) => handleCustomFieldChange(index, "defaultValue", v ?? "")}
                      >
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="No default" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">False</SelectItem>
                          <SelectItem value="true">True</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type === "Date" ? "datetime-local" : field.type === "Numeric" ? "number" : "text"}
                        value={field.type === "Date" && field.defaultValue ? (field.defaultValue as string).slice(0, 16) : field.defaultValue?.toString() || ""}
                        onChange={(e) => {
                          let val: string | number = e.target.value;
                          if (field.type === "Date" && val) val = new Date(val as string).toISOString();
                          else if (field.type === "Numeric" && val !== "") {
                            val = parseFloat(val as string);
                            if (isNaN(val as number)) val = "";
                          }
                          handleCustomFieldChange(index, "defaultValue", val.toString());
                        }}
                        placeholder="Optional"
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomField(index)}
                  className="text-destructive hover:text-destructive h-7 px-2"
                >
                  <Trash2Icon className="size-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                <PlusIcon className="size-3.5" />Add Field
              </Button>
              <ConfirmButton size="sm" onClick={handleCreateCustomFields} disabled={isDisabled} confirmMessage="Create these custom fields in selected stores?">
                {isLoading ? <><Loader2Icon className="size-3.5 mr-1.5 animate-spin" />Processing…</> : "Create Custom Fields"}
              </ConfirmButton>
            </div>
          </CardContent>
        </Card>

        {/* Delete fields */}
        <Card className="mb-4 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-destructive">Delete Data Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert variant="destructive">
              <TriangleAlertIcon className="size-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This permanently deletes fields. Reserved fields (FIRSTNAME, LASTNAME, etc.) or fields in use cannot be deleted.
              </AlertDescription>
            </Alert>
            {deleteFieldNames.map((name, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Field Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => handleDeleteFieldNameChange(i, e.target.value)}
                    placeholder="EXACT_FIELD_NAME"
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeDeleteFieldName(i)}
                  className="text-destructive hover:text-destructive mb-0.5"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={addDeleteFieldName}>
                <PlusIcon className="size-3.5" />Add Name
              </Button>
              <ConfirmButton variant="destructive" size="sm" onClick={handleDeleteFields} disabled={isDisabled} confirmMessage="Permanently delete these fields? This cannot be undone.">
                {isLoading ? <><Loader2Icon className="size-3.5 mr-1.5 animate-spin" />Processing…</> : "Delete Fields"}
              </ConfirmButton>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {bulkProgress && !bulkProgress.completed && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Processing Stores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current: <strong className="text-foreground">{bulkProgress.currentStore}</strong></span>
                <span>{bulkProgress.currentStoreIndex + 1} / {bulkProgress.totalStores}</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Multi-store results */}
        {multiStoreResults.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Bulk Operation Results</CardTitle>
                <Badge variant="secondary">{multiStoreResults.length} stores</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xl font-bold text-green-700">{multiStoreResults.reduce((s, r) => s + r.totalSuccessful, 0)}</p>
                  <p className="text-xs text-green-600">Total Successful</p>
                </div>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-xl font-bold text-destructive">{multiStoreResults.reduce((s, r) => s + r.totalFailed, 0)}</p>
                  <p className="text-xs text-destructive/80">Total Failed</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xl font-bold">{multiStoreResults.length}</p>
                  <p className="text-xs text-muted-foreground">Stores Processed</p>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {multiStoreResults.map((sr, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{sr.storeName}</span>
                      <div className="flex gap-1.5">
                        <Badge variant="secondary" className="text-green-700 bg-green-100">{sr.totalSuccessful} ok</Badge>
                        {sr.totalFailed > 0 && <Badge variant="destructive">{sr.totalFailed} failed</Badge>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {sr.storeResults.slice(0, 3).map((r, ri) => (
                        <div key={ri} className={cn("text-xs rounded px-2 py-1", r.success ? "bg-green-50 text-green-700" : "bg-destructive/5 text-destructive")}>
                          <span className="font-medium">{r.originalField.name}</span>
                          {r.error && <span className="ml-2 opacity-80">— {r.error}</span>}
                        </div>
                      ))}
                      {sr.storeResults.length > 3 && (
                        <p className="text-xs text-muted-foreground px-2">… and {sr.storeResults.length - 3} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Multi-store delete results */}
        {multiStoreDeleteResults.length > 0 && (
          <Card className="mb-4 border-destructive/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-destructive">Bulk Delete Results</CardTitle>
                <Badge variant="secondary">{multiStoreDeleteResults.length} stores</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xl font-bold text-green-700">{multiStoreDeleteResults.reduce((s, r) => s + r.totalSuccessful, 0)}</p>
                  <p className="text-xs text-green-600">Total Deleted</p>
                </div>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-xl font-bold text-destructive">{multiStoreDeleteResults.reduce((s, r) => s + r.totalFailed, 0)}</p>
                  <p className="text-xs text-destructive/80">Total Failed</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xl font-bold">{multiStoreDeleteResults.length}</p>
                  <p className="text-xs text-muted-foreground">Stores Processed</p>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {multiStoreDeleteResults.map((sr, i) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{sr.storeName}</span>
                      <div className="flex gap-1.5">
                        <Badge variant="secondary" className="text-green-700 bg-green-100">{sr.totalSuccessful} deleted</Badge>
                        {sr.totalFailed > 0 && <Badge variant="destructive">{sr.totalFailed} failed</Badge>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {sr.storeResults.slice(0, 3).map((r, ri) => (
                        <div key={ri} className={cn("text-xs rounded px-2 py-1", r.success ? "bg-green-50 text-green-700" : "bg-destructive/5 text-destructive")}>
                          <span className="font-medium">{r.fieldName}</span>
                          {r.error && <span className="ml-2 opacity-80">— {r.error}</span>}
                        </div>
                      ))}
                      {sr.storeResults.length > 3 && (
                        <p className="text-xs text-muted-foreground px-2">… and {sr.storeResults.length - 3} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Single store delete results */}
        {deleteResults.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Delete Results</CardTitle>
                {selectedStores.length === 1 && <Badge variant="outline">{selectedStores[0].storeName}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {deleteResults.map((r, i) => (
                <div key={i} className={cn("rounded-lg border p-3 flex items-center justify-between", r.success ? "bg-green-50 border-green-200" : "bg-destructive/5 border-destructive/20")}>
                  <div>
                    <span className="text-sm font-medium">{r.fieldName}</span>
                    {r.error && <p className="text-xs text-muted-foreground mt-0.5">{r.error}</p>}
                  </div>
                  {r.success
                    ? <CheckCircle2Icon className="size-4 text-green-600" />
                    : <XCircleIcon className="size-4 text-destructive" />}
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                Deleted: {deleteResults.filter((r) => r.success).length} · Failed: {deleteResults.filter((r) => !r.success).length} · Total: {deleteResults.length}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Single store create results */}
        {results.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Results</CardTitle>
                {selectedStores.length === 1 && <Badge variant="outline">{selectedStores[0].storeName}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className={cn("rounded-lg border p-3 flex items-center justify-between", r.success ? "bg-green-50 border-green-200" : "bg-destructive/5 border-destructive/20")}>
                  <div>
                    <span className="text-sm font-medium">{r.originalField.name}</span>
                    {r.error && <p className="text-xs text-muted-foreground mt-0.5">{r.error}</p>}
                    {r.dataField && <p className="text-xs text-muted-foreground mt-0.5">ID: {r.dataField.id}</p>}
                  </div>
                  {r.success
                    ? <CheckCircle2Icon className="size-4 text-green-600" />
                    : <XCircleIcon className="size-4 text-destructive" />}
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                Successful: {results.filter((r) => r.success).length} · Failed: {results.filter((r) => !r.success).length} · Total: {results.length}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
