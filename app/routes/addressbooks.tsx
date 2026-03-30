import { useState } from "react";
import { toast } from "sonner";
import type { Route } from "./+types/addressbooks";
import {
  createAddressBooks,
  createAddressBooksForAllStores,
  createAddressBooksForSelectedStores,
  PREDEFINED_ADDRESS_BOOKS,
  type AddressBook,
  type ApiCredentials,
  type CreateAddressBookResult,
  type MultiStoreAddressBookResult,
  type BulkOperationProgress,
} from "../utils/addressbook-api";
import StoreSelector from "../components/StoreSelector";
import { Button } from "~/components/ui/button";
import { ConfirmButton } from "~/components/ui/confirm-button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
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
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "DotDigital Address Books Manager" },
    { name: "description", content: "Manage DotDigital address books" },
  ];
}

export default function AddressBooks() {
  const [selectedStores, setSelectedStores] = useState<Array<{ credentials: ApiCredentials; storeName: string }>>([]);
  const [customBooks, setCustomBooks] = useState<AddressBook[]>([{ name: "", visibility: "Private" }]);
  const [results, setResults] = useState<CreateAddressBookResult[]>([]);
  const [multiStoreResults, setMultiStoreResults] = useState<MultiStoreAddressBookResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAllStoresMode, setIsAllStoresMode] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkOperationProgress | null>(null);

  const handleCustomBookChange = (index: number, field: keyof AddressBook, value: string) =>
    setCustomBooks((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const addCustomBook = () => setCustomBooks((prev) => [...prev, { name: "", visibility: "Private" }]);
  const removeCustomBook = (i: number) => setCustomBooks((prev) => prev.filter((_, idx) => idx !== i));

  const clearResults = () => { setResults([]); setMultiStoreResults([]); };

  const handleStoreSelect = (stores: Array<{ credentials: ApiCredentials; storeName: string }>) => {
    setSelectedStores(stores);
    setIsAllStoresMode(false);
    clearResults();
  };
  const handleAllStoresSelect = () => { setSelectedStores([]); setIsAllStoresMode(true); clearResults(); };
  const handleStoreClear = () => { setSelectedStores([]); setIsAllStoresMode(false); clearResults(); };

  const runOp = async (opName: string, books: AddressBook[]) => {
    if (!isAllStoresMode && selectedStores.length === 0) { toast.error("Please select at least one store"); return; }
    setIsLoading(true);
    setBulkProgress(null);
    setResults([]);
    setMultiStoreResults([]);
    try {
      if (isAllStoresMode) {
        const r = await createAddressBooksForAllStores(books, setBulkProgress);
        setMultiStoreResults(r);
        toast.success(`${opName} complete across ${r.length} stores`);
      } else if (selectedStores.length === 1) {
        const r = await createAddressBooks(selectedStores[0].credentials, books);
        setResults(r);
        toast.success(`${opName} complete: ${r.filter((x) => x.success).length} / ${r.length} succeeded`);
      } else {
        const r = await createAddressBooksForSelectedStores(selectedStores, books, setBulkProgress);
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

  const handleCreatePredefinedBooks = () => runOp("Predefined books import", PREDEFINED_ADDRESS_BOOKS);

  const handleCreateCustomBooks = () => {
    const valid = customBooks.filter((b) => b.name.trim());
    if (!valid.length) { toast.error("Please add at least one address book"); return; }
    runOp("Custom books creation", valid);
  };

  const progressValue = bulkProgress
    ? Math.round(((bulkProgress.currentStoreIndex + 1) / bulkProgress.totalStores) * 100)
    : 0;

  const isDisabled = isLoading || (!isAllStoresMode && selectedStores.length === 0);

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Address Books Manager</h1>

        <StoreSelector onStoreSelect={handleStoreSelect} onAllStoresSelect={handleAllStoresSelect} onClear={handleStoreClear} />

        {/* Selected stores chips */}
        {selectedStores.length > 0 && !isAllStoresMode && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {selectedStores.map((s) => (
              <Badge key={s.storeName} variant="secondary">{s.storeName}</Badge>
            ))}
          </div>
        )}

        {/* Predefined books */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Predefined Address Books</CardTitle>
            <CardDescription>
              Import {PREDEFINED_ADDRESS_BOOKS.length} predefined address books for automotive dealership management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmButton onClick={handleCreatePredefinedBooks} disabled={isDisabled} size="sm" confirmMessage="Import predefined address books to selected stores?">
              {isLoading ? <><Loader2Icon className="size-3.5 mr-1.5 animate-spin" />Processing…</> : "Import Predefined Address Books"}
            </ConfirmButton>
          </CardContent>
        </Card>

        {/* Custom books */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Custom Address Books</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customBooks.map((book, index) => (
              <div key={index} className="rounded-lg border border-border p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={book.name}
                      onChange={(e) => handleCustomBookChange(index, "name", e.target.value)}
                      placeholder="Address book name"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Visibility</Label>
                    <Select value={book.visibility} onValueChange={(v) => handleCustomBookChange(index, "visibility", v ?? "")}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomBook(index)}
                  className="text-destructive hover:text-destructive h-7 px-2"
                >
                  <Trash2Icon className="size-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={addCustomBook}>
                <PlusIcon className="size-3.5" />Add Address Book
              </Button>
              <ConfirmButton size="sm" onClick={handleCreateCustomBooks} disabled={isDisabled} confirmMessage="Create these address books in selected stores?">
                {isLoading ? <><Loader2Icon className="size-3.5 mr-1.5 animate-spin" />Processing…</> : "Create Custom Address Books"}
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
                          <span className="font-medium">{r.originalBook.name}</span>
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

        {/* Single store results */}
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
                    <span className="text-sm font-medium">{r.originalBook.name}</span>
                    {r.error && <p className="text-xs text-muted-foreground mt-0.5">{r.error}</p>}
                    {r.addressBook && (
                      <p className="text-xs text-muted-foreground mt-0.5">ID: {r.addressBook.id} · {r.addressBook.visibility}</p>
                    )}
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
