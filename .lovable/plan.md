# Консультация: подписи и пояснения Incoterms 2020 в условиях поставки

Это консультация, не реализация. Файлы, данные и настройки не менялись. Локальный стенд я не открывал; текущее состояние взято из вашего описания.

## 1. Оценка предложения
Схема в целом верная: в списке показываются код и короткое название, сохраняется только код, под полем всегда видно пояснение. Общие компоненты не меняются. Минимальные корректировки:
1. **Пояснение не связано с выбором из списка.** `aria-describedby` поставить на trigger; id вида `incoterm-hint-${deliveryId}`, где deliveryId — стабильный id условия, а не индекс строки. Пока ничего не выбрано, пояснение не выводить, а не показывать подсказку «по умолчанию».
2. **Обновление пояснения не озвучивать.** После выбора `aria-live` на пояснении не нужен: фокус возвращается на trigger, и читалка заново прочитает описание. Если ставить live-регион, текст будет звучать дважды.
3. **Длинные названия.** Trigger: `h-auto min-h-11 py-2`, текст `whitespace-normal break-words text-left`, стрелка `shrink-0 self-center`. В меню пункт `whitespace-normal py-2`, ширина меню `min(var(--radix-select-trigger-width), calc(100vw-32px))`. Код в пункте не переносить: «EXW —» держать `whitespace-nowrap`, переносить можно только название.
4. **Пометка «только морской транспорт»** — не в отдельной строке и не значком: короткой фразой в начале пояснения для FAS, FOB, CFR, CIF. В самом меню пометку не дублировать, чтобы не удлинять 11 пунктов.
5. **Фильтр.** Те же короткие подписи, без пояснения под полем (это не форма ввода). Значение фильтра — код.
6. **Старые значения.** Если в данных встречается код не из списка 11, в поле показывать сам код с подписью «Не входит в Incoterms 2020 — выберите условие». Значение не менять автоматически.
7. **Порядок пунктов** — официальный порядок ICC: сначала 7 универсальных, затем 4 морских. Между группами можно поставить надписи групп «Любой транспорт» / «Морской и речной транспорт», если CrmSelect уже поддерживает группы; если не поддерживает, группы не добавлять.

## 2. Тексты (RU / EN / ES)

| Код | RU коротко | EN short | ES corto |
|---|---|---|---|
| EXW | Самовывоз со склада | Ex Works | En fábrica |
| FCA | Передача перевозчику | Free Carrier | Franco transportista |
| CPT | Перевозка оплачена до | Carriage Paid To | Transporte pagado hasta |
| CIP | Перевозка и страхование до | Carriage and Insurance Paid To | Transporte y seguro pagados hasta |
| DAP | Поставка в месте назначения | Delivered at Place | Entregado en lugar |
| DPU | Поставка с разгрузкой | Delivered at Place Unloaded | Entregado en lugar descargado |
| DDP | Поставка с оплатой пошлин | Delivered Duty Paid | Entregado con derechos pagados |
| FAS | Вдоль борта судна | Free Alongside Ship | Franco al costado del buque |
| FOB | Франко борт | Free On Board | Franco a bordo |
| CFR | Стоимость и фрахт | Cost and Freight | Coste y flete |
| CIF | Стоимость, страхование и фрахт | Cost, Insurance and Freight | Coste, seguro y flete |

Пояснения под полем (RU):
- EXW — Покупатель забирает товар на складе продавца и оплачивает всю перевозку. Риск переходит на складе продавца.
- FCA — Продавец передаёт товар перевозчику покупателя в указанном месте. С этого момента риск и перевозка — на покупателе.
- CPT — Продавец оплачивает перевозку до места назначения. Риск переходит при передаче первому перевозчику.
- CIP — Как CPT, плюс продавец страхует груз по расширенному покрытию. Риск переходит при передаче первому перевозчику.
- DAP — Продавец доставляет товар до места назначения, не разгружая его. Разгрузка и импортные пошлины — на покупателе.
- DPU — Продавец доставляет и разгружает товар в месте назначения. Риск переходит после разгрузки.
- DDP — Продавец доставляет товар и оплачивает импортные пошлины и сборы. Риск переходит в месте назначения.
- FAS — Только морской и речной транспорт. Товар у борта судна в порту отгрузки; дальше риск и фрахт — на покупателе.
- FOB — Только морской и речной транспорт. Риск переходит, когда товар погружен на борт в порту отгрузки; фрахт оплачивает покупатель.
- CFR — Только морской и речной транспорт. Продавец оплачивает фрахт до порта назначения, но риск переходит при погрузке на борт.
- CIF — Только морской и речной транспорт. Как CFR, плюс продавец страхует груз по минимальному покрытию.

Пояснения EN:
- EXW — The buyer collects the goods at the seller's premises and pays all carriage. Risk passes there.
- FCA — The seller hands the goods to the buyer's carrier at the named place. Risk and carriage then pass to the buyer.
- CPT — The seller pays carriage to the destination. Risk passes when the goods are handed to the first carrier.
- CIP — As CPT, and the seller insures the cargo with broad cover. Risk passes at the first carrier.
- DAP — The seller delivers to the destination, not unloaded. Unloading and import duties are the buyer's.
- DPU — The seller delivers and unloads at the destination. Risk passes after unloading.
- DDP — The seller delivers and pays import duties and taxes. Risk passes at the destination.
- FAS — Sea and inland waterway only. Goods alongside the ship at the loading port; then risk and freight are the buyer's.
- FOB — Sea and inland waterway only. Risk passes once the goods are on board at the loading port; the buyer pays freight.
- CFR — Sea and inland waterway only. The seller pays freight to the destination port; risk passes on loading.
- CIF — Sea and inland waterway only. As CFR, and the seller insures the cargo with minimum cover.

Пояснения ES:
- EXW — El comprador recoge la mercancía en las instalaciones del vendedor y paga todo el transporte. El riesgo se transmite allí.
- FCA — El vendedor entrega la mercancía al transportista del comprador en el lugar acordado. Desde ahí, riesgo y transporte son del comprador.
- CPT — El vendedor paga el transporte hasta destino. El riesgo se transmite al entregar al primer transportista.
- CIP — Como CPT, y el vendedor asegura la carga con cobertura amplia. El riesgo se transmite al primer transportista.
- DAP — El vendedor entrega en destino sin descargar. La descarga y los derechos de importación son del comprador.
- DPU — El vendedor entrega y descarga en destino. El riesgo se transmite tras la descarga.
- DDP — El vendedor entrega y paga los derechos e impuestos de importación. El riesgo se transmite en destino.
- FAS — Solo transporte marítimo y fluvial. Mercancía al costado del buque en el puerto de carga; después, riesgo y flete son del comprador.
- FOB — Solo transporte marítimo y fluvial. El riesgo se transmite al cargar a bordo en el puerto de origen; el flete lo paga el comprador.
- CFR — Solo transporte marítimo y fluvial. El vendedor paga el flete hasta el puerto de destino; el riesgo se transmite al cargar.
- CIF — Solo transporte marítimo y fluvial. Como CFR, y el vendedor asegura la carga con cobertura mínima.

Подпись поля: «Условие поставки» / “Delivery term” / “Condición de entrega”. Пустое значение: «Выберите условие» / “Select a term” / “Seleccione una condición”. Тексты стоит проверить носителю языка и специалисту по ВЭД перед публикацией; это краткие пояснения, а не юридическая формулировка ICC.

## 3. Эргономика
- **Desktop**: самое длинное название (CIP, RU) помещается в trigger шириной ≥ 280px в одну строку; при более узкой колонке переносится на 2 строки, высота trigger растёт до ~60px. Соседние поля в той же строке выравнивать по верху (`items-start`), чтобы не плясала сетка.
- **390px**: поле на всю ширину; пояснение 2–3 строки `text-xs text-muted-foreground`, отступ сверху 4px. Меню не шире экрана, 11 пунктов прокручиваются, высота пункта ≥ 44px.
- **Клавиатура**: Radix Select уже поддерживает стрелки и ввод с клавиатуры. Поиск по вводу сработает по первым буквам подписи — так как подпись начинается с кода, ввод «F», «O» ведёт к FOB. Это довод за порядок «код — название».
- **Контраст**: пояснение `muted-foreground` на светлом фоне должно давать ≥ 4.5:1; голубая подсветка пункта с navy текстом — проверить отдельно для выбранного и для подсвеченного пункта.

## 4. Проверяемые критерии
1. Сохраняется только код; после перезагрузки подпись и пояснение восстанавливаются из кода.
2. У каждого условия поставки свой id пояснения; дублирующихся id на странице нет.
3. Читалка на trigger произносит подпись поля, значение и пояснение один раз.
4. На 390 и 360px нет горизонтальной прокрутки, текст trigger и пунктов меню не обрезается.
5. Для FAS/FOB/CFR/CIF пояснение начинается с «Только морской и речной транспорт».
6. Смена Incoterms не меняет цену, валюту и место автоматически.
7. В фильтре те же подписи, значения фильтра совпадают с сохранёнными кодами.
8. Неизвестный старый код отображается как есть и не заменяется.

## 5. Решения владельца
- Показывать ли группы «Любой транспорт / Морской и речной».
- Кто утверждает тексты пояснений (специалист по ВЭД, носители ES).

## Статус

| План | Сделано | Осталось | Проверка |
|---|---|---|---|
| Подписи 11 условий RU/EN/ES | Предложены | Вычитка носителями | Критерий 7 |
| Пояснения под полем | Предложены | Вычитка специалистом по ВЭД | Критерии 3, 5 |
| Доступность | Правила id и describedby | Реализация | Критерии 2, 3 |
| Desktop / 390px | Правила переноса | Реализация и проверка | Критерий 4 |
| Сохранение кода и старые значения | Правила | Реализация | Критерии 1, 6, 8 |
| Реализация | Не начата | Вся | Это консультация |

`roadmap.md` в режиме плана не менялся.
