import { GitBranch, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { DesignFile } from "../model";
import type { HistoryState } from "../store";
import { replayLabels } from "./replay";

export function ReplayPanel({
  history,
  initialDesign,
  onBranch,
  onClose,
}: {
  history: HistoryState;
  initialDesign: DesignFile;
  onBranch: (step: number) => void;
  onClose: () => void;
}) {
  const labels = useMemo(() => replayLabels(history.past), [history.past]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(labels.length);

  useEffect(() => {
    setStep(labels.length);
  }, [labels.length]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    const interval = window.setInterval(() => {
      setStep((current) => {
        if (current >= labels.length) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 700 / speed);

    return () => window.clearInterval(interval);
  }, [labels.length, playing, speed]);

  const current = labels[step - 1];

  return (
    <aside className="absolute left-4 right-4 top-20 z-20 rounded border border-desk-line bg-white/95 shadow-panel sm:bottom-16 sm:left-4 sm:right-auto sm:top-auto sm:w-[320px]" data-testid="replay-panel">
      <div className="flex items-center justify-between border-b border-desk-line px-3 py-2">
        <h2 className="text-sm font-semibold">Replay</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-desk-muted">
            Step {step} / {labels.length}
          </span>
          <button aria-label="Close replay" className="flex size-7 items-center justify-center rounded hover:bg-slate-100" onClick={onClose} type="button">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="space-y-3 p-3">
        <input
          aria-label="Replay scrubber"
          className="w-full"
          max={labels.length}
          min={0}
          onChange={(event) => setStep(Number(event.target.value))}
          type="range"
          value={step}
        />
        <div className="grid grid-cols-4 gap-1">
          <button aria-label="Replay step back" className="flex size-8 items-center justify-center rounded bg-slate-100 hover:bg-slate-200" onClick={() => setStep((current) => Math.max(0, current - 1))} type="button">
            <SkipBack size={14} aria-hidden="true" />
          </button>
          <button aria-label={playing ? "Pause replay" : "Play replay"} className="flex size-8 items-center justify-center rounded bg-desk-ink text-white" onClick={() => setPlaying((current) => !current)} type="button">
            {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          </button>
          <button aria-label="Replay step forward" className="flex size-8 items-center justify-center rounded bg-slate-100 hover:bg-slate-200" onClick={() => setStep((current) => Math.min(labels.length, current + 1))} type="button">
            <SkipForward size={14} aria-hidden="true" />
          </button>
          <button aria-label="Branch from replay step" className="flex size-8 items-center justify-center rounded bg-slate-100 hover:bg-slate-200" onClick={() => onBranch(step)} type="button">
            <GitBranch size={14} aria-hidden="true" />
          </button>
        </div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-desk-muted">
          Speed
          <select
            aria-label="Replay speed"
            className="mt-1 w-full rounded border border-desk-line px-2 py-1.5 text-sm normal-case tracking-normal"
            onChange={(event) => setSpeed(Number(event.target.value))}
            value={speed}
          >
            {[0.5, 1, 2].map((value) => (
              <option key={value} value={value}>
                {value}x
              </option>
            ))}
          </select>
        </label>
        <div className="rounded border border-desk-line bg-slate-50 px-3 py-2 text-sm" data-testid="replay-current-step">
          {current ? `${current.index}. ${current.label} (${current.opCount} ops)` : "Start state"}
        </div>
        <div className="text-xs text-desk-muted">{initialDesign.name}</div>
      </div>
    </aside>
  );
}
