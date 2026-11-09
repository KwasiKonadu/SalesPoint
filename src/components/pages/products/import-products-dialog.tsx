"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { parseDelimited, productTemplateCsv, toProductRows, type RawProductRow } from "@/lib/csv";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useBulkProducts, type BulkResponse } from "./use-products";

interface Checked {
  rows: RawProductRow[];
  response: BulkResponse;
  unknownColumns: string[];
}

function downloadTemplate() {
  const blob = new Blob(["﻿" + productTemplateCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Excel (.xlsx) is read in the browser; everything else is treated as delimited text. */
async function readTable(file: File): Promise<string[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import("read-excel-file/browser");
    const sheet = await readSheet(file);
    return sheet.map((row) => row.map((c) => (c === null || c === undefined ? "" : c instanceof Date ? c.toISOString().slice(0, 10) : String(c))));
  }
  if (/\.xls$/i.test(file.name)) throw new Error("Old .xls files aren't supported. In Excel choose Save As → Excel Workbook (.xlsx) or CSV.");
  return parseDelimited(await file.text());
}

/**
 * Add many products at once. Drop in a spreadsheet (Excel or CSV) or paste rows, check them, then add.
 * A popup rather than a page: pick a file, review, done.
 */
export function ImportProductsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const bulk = useBulkProducts();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<Checked | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const reset = () => {
    setChecked(null);
    setProblem(null);
    setPasted("");
    setShowPaste(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const check = async (table: string[][]) => {
    setProblem(null);
    setChecked(null);
    const { rows, unknownColumns, missing } = toProductRows(table);
    if (missing.length) return setProblem(`The first row must have these columns: ${missing.join(", ")}. The template has them.`);
    if (rows.length === 0) return setProblem("No products found under the header row.");
    try {
      setChecked({ rows, unknownColumns, response: await bulk.mutateAsync({ rows, dryRun: true }) });
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Could not check the file");
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      await check(await readTable(file));
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Could not read that file");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const doImport = async () => {
    if (!checked) return;
    try {
      const res = await bulk.mutateAsync({ rows: checked.rows, dryRun: false });
      if (!res.valid) return setChecked({ ...checked, response: res });
      toast.success(`${res.created} product${res.created === 1 ? "" : "s"} added`);
      close(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed — nothing was added");
    }
  };

  const results = checked?.response.results ?? [];
  const bad = results.filter((r) => r.errors.length).length;
  const working = busy || bulk.isPending;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import products</DialogTitle>
          <DialogDescription>
            {checked ? "Check the rows below. Nothing is added until every row is right." : "Add many products at once from an Excel or CSV file."}
          </DialogDescription>
        </DialogHeader>

        {!checked && (
          <div className="space-y-4">
            <input ref={fileRef} type="file" accept=".xlsx,.csv,.tsv,.txt,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <button
              type="button"
              disabled={working}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/40",
                dragging && "border-primary bg-accent/60",
              )}
            >
              {working ? <Loader2 className="size-6 animate-spin text-muted-foreground" /> : <Upload className="size-6 text-muted-foreground" />}
              <span className="text-sm font-medium">{working ? "Reading your file…" : "Drop your spreadsheet here, or click to choose"}</span>
              <span className="text-xs text-muted-foreground">Excel (.xlsx) or CSV</span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} icon={<Download className="size-4" />}>
                Download template
              </Button>
              <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => setShowPaste((v) => !v)}>
                {showPaste ? "Hide paste box" : "Or paste rows from a spreadsheet"}
              </button>
            </div>

            {showPaste && (
              <div className="space-y-2">
                <Textarea rows={5} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder={"Name\tSelling price\tInitial stock\nRice 5kg\t65\t20"} />
                <Button type="button" variant="outline" size="sm" disabled={!pasted.trim() || working} onClick={() => check(parseDelimited(pasted))}>
                  Check pasted rows
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <b>Name</b> and <b>Selling price</b> are required. Category, type and unit must match ones you already have. Leave SKU empty to create one
              automatically, and use <b>Initial stock</b> for opening quantities.
            </p>
          </div>
        )}

        {problem && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            {problem}
          </div>
        )}

        {checked && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              {bad === 0 ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-destructive" />}
              <span>
                <b>{results.length}</b> row{results.length === 1 ? "" : "s"}
                {bad === 0 ? " — all good, ready to add." : ` — ${bad} need${bad === 1 ? "s" : ""} fixing. Fix the file and choose it again.`}
              </span>
            </div>
            {checked.unknownColumns.length > 0 && <p className="text-xs text-muted-foreground">Ignored columns: {checked.unknownColumns.join(", ")}</p>}

            <div className="max-h-[50vh] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="w-12 px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                    <th className="px-3 py-2 text-right font-medium">Stock</th>
                    <th className="px-3 py-2 font-medium">Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {checked.rows.map((r, i) => {
                    const res = results[i];
                    const price = Number((r.sellingPrice ?? "").replace(/[^0-9.\-]/g, ""));
                    return (
                      <tr key={i} className={cn("align-top", res?.errors.length && "bg-destructive/5")}>
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">{res?.row}</td>
                        <td className="px-3 py-2 font-medium">{r.name || "—"}</td>
                        <td className="px-3 py-2">{r.category || "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{price > 0 ? formatCurrency(price) : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.initialStock || 0}</td>
                        <td className="px-3 py-2">
                          {res?.errors.length ? (
                            <ul className="space-y-0.5 text-xs text-destructive">
                              {res.errors.map((e) => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <FileSpreadsheet className="size-3.5" /> Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={reset} disabled={bulk.isPending}>
                {bad ? "Choose another file" : "Back"}
              </Button>
              <Button onClick={doImport} disabled={bad > 0 || bulk.isPending}>
                {bulk.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Add {results.length} product{results.length === 1 ? "" : "s"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
