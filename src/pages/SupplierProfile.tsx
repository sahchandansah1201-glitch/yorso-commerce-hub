import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  Copy,
  Calendar,
  MapPin,
  Globe,
  MessageCircle,
  ShieldCheck,
  Award,
  Package,
  Factory,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { mockSuppliers, countryCodeToFlag, type MockSupplier } from "@/data/mockSuppliers";
import { mockOffers } from "@/data/mockOffers";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import CatalogOfferRow from "@/components/catalog/CatalogOfferRow";
import MobileOfferCard from "@/components/catalog/MobileOfferCard";

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  } else {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  }
};

/** Компактный блок «Страны доставки» (используется в рельсе и в досье). */
const DeliveryCountriesBlock = ({ supplier }: { supplier: MockSupplier }) => {
  const preview = supplier.deliveryCountries.slice(0, 15);
  const remaining = Math.max(supplier.deliveryCountriesTotal - preview.length, 0);
  return (
    <div>
      <ul className="grid grid-cols-5 gap-2">
        {preview.map((c) => (
          <li
            key={c.code}
            className="flex h-8 items-center justify-center rounded border border-border bg-background text-lg"
            title={c.name}
            aria-label={c.name}
          >
            <span aria-hidden>{countryCodeToFlag(c.code)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Доставка в {supplier.deliveryCountriesTotal} стран
        {remaining > 0 && <> · показано {preview.length}, ещё {remaining}</>}
      </p>
    </div>
  );
};

/** Сертификаты с местом под логотип (плейсхолдер-плита, пока нет файлов). */
const CertificationsBlock = ({
  supplier,
  size = "sm",
}: {
  supplier: MockSupplier;
  size?: "sm" | "lg";
}) => {
  const isLg = size === "lg";
  return (
    <ul className={isLg ? "grid grid-cols-2 gap-3 sm:grid-cols-3" : "grid grid-cols-3 gap-2"}>
      {supplier.certificationBadges.map((b) => (
        <li
          key={b.code}
          className="flex flex-col items-center justify-center rounded-md border border-border bg-background p-2 text-center"
          title={b.label}
        >
          <div
            className={
              isLg
                ? "flex h-12 w-12 items-center justify-center rounded bg-cool-gray/60 text-primary"
                : "flex h-8 w-8 items-center justify-center rounded bg-cool-gray/60 text-primary"
            }
            aria-hidden
          >
            <Award className={isLg ? "h-6 w-6" : "h-4 w-4"} />
          </div>
          <span
            className={
              isLg
                ? "mt-2 text-xs font-semibold leading-tight text-foreground"
                : "mt-1 text-[11px] font-semibold leading-tight text-foreground"
            }
          >
            {b.label}
          </span>
        </li>
      ))}
    </ul>
  );
};

/** Карточка «Основания надёжности». estimate-метки обязательны. */
const TrustFactsBlock = ({ supplier }: { supplier: MockSupplier }) => {
  const responseLabel =
    supplier.responseSignal === "fast"
      ? "до 4 ч"
      : supplier.responseSignal === "normal"
      ? "до 24 ч"
      : "более 24 ч";
  const docsLabel =
    supplier.documentReadiness === "ready"
      ? "готовы"
      : supplier.documentReadiness === "partial"
      ? "частично"
      : "по запросу";

  const facts: Array<{ label: string; value: string; estimate?: boolean }> = [
    { label: "Тип", value: supplierTypeLabel(supplier.supplierType) },
    { label: "Лет на рынке", value: String(supplier.yearsInBusiness) },
    { label: "Активные офферы", value: String(supplier.activeOffersCount) },
    { label: "Документы", value: docsLabel },
    { label: "Скорость ответа", value: responseLabel, estimate: true },
    {
      label: "Повторные сделки",
      value: "около 60%",
      estimate: true,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
      {facts.map((f) => (
        <div key={f.label}>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {f.label}
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {f.value}
            {f.estimate && (
              <span className="ml-1 align-middle text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                est.
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
};

const supplierTypeLabel = (t: MockSupplier["supplierType"]) => {
  switch (t) {
    case "producer":
      return "Производитель";
    case "processor":
      return "Переработчик";
    case "exporter":
      return "Экспортёр";
    case "distributor":
      return "Дистрибьютор";
    case "trader":
      return "Трейдер";
    default:
      return t;
  }
};

const SupplierProfile = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const supplier = useMemo<MockSupplier | undefined>(
    () => mockSuppliers.find((s) => s.id === supplierId),
    [supplierId],
  );

  const supplierOffers = useMemo(() => {
    if (!supplier) return [];
    const idx = mockSuppliers.findIndex((s) => s.id === supplier.id);
    const start = (idx * 2) % Math.max(mockOffers.length - 2, 1);
    return mockOffers.slice(start, start + 2);
  }, [supplier]);

  useEffect(() => {
    if (!supplier || typeof document === "undefined") return;
    const prev = document.title;
    document.title = `${supplier.companyName} · YORSO`;
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: supplier.shortDescription,
    });
    return () => {
      document.title = prev;
    };
  }, [supplier]);

  if (!supplier) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-16">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Поставщик не найден
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Возможно, ссылка устарела. Вернитесь в{" "}
            <Link to="/suppliers" className="text-primary underline">
              каталог поставщиков
            </Link>
            .
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Smart-ссылка скопирована" });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="border-b border-border bg-background">
          <div className="container py-3">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link to="/" className="hover:text-foreground">
                Главная
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <Link to="/suppliers" className="hover:text-foreground">
                Поставщики
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="font-medium text-foreground">{supplier.companyName}</span>
            </nav>
          </div>
        </div>

        {/* Hero cover */}
        <section className="relative">
          <div
            className="h-44 w-full bg-cover bg-center md:h-56"
            style={{
              backgroundImage: `linear-gradient(180deg, hsl(var(--foreground) / 0.25), hsl(var(--foreground) / 0.05)), url(${supplier.heroImage})`,
            }}
            aria-hidden
          />
        </section>

        {/* Identity (упрощённый: без длинного about, без aside-сертификатов) */}
        <section className="bg-background">
          <div className="container -mt-16 pb-6">
            <div className="max-w-3xl">
              {/* Logo plate */}
              <div className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-4 shadow-sm">
                <div className="flex h-16 w-56 items-center justify-center text-center">
                  <span className="font-heading text-base font-bold tracking-tight text-foreground">
                    {supplier.companyName}
                  </span>
                </div>
              </div>

              <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {supplier.companyName}
              </h1>

              {/* Procurement-строка доверия (3 факта в линию) */}
              <p className="mt-2 text-sm text-foreground/80">
                {supplierTypeLabel(supplier.supplierType)} ·{" "}
                {supplier.yearsInBusiness} лет на рынке ·{" "}
                {supplier.activeOffersCount} активных офферов
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8 gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Копировать smart-link
                </Button>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-foreground">
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>В бизнесе с {supplier.inBusinessSinceYear}</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span>
                    {supplier.country}, {supplier.city}{" "}
                    <span aria-hidden>{countryCodeToFlag(supplier.countryCode)}</span>
                  </span>
                </li>
                {supplier.website && (
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {supplier.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>

              {/* Короткое описание — детальный about ушёл в таб «О поставщике» */}
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/80">
                {supplier.shortDescription}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() =>
                    toast({
                      title: "Сообщение поставщику",
                      description: "Запрос подготовлен. Менеджер свяжется с вами.",
                    })
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                  ОТПРАВИТЬ СООБЩЕНИЕ
                </Button>
                {supplier.whatsapp && (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="gap-2 border-primary text-primary hover:bg-primary/5"
                    asChild
                  >
                    <a
                      href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="border-t border-border bg-background">
          <div className="container py-6">
            <Tabs defaultValue="catalog" className="w-full">
              <TabsList className="h-auto rounded-full bg-cool-gray/60 p-1">
                <TabsTrigger
                  value="catalog"
                  className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
                >
                  Каталог ({supplierOffers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
                >
                  О поставщике
                </TabsTrigger>
                <TabsTrigger
                  value="video"
                  className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
                >
                  Видео
                </TabsTrigger>
              </TabsList>

              {/* === Каталог: слева офферы, справа sticky-рельс доверия === */}
              <TabsContent value="catalog" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
                  <div className="space-y-4">
                    {supplierOffers.map((offer) => (
                      <div key={offer.id}>
                        <div className="sm:hidden">
                          <MobileOfferCard
                            offer={offer}
                            isSelected={false}
                            onSelect={() => {}}
                          />
                        </div>
                        <div className="hidden sm:block">
                          <CatalogOfferRow
                            offer={offer}
                            isSelected={false}
                            onSelect={() => {}}
                          />
                        </div>
                      </div>
                    ))}
                    {supplierOffers.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                        Каталог пока не опубликован.
                      </p>
                    )}
                  </div>

                  {/* Sticky-рельс доверия */}
                  <aside className="space-y-4 lg:sticky lg:top-24">
                    <div className="rounded-xl border border-border bg-cool-gray/40 p-5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                        <h2 className="font-heading text-sm font-semibold text-foreground">
                          Основания надёжности
                        </h2>
                      </div>
                      <div className="mt-3">
                        <TrustFactsBlock supplier={supplier} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-cool-gray/40 p-5">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" aria-hidden />
                        <h2 className="font-heading text-sm font-semibold text-foreground">
                          Сертификаты
                        </h2>
                      </div>
                      <div className="mt-3">
                        <CertificationsBlock supplier={supplier} size="sm" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-cool-gray/40 p-5">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" aria-hidden />
                        <h2 className="font-heading text-sm font-semibold text-foreground">
                          Страны доставки
                        </h2>
                      </div>
                      <div className="mt-3">
                        <DeliveryCountriesBlock supplier={supplier} />
                      </div>
                    </div>
                  </aside>
                </div>
              </TabsContent>

              {/* === О поставщике: 3 колонки (досье) === */}
              <TabsContent value="about" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Левая колонка 2/3 */}
                  <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        О компании
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                        {supplier.about}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          Продуктовый фокус
                        </h3>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
                        {supplier.productFocus.map((p) => (
                          <li key={p.species}>
                            <span className="font-medium text-foreground">
                              {p.species}
                            </span>{" "}
                            — {p.forms}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          Производственные возможности
                        </h3>
                      </div>
                      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Активные офферы
                          </dt>
                          <dd className="mt-0.5 font-medium text-foreground">
                            {supplier.activeOffersCount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Каталог продукции
                          </dt>
                          <dd className="mt-0.5 font-medium text-foreground">
                            {supplier.totalProductsCount} позиций
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            География поставок
                          </dt>
                          <dd className="mt-0.5 font-medium text-foreground">
                            {supplier.deliveryCountriesTotal} стран
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Документная готовность
                          </dt>
                          <dd className="mt-0.5 font-medium text-foreground">
                            {supplier.documentReadiness === "ready"
                              ? "Готовы"
                              : supplier.documentReadiness === "partial"
                              ? "Частично"
                              : "По запросу"}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-[11px] text-muted-foreground">
                        Часть показателей — оценочные (estimate), уточняются при запросе доступа.
                      </p>
                    </div>
                  </div>

                  {/* Правая колонка — досье доверия */}
                  <aside className="space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          Основания надёжности
                        </h3>
                      </div>
                      <div className="mt-3">
                        <TrustFactsBlock supplier={supplier} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          Сертификаты
                        </h3>
                      </div>
                      <div className="mt-3">
                        <CertificationsBlock supplier={supplier} size="lg" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" aria-hidden />
                        <h3 className="font-heading text-base font-semibold text-foreground">
                          География поставок
                        </h3>
                      </div>
                      <div className="mt-3">
                        <DeliveryCountriesBlock supplier={supplier} />
                      </div>
                    </div>
                  </aside>
                </div>
              </TabsContent>

              <TabsContent value="video" className="mt-6">
                <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
                  Видео будет добавлено поставщиком
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SupplierProfile;
