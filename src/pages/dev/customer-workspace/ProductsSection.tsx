/**
 * P3 — Company products. One shared current-company list.
 * All company roles may read it; only Owner/Administrator see one Edit action in
 * the ready state. Items are never deleted: confirmed items stay visible with the
 * Inactive status. In-memory only: no storage, no network, no real route import.
 */
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ProtoLang } from "./copy";
import {
  PRODUCT_CONDITIONS,
  PRODUCT_DIRECTIONS,
  PRODUCT_UNITS,
  protoProductsCopy,
  type ProductConditionKey,
  type ProductDirectionKey,
  type ProductUnitKey,
} from "./copy-p3";
import { PROTO_PRODUCTS, type ProtoProduct } from "./data-p3";
import { CONTROL } from "./ui";

export const ProductsOzNote = ({ lang }: { lang: ProtoLang }) => (
  <p className="text-xs text-muted-foreground" data-testid="proto-products-oz-note">
    {protoProductsCopy[lang].ozNote}
  </p>
);

const ProductsList = ({
  lang,
  items,
  canEdit,
  onMakeInactive,
}: {
  lang: ProtoLang;
  items: ProtoProduct[];
  canEdit: boolean;
  onMakeInactive: (id: string) => void;
}) => {
  const p = protoProductsCopy[lang];
  const value = (item: ProtoProduct) => ({
    condition: p.conditions[item.condition],
    direction: p.directions[item.direction],
    unit: p.units[item.unit],
    format: item.format[lang],
    status: item.active ? p.statusActive : p.statusInactive,
  });

  return (
    <>
      <div
        className="hidden min-w-0 overflow-x-auto rounded-lg border border-border bg-card md:block"
        data-testid="proto-products-table"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">{p.fields.product}</TableHead>
              <TableHead className="text-xs">{p.fields.condition}</TableHead>
              <TableHead className="text-xs">{p.fields.direction}</TableHead>
              <TableHead className="text-right text-xs">{p.fields.monthlyVolume}</TableHead>
              <TableHead className="text-xs">{p.fields.unit}</TableHead>
              <TableHead className="text-xs">{p.fields.format}</TableHead>
              <TableHead className="text-xs">{p.fields.status}</TableHead>
              {canEdit ? <TableHead className="text-xs" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const v = value(item);
              return (
                <TableRow key={item.id} className="h-12" data-testid={`proto-product-row-${item.id}`}>
                  <TableCell className="align-top">
                    <span className="font-medium">{item.product[lang]}</span>
                    <span className="block text-xs italic text-muted-foreground">{item.latin}</span>
                  </TableCell>
                  <TableCell className="align-top text-sm">{v.condition}</TableCell>
                  <TableCell className="align-top text-sm">{v.direction}</TableCell>
                  <TableCell className="align-top text-right text-sm tabular-nums">
                    {item.monthlyVolume}
                  </TableCell>
                  <TableCell className="align-top text-sm">{v.unit}</TableCell>
                  <TableCell className="align-top text-sm">{v.format}</TableCell>
                  <TableCell className="align-top text-sm" data-testid={`proto-product-status-${item.id}`}>
                    {v.status}
                  </TableCell>
                  {canEdit ? (
                    <TableCell className="align-top">
                      {item.active ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className={CONTROL}
                              data-testid={`proto-product-inactive-${item.id}`}
                            >
                              {p.makeInactive}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-testid="proto-product-inactive-dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{p.makeInactiveTitle}</AlertDialogTitle>
                              <AlertDialogDescription>{p.makeInactiveBody}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className={CONTROL}>{p.cancel}</AlertDialogCancel>
                              <AlertDialogAction
                                className={CONTROL}
                                onClick={() => onMakeInactive(item.id)}
                                data-testid="proto-product-inactive-confirm"
                              >
                                {p.makeInactiveConfirm}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-2 md:hidden" data-testid="proto-products-cards">
        {items.map((item) => {
          const v = value(item);
          return (
            <li key={item.id} className="min-w-0 rounded-lg border border-border bg-card p-3">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <p className="min-w-0 break-words font-medium">{item.product[lang]}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{v.status}</span>
              </div>
              <p className="text-xs italic text-muted-foreground">{item.latin}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {[
                  [p.fields.condition, v.condition],
                  [p.fields.direction, v.direction],
                  [p.fields.monthlyVolume, item.monthlyVolume],
                  [p.fields.unit, v.unit],
                  [p.fields.format, v.format],
                ].map(([label, val]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[10.5px] uppercase text-muted-foreground">{label}</dt>
                    <dd className="min-w-0 break-words text-sm">{val}</dd>
                  </div>
                ))}
              </dl>
              {canEdit && item.active ? (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className={CONTROL}
                        data-testid={`proto-product-inactive-mobile-${item.id}`}
                      >
                        {p.makeInactive}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{p.makeInactiveTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{p.makeInactiveBody}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className={CONTROL}>{p.cancel}</AlertDialogCancel>
                        <AlertDialogAction className={CONTROL} onClick={() => onMakeInactive(item.id)}>
                          {p.makeInactiveConfirm}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
};

const EditPreview = ({
  lang,
  item,
  onSave,
  onCancel,
}: {
  lang: ProtoLang;
  item: ProtoProduct;
  onSave: (next: ProtoProduct) => void;
  onCancel: () => void;
}) => {
  const p = protoProductsCopy[lang];
  const [draft, setDraft] = useState<ProtoProduct>(item);

  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-4" data-testid="proto-products-edit">
      <h3 className="font-heading text-base font-semibold">{p.editPreviewTitle}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{p.editPreviewHint}</p>
      <ProductsOzNote lang={lang} />

      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label className="text-[10.5px] uppercase text-muted-foreground" htmlFor="proto-product-name">
            {p.fields.product}
          </label>
          <Input
            id="proto-product-name"
            className={CONTROL}
            value={draft.product[lang]}
            onChange={(e) =>
              setDraft({ ...draft, product: { ...draft.product, [lang]: e.target.value } })
            }
            data-testid="proto-product-field-name"
          />
        </div>

        <div className="min-w-0">
          <label className="text-[10.5px] uppercase text-muted-foreground" htmlFor="proto-product-condition">
            {p.fields.condition}
          </label>
          <Select
            value={draft.condition}
            onValueChange={(v) => setDraft({ ...draft, condition: v as ProductConditionKey })}
          >
            <SelectTrigger id="proto-product-condition" className={CONTROL} data-testid="proto-product-field-condition">
              <SelectValue aria-label={p.fields.condition} />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CONDITIONS.map((key) => (
                <SelectItem key={key} value={key}>{p.conditions[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <label className="text-[10.5px] uppercase text-muted-foreground" htmlFor="proto-product-direction">
            {p.fields.direction}
          </label>
          <Select
            value={draft.direction}
            onValueChange={(v) => setDraft({ ...draft, direction: v as ProductDirectionKey })}
          >
            <SelectTrigger id="proto-product-direction" className={CONTROL} data-testid="proto-product-field-direction">
              <SelectValue aria-label={p.fields.direction} />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_DIRECTIONS.map((key) => (
                <SelectItem key={key} value={key}>{p.directions[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <label className="text-[10.5px] uppercase text-muted-foreground" htmlFor="proto-product-volume">
            {p.fields.monthlyVolume}
          </label>
          <Input
            id="proto-product-volume"
            className={CONTROL}
            value={draft.monthlyVolume}
            onChange={(e) => setDraft({ ...draft, monthlyVolume: e.target.value })}
            data-testid="proto-product-field-volume"
          />
        </div>

        <div className="min-w-0">
          <label className="text-[10.5px] uppercase text-muted-foreground" htmlFor="proto-product-unit">
            {p.fields.unit}
          </label>
          <Select value={draft.unit} onValueChange={(v) => setDraft({ ...draft, unit: v as ProductUnitKey })}>
            <SelectTrigger id="proto-product-unit" className={CONTROL} data-testid="proto-product-field-unit">
              <SelectValue aria-label={p.fields.unit} />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_UNITS.map((key) => (
                <SelectItem key={key} value={key}>{p.units[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <label className="text-[10.5px] uppercase text-muted-foreground" htmlFor="proto-product-format">
            {p.fields.format}
          </label>
          <Input
            id="proto-product-format"
            className={CONTROL}
            value={draft.format[lang]}
            onChange={(e) =>
              setDraft({ ...draft, format: { ...draft.format, [lang]: e.target.value } })
            }
            data-testid="proto-product-field-format"
          />
        </div>

        <div className="min-w-0">
          <span className="block text-[10.5px] uppercase text-muted-foreground">{p.fields.status}</span>
          <span className="text-sm" data-testid="proto-product-field-status">
            {draft.active ? p.statusActive : p.statusInactive}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
        <Button className={CONTROL} onClick={() => onSave(draft)} data-testid="proto-products-save">
          {p.save}
        </Button>
        <Button variant="outline" className={CONTROL} onClick={onCancel} data-testid="proto-products-cancel">
          {p.cancel}
        </Button>
      </div>
    </div>
  );
};

export const ProductsSection = ({
  lang,
  canEdit,
  editing,
  onCloseEdit,
  showEmpty = false,
}: {
  lang: ProtoLang;
  canEdit: boolean;
  editing: boolean;
  onCloseEdit: () => void;
  showEmpty?: boolean;
}) => {
  const p = protoProductsCopy[lang];
  const [items, setItems] = useState<ProtoProduct[]>(PROTO_PRODUCTS);
  const [saved, setSaved] = useState(false);
  const [inactiveDone, setInactiveDone] = useState(false);

  const visible = useMemo(() => (showEmpty ? [] : items), [items, showEmpty]);
  const editable = items[0];

  if (visible.length === 0 && !editing) {
    return (
      <div className="min-w-0 rounded-lg border border-border bg-muted/40 p-4" data-testid="proto-products-empty">
        <h3 className="font-heading text-base font-semibold">{p.emptyTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{p.emptyBody}</p>
        <ProductsOzNote lang={lang} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {saved || inactiveDone ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-3"
          role="status"
          data-testid="proto-products-status"
        >
          <Check aria-hidden className="mt-0.5 h-4 w-4 text-success" />
          <p className="text-sm">{inactiveDone ? p.inactiveDone : p.editPreviewHint}</p>
        </div>
      ) : null}

      {editing && canEdit ? (
        <EditPreview
          lang={lang}
          item={editable}
          onSave={(next) => {
            setItems((prev) => prev.map((it) => (it.id === next.id ? next : it)));
            setSaved(true);
            setInactiveDone(false);
            onCloseEdit();
          }}
          onCancel={onCloseEdit}
        />
      ) : (
        <>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground" data-testid="proto-products-count">
              {p.listCount}: {visible.length}
            </p>
            <ProductsOzNote lang={lang} />
          </div>
          <ProductsList
            lang={lang}
            items={visible}
            canEdit={canEdit}
            onMakeInactive={(id) => {
              setItems((prev) => prev.map((it) => (it.id === id ? { ...it, active: false } : it)));
              setInactiveDone(true);
              setSaved(false);
            }}
          />
        </>
      )}
    </div>
  );
};
