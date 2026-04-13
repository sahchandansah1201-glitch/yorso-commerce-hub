import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CountryEntry {
  name: string;
  code: string;
  flag: string;
  mask?: string; // e.g. "### ### ####" where # is a digit placeholder
}

// Phone masks: # = digit, space/dash kept as-is
const PHONE_MASKS: Record<string, string> = {
  "+7":   "### ###-##-##",
  "+1":   "### ### ####",
  "+49":  "### #### ####",
  "+44":  "#### ### ####",
  "+33":  "# ## ## ## ##",
  "+39":  "### ### ####",
  "+34":  "### ## ## ##",
  "+81":  "##-####-####",
  "+86":  "### #### ####",
  "+91":  "##### #####",
  "+55":  "## #####-####",
  "+82":  "##-####-####",
  "+61":  "### ### ###",
  "+64":  "## ### ####",
  "+31":  "# #### ####",
  "+46":  "##-### ## ##",
  "+47":  "### ## ###",
  "+45":  "## ## ## ##",
  "+358": "## ### ## ##",
  "+48":  "### ### ###",
  "+351": "### ### ###",
  "+90":  "### ### ## ##",
  "+62":  "###-####-####",
  "+66":  "## ### ####",
  "+84":  "## ### ## ##",
  "+27":  "## ### ####",
  "+971": "## ### ####",
  "+966": "## ### ####",
  "+52":  "## #### ####",
  "+63":  "### ### ####",
  "+92":  "### #######",
  "+880": "####-######",
  "+20":  "## #### ####",
  "+212": "##-### ####",
  "+254": "### ######",
  "+54":  "## ####-####",
  "+994": "## ### ## ##",
  "+57":  "### ### ####",
  "+506": "####-####",
  "+593": "## ### ####",
  "+504": "####-####",
  "+354": "### ####",
  "+98":  "### ### ####",
  "+353": "## ### ####",
  "+972": "##-### ####",
  "+261": "## ## ### ##",
  "+222": "## ## ## ##",
  "+258": "## ### ####",
  "+95":  "# ### ####",
  "+264": "## ### ####",
  "+968": "## ### ###",
  "+507": "####-####",
  "+675": "### ####",
  "+51":  "### ### ###",
  "+94":  "## ### ####",
  "+886": "### ### ###",
  "+255": "### ### ###",
  "+56":  "# #### ####",
  "+30":  "### ### ####",
  "+221": "## ### ## ##",
  "+298": "### ###",
};

const COUNTRIES: CountryEntry[] = [
  { name: "Argentina", code: "+54", flag: "🇦🇷" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  { name: "Azerbaijan", code: "+994", flag: "🇦🇿" },
  { name: "Bangladesh", code: "+880", flag: "🇧🇩" },
  { name: "Brazil", code: "+55", flag: "🇧🇷" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "Chile", code: "+56", flag: "🇨🇱" },
  { name: "China", code: "+86", flag: "🇨🇳" },
  { name: "Colombia", code: "+57", flag: "🇨🇴" },
  { name: "Costa Rica", code: "+506", flag: "🇨🇷" },
  { name: "Denmark", code: "+45", flag: "🇩🇰" },
  { name: "Ecuador", code: "+593", flag: "🇪🇨" },
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "Faroe Islands", code: "+298", flag: "🇫🇴" },
  { name: "Finland", code: "+358", flag: "🇫🇮" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "Greece", code: "+30", flag: "🇬🇷" },
  { name: "Honduras", code: "+504", flag: "🇭🇳" },
  { name: "Iceland", code: "+354", flag: "🇮🇸" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "Indonesia", code: "+62", flag: "🇮🇩" },
  { name: "Iran", code: "+98", flag: "🇮🇷" },
  { name: "Ireland", code: "+353", flag: "🇮🇪" },
  { name: "Israel", code: "+972", flag: "🇮🇱" },
  { name: "Italy", code: "+39", flag: "🇮🇹" },
  { name: "Japan", code: "+81", flag: "🇯🇵" },
  { name: "Kenya", code: "+254", flag: "🇰🇪" },
  { name: "Madagascar", code: "+261", flag: "🇲🇬" },
  { name: "Mauritania", code: "+222", flag: "🇲🇷" },
  { name: "Mexico", code: "+52", flag: "🇲🇽" },
  { name: "Morocco", code: "+212", flag: "🇲🇦" },
  { name: "Mozambique", code: "+258", flag: "🇲🇿" },
  { name: "Myanmar", code: "+95", flag: "🇲🇲" },
  { name: "Namibia", code: "+264", flag: "🇳🇦" },
  { name: "Netherlands", code: "+31", flag: "🇳🇱" },
  { name: "New Zealand", code: "+64", flag: "🇳🇿" },
  { name: "Norway", code: "+47", flag: "🇳🇴" },
  { name: "Oman", code: "+968", flag: "🇴🇲" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "Panama", code: "+507", flag: "🇵🇦" },
  { name: "Papua New Guinea", code: "+675", flag: "🇵🇬" },
  { name: "Peru", code: "+51", flag: "🇵🇪" },
  { name: "Philippines", code: "+63", flag: "🇵🇭" },
  { name: "Poland", code: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "+351", flag: "🇵🇹" },
  { name: "Russia", code: "+7", flag: "🇷🇺" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "Senegal", code: "+221", flag: "🇸🇳" },
  { name: "South Africa", code: "+27", flag: "🇿🇦" },
  { name: "South Korea", code: "+82", flag: "🇰🇷" },
  { name: "Spain", code: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "+94", flag: "🇱🇰" },
  { name: "Sweden", code: "+46", flag: "🇸🇪" },
  { name: "Taiwan", code: "+886", flag: "🇹🇼" },
  { name: "Tanzania", code: "+255", flag: "🇹🇿" },
  { name: "Thailand", code: "+66", flag: "🇹🇭" },
  { name: "Turkey", code: "+90", flag: "🇹🇷" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "Vietnam", code: "+84", flag: "🇻🇳" },
];

function findByCode(code: string): CountryEntry | undefined {
  // Exact match first, then longest prefix
  const clean = code.replace(/\s/g, "");
  return COUNTRIES.find((c) => c.code === clean) ||
    COUNTRIES.filter((c) => clean.startsWith(c.code))
      .sort((a, b) => b.code.length - a.code.length)[0];
}

function findByCountryName(name: string): CountryEntry | undefined {
  return COUNTRIES.find((c) => c.name === name);
}

function getMask(code: string): string | undefined {
  return PHONE_MASKS[code];
}

function applyMask(raw: string, mask: string): string {
  const digits = raw.replace(/\D/g, "");
  let result = "";
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    if (mask[i] === "#") {
      result += digits[di++];
    } else {
      result += mask[i];
    }
  }
  return result;
}

function getPlaceholder(code: string): string {
  const mask = getMask(code);
  if (!mask) return "Номер телефона";
  return mask.replace(/#/g, "0");
}

function getMaxDigits(code: string): number {
  const mask = getMask(code);
  if (!mask) return 15;
  return (mask.match(/#/g) || []).length;
}

interface CountryPhoneInputProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onCountryChange?: (countryName: string) => void;
  countryName?: string;
  disabled?: boolean;
}

export default function CountryPhoneInput({
  phone,
  onPhoneChange,
  onCountryChange,
  countryName,
  disabled,
}: CountryPhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CountryEntry | null>(
    () => (countryName ? findByCountryName(countryName) : null) || null
  );
  const ref = useRef<HTMLDivElement>(null);

  // Sync with detected country
  useEffect(() => {
    if (countryName) {
      const entry = findByCountryName(countryName);
      if (entry && entry.name !== selected?.name) {
        setSelected(entry);
        if (!phone) onPhoneChange("");
      }
    }
  }, [countryName]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const currentCode = selected?.code || "";
  const mask = getMask(currentCode);
  const placeholder = getPlaceholder(currentCode);
  const maxDigits = getMaxDigits(currentCode);

  const handlePhoneInput = useCallback((rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, maxDigits);
    if (mask) {
      onPhoneChange(applyMask(digits, mask));
    } else {
      onPhoneChange(digits);
    }
  }, [mask, maxDigits, onPhoneChange]);

  const handleSelect = (entry: CountryEntry) => {
    setSelected(entry);
    setOpen(false);
    setSearch("");
    onPhoneChange("");
    onCountryChange?.(entry.name);
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-0">
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className="flex items-center gap-1.5 h-12 px-3 rounded-l-xl border border-r-0 border-input bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <span className="text-xl leading-none">{selected?.flag || "🌍"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Code display */}
        <div className="flex items-center h-12 px-2 border-y border-input bg-muted/30 text-sm font-medium text-foreground shrink-0 min-w-[52px] justify-center">
          {selected?.code || "+?"}
        </div>

        {/* Phone number input */}
        <Input
          type="tel"
          value={phone}
          onChange={(e) => handlePhoneInput(e.target.value)}
          placeholder={placeholder}
          className="h-12 text-base rounded-l-none rounded-r-xl border-l-0 flex-1"
          disabled={disabled}
        />
      </div>

      {/* Dropdown - fixed overlay on mobile for better UX */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => { setOpen(false); setSearch(""); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-input rounded-t-2xl shadow-2xl md:absolute md:bottom-auto md:top-full md:mt-1.5 md:rounded-xl md:border md:shadow-lg overflow-hidden"
              style={{ maxHeight: "70vh" }}
            >
              {/* Header with close on mobile */}
              <div className="flex items-center justify-between p-3 border-b border-input md:p-2">
                <div className="relative flex-1">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Страна или код"
                    className="h-10 text-sm rounded-lg pl-3 pr-9"
                    autoFocus
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setSearch(""); }}
                  className="ml-2 p-2 rounded-lg hover:bg-muted md:hidden"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* List */}
              <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 60px)" }}>
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Не найдено</p>
                )}
                {filtered.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`flex items-center gap-3 w-full px-4 py-3 md:py-2.5 text-left hover:bg-muted/60 transition-colors text-sm ${
                      selected?.name === c.name ? "bg-muted/40 font-medium" : ""
                    }`}
                  >
                    <span className="text-xl md:text-lg">{c.flag}</span>
                    <span className="text-muted-foreground font-mono w-14 md:w-12">{c.code}</span>
                    <span className="text-foreground">{c.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
