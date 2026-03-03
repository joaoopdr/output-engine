import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings } from "lucide-react";

export interface TimePrefs {
  eod: string;
  tonight: string;
  tomorrowMorning: string;
  endOfWeek: string;
  nextWeek: string;
}

const DEFAULTS: TimePrefs = {
  eod: "17:00",
  tonight: "20:00",
  tomorrowMorning: "09:00",
  endOfWeek: "17:00",
  nextWeek: "09:00",
};

const STORAGE_KEY = "time-preferences";

export function loadTimePrefs(): TimePrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULTS };
}

function saveTimePrefs(prefs: TimePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

const fields: { key: keyof TimePrefs; label: string }[] = [
  { key: "eod", label: '"By today" / "EOD" means' },
  { key: "tonight", label: '"Tonight" means' },
  { key: "tomorrowMorning", label: '"Tomorrow morning" means' },
  { key: "endOfWeek", label: '"End of week" / "by Friday" means' },
  { key: "nextWeek", label: '"Next week" means' },
];

export function TimePreferences({ onChange }: { onChange: (prefs: TimePrefs) => void }) {
  const [prefs, setPrefs] = useState<TimePrefs>(loadTimePrefs);

  useEffect(() => {
    onChange(prefs);
  }, [prefs, onChange]);

  const update = (key: keyof TimePrefs, value: string) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    saveTimePrefs(next);
  };

  const reset = () => {
    setPrefs({ ...DEFAULTS });
    saveTimePrefs(DEFAULTS);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-8 w-8 flex items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          title="Time preferences"
        >
          <Settings className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-3" align="start" sideOffset={6}>
        <p className="text-[11px] font-medium text-foreground">How your team talks about time</p>
        <div className="space-y-2">
          {fields.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <label className="text-[11px] text-muted-foreground leading-tight flex-1">{label}</label>
              <input
                type="time"
                value={prefs[key]}
                onChange={e => update(key, e.target.value)}
                className="text-[11px] h-7 w-[90px] rounded-md border border-input bg-transparent px-2 text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          ))}
        </div>
        <button
          onClick={reset}
          className="text-[10px] text-primary hover:underline"
        >
          Reset to defaults
        </button>
      </PopoverContent>
    </Popover>
  );
}
