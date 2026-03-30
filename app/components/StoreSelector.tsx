import { useState, useEffect } from "react";
import type { VendorAccount } from "../data/dotdigital_accounts";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import { StoreIcon, XIcon, AlertTriangleIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface StoreSelectorProps {
  onStoreSelect: (stores: Array<{ credentials: { username: string; password: string }; storeName: string }>) => void;
  onAllStoresSelect: () => void;
  onClear: () => void;
}

export default function StoreSelector({ onStoreSelect, onAllStoresSelect, onClear }: StoreSelectorProps) {
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [isAllStoresMode, setIsAllStoresMode] = useState(false);
  const [showStoreList, setShowStoreList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStores, setActiveStores] = useState<VendorAccount[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [storeLoadError, setStoreLoadError] = useState<string | null>(null);

  const loadStores = () => {
    setStoreLoadError(null);
    setIsLoadingStores(true);
    fetch("/api/accounts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stores");
        return res.json();
      })
      .then((data: VendorAccount[]) =>
        setActiveStores(data.sort((a, b) => a.name.localeCompare(b.name)))
      )
      .catch((err) =>
        setStoreLoadError(err instanceof Error ? err.message : "Failed to load stores")
      )
      .finally(() => setIsLoadingStores(false));
  };

  useEffect(() => {
    loadStores();
  }, []);

  const filteredStores = activeStores.filter((store) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStoreToggle = (storeName: string) => {
    let newSelected: string[];
    if (selectedStores.includes(storeName)) {
      newSelected = selectedStores.filter((s) => s !== storeName);
    } else {
      newSelected = [...selectedStores, storeName];
    }
    setSelectedStores(newSelected);
    setIsAllStoresMode(false);

    if (newSelected.length === 0) {
      onClear();
      return;
    }

    onStoreSelect(
      newSelected.map((name) => {
        const store = activeStores.find((s) => s.name === name)!;
        return {
          credentials: { username: store.apiCredentials.apiUser!, password: store.apiCredentials.apiPassword! },
          storeName: name,
        };
      })
    );
  };

  const handleAllStoresClick = () => {
    setSelectedStores([]);
    setIsAllStoresMode(true);
    setShowStoreList(false);
    setSearchTerm("");
    onAllStoresSelect();
  };

  const handleClear = () => {
    setSelectedStores([]);
    setIsAllStoresMode(false);
    setShowStoreList(false);
    setSearchTerm("");
    onClear();
  };

  const handleRemoveStore = (storeName: string) => {
    const newSelected = selectedStores.filter((s) => s !== storeName);
    setSelectedStores(newSelected);
    if (newSelected.length === 0) {
      onClear();
      return;
    }
    onStoreSelect(
      newSelected.map((name) => {
        const store = activeStores.find((s) => s.name === name)!;
        return {
          credentials: { username: store.apiCredentials.apiUser!, password: store.apiCredentials.apiPassword! },
          storeName: name,
        };
      })
    );
  };

  if (isLoadingStores) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Store Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (storeLoadError) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-4">
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load stores</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{storeLoadError}</span>
              <Button size="sm" variant="outline" onClick={loadStores} className="ml-4 shrink-0">
                <RefreshCwIcon className="size-3.5 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Store Selection
          <span className="text-xs font-normal text-muted-foreground">
            {activeStores.length} active stores
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={showStoreList ? "secondary" : "outline"}
            onClick={() => {
              if (showStoreList) setSearchTerm("");
              setShowStoreList((o) => !o);
            }}
          >
            {showStoreList ? "Hide Store List" : "Select Stores"}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={isAllStoresMode ? "default" : "secondary"}
            onClick={handleAllStoresClick}
          >
            <StoreIcon className="size-3.5" />
            All Stores ({activeStores.length})
          </Button>

          {(selectedStores.length > 0 || isAllStoresMode) && (
            <Button type="button" size="sm" variant="ghost" onClick={handleClear}>
              <XIcon className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Dropdown store list */}
        {showStoreList && !isAllStoresMode && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="p-2 border-b border-border bg-muted/30">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search stores..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => (
                  <div
                    key={store.vendorAccountsId}
                    onClick={() => handleStoreToggle(store.name)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors text-sm",
                      selectedStores.includes(store.name) && "bg-muted/30"
                    )}
                  >
                    <Checkbox
                      checked={selectedStores.includes(store.name)}
                      onCheckedChange={() => handleStoreToggle(store.name)}
                    />
                    {store.name}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No stores found</p>
              )}
            </div>
          </div>
        )}

        {/* Selected store chips */}
        {selectedStores.length > 0 && !isAllStoresMode && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">
                Selected ({selectedStores.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedStores.map((name) => (
                  <Badge key={name} variant="secondary" className="gap-1 pr-1">
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemoveStore(name)}
                      className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                      aria-label={`Remove ${name}`}
                    >
                      <XIcon className="size-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* All stores mode indicator */}
        {isAllStoresMode && (
          <Alert>
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Bulk Operation Mode</AlertTitle>
            <AlertDescription>
              Operations will be applied to all <strong>{activeStores.length} active stores</strong>. This may take several minutes.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
