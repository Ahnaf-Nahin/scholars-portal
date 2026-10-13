import React, { useState, useMemo } from 'react';
import { PERIODIC_ELEMENTS, PeriodicElement, getElectronShells } from '../data/periodicElements';
import {
  REACTIMIX_IONS,
  VERIFIED_COMPOUNDS,
  SOLAR_SYSTEM_BODIES,
  HUMAN_BODY_SYSTEMS,
  VerifiedCompound
} from '../data/brainifyData';
import { usePlatform } from '../context/PlatformContext';
import { sound } from '../utils/sound';
import {
  Play,
  RotateCcw,
  Trash2,
  RotateCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Search,
  FlaskConical,
  Calculator,
  Atom,
  Plus,
  X,
  Info,
  BookOpen
} from 'lucide-react';

export const CATEGORY_COLOR_MAP: Record<PeriodicElement['category'], string> = {
  'Alkali Metal': 'border-red-500/50 bg-red-950/35 text-red-200',
  'Alkaline Earth Metal': 'border-orange-500/50 bg-orange-950/35 text-orange-200',
  'Transition Metal': 'border-cyan-500/45 bg-cyan-950/25 text-cyan-200',
  'Post-Transition Metal': 'border-emerald-500/45 bg-emerald-950/25 text-emerald-200',
  Metalloid: 'border-teal-400/50 bg-teal-950/30 text-teal-200',
  'Reactive Nonmetal': 'border-blue-500/50 bg-blue-950/35 text-blue-200',
  Halogen: 'border-indigo-400/50 bg-indigo-950/35 text-indigo-200',
  'Noble Gas': 'border-purple-500/50 bg-purple-950/35 text-purple-200',
  Lanthanide: 'border-pink-500/45 bg-pink-950/25 text-pink-200',
  Actinide: 'border-amber-500/45 bg-amber-950/25 text-amber-200'
};

export const ELEMENT_CATEGORIES = [
  'All',
  'Alkali Metal',
  'Alkaline Earth Metal',
  'Transition Metal',
  'Post-Transition Metal',
  'Metalloid',
  'Reactive Nonmetal',
  'Halogen',
  'Noble Gas',
  'Lanthanide',
  'Actinide'
];

// ============================================================================
// SHARED ELEMENT DETAIL INSPECTOR (ALL 19 STRUCTURED SCIENTIFIC FIELDS + BOHR SHELLS)
// ============================================================================
export const ElementDetailPanel: React.FC<{
  element: PeriodicElement;
  onAddToReactiMix?: (symbol: string) => void;
  isSelectedInReactiMix?: boolean;
}> = ({ element, onAddToReactiMix, isSelectedInReactiMix }) => {
  const shells = useMemo(
    () => getElectronShells(element.atomicNumber),
    [element.atomicNumber]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0B0D18] border border-purple-500/30 rounded-2xl p-6 shadow-xl">
      <div className="lg:col-span-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/25 to-cyan-500/20 border border-purple-400/50 flex flex-col items-center justify-center shrink-0">
              <span className="text-[11px] font-mono text-cyan-300">
                #{element.atomicNumber}
              </span>
              <span className="font-display text-2xl font-extrabold text-white">
                {element.symbol}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-2xl font-bold text-white">
                  {element.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-white/5 border border-white/10 text-purple-300">
                  {element.category}
                </span>
              </div>
              <div className="text-xs text-cyan-300 font-mono mt-1">
                Atomic Number: {element.atomicNumber} · Symbol: {element.symbol} · Atomic Mass: {element.atomicMass} u · State (RT): {element.state}
              </div>
            </div>
          </div>

          {onAddToReactiMix && (
            <button
              type="button"
              onClick={() => onAddToReactiMix(element.symbol)}
              className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelectedInReactiMix
                  ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200'
                  : 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-600/20'
              }`}
            >
              {isSelectedInReactiMix ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selected in Chamber ({element.symbol})</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {element.symbol} to Reaction Mixer</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 19-Point Structured Properties Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
            <span className="text-slate-400 block text-[11px]">Group / Period / Block</span>
            <span className="font-mono text-white font-semibold">
              G: {element.group} · P: {element.period} · {element.block}-block
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
            <span className="text-slate-400 block text-[11px]">Electron Configuration</span>
            <span className="font-mono text-cyan-300 font-semibold">
              {element.electronConfig}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
            <span className="text-slate-400 block text-[11px]">Valence Electrons</span>
            <span className="font-mono text-white font-semibold">
              {element.valenceElectrons}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
            <span className="text-slate-400 block text-[11px]">Common Oxidation States</span>
            <span className="font-mono text-purple-300 font-semibold">
              {element.oxidationStates}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
            <span className="text-slate-400 block text-[11px]">State at Room Temp</span>
            <span className="font-mono text-white font-semibold">
              {element.state}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
            <span className="text-slate-400 block text-[11px]">Melting Point</span>
            <span className="font-mono text-white">
              {element.meltingPointK}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
            <span className="text-slate-400 block text-[11px]">Boiling Point</span>
            <span className="font-mono text-white">
              {element.boilingPointK}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
            <span className="text-slate-400 block text-[11px]">Density &amp; Electronegativity</span>
            <span className="font-mono text-white">
              {element.density} · χ={element.electronegativity}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#070810] border border-white/10">
            <strong className="text-cyan-400 block mb-1">Common Uses &amp; Applications:</strong>
            <p className="text-slate-200 leading-relaxed">{element.uses}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#070810] border border-white/10">
            <strong className="text-purple-400 block mb-1">Discovery Information:</strong>
            <p className="text-slate-200 leading-relaxed">{element.discovery}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#070810] border border-white/10">
            <strong className="text-emerald-400 block mb-1">Interesting Scientific Fact:</strong>
            <p className="text-slate-200 leading-relaxed">{element.fact}</p>
          </div>
        </div>
      </div>

      {/* Bohr Electron Shell SVG Visualizer */}
      <div className="lg:col-span-4 bg-[#070810] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
        <div className="text-xs font-mono text-cyan-400 mb-2">
          BOHR ELECTRON SHELL DIAGRAM
        </div>
        <svg viewBox="0 0 220 220" className="w-44 h-44">
          <circle cx="110" cy="110" r="14" fill="#8B5CF6" />
          <text
            x="110"
            y="114"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            {element.symbol}
          </text>
          {shells.map((electronCount, sIdx) => {
            const radius = 28 + sIdx * 12;
            return (
              <g key={sIdx}>
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="rgba(139, 92, 246, 0.32)"
                  strokeWidth="1"
                />
                {Array.from({ length: electronCount }).map((_, eIdx) => {
                  const angle = (2 * Math.PI * eIdx) / electronCount - Math.PI / 2;
                  const ex = 110 + radius * Math.cos(angle);
                  const ey = 110 + radius * Math.sin(angle);
                  return (
                    <circle
                      key={eIdx}
                      cx={ex}
                      cy={ey}
                      r="2.6"
                      fill="#38BDF8"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
        <div className="text-[11px] font-mono text-slate-300 mt-1">
          Shells: [{shells.join(', ')}] · {shells.length} Occupied Shells
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 1. CIRCUIT MAKER MODULE
// ============================================================================
export type CircuitCompType =
  | 'Battery'
  | 'Resistor'
  | 'LED'
  | 'Switch'
  | 'Bulb'
  | 'Motor'
  | 'Buzzer'
  | 'Wire';

interface PlacedComponent {
  id: string;
  type: CircuitCompType;
  label: string;
  x: number;
  y: number;
  rotation: number;
  switchClosed?: boolean;
  valueLabel: string;
}

const DEFAULT_VALID_CIRCUIT: PlacedComponent[] = [
  { id: 'c-bat', type: 'Battery', label: '9V DC Battery', x: 0, y: 1, rotation: 0, valueLabel: '9.0 V' },
  { id: 'c-sw', type: 'Switch', label: 'SPST Switch', x: 1, y: 0, rotation: 0, switchClosed: true, valueLabel: 'CLOSED' },
  { id: 'c-res', type: 'Resistor', label: 'Current Resistor', x: 2, y: 0, rotation: 0, valueLabel: '220 Ω' },
  { id: 'c-led', type: 'LED', label: 'Cyan GaN LED', x: 3, y: 1, rotation: 90, valueLabel: 'Vf = 2.2V' },
  { id: 'c-wire1', type: 'Wire', label: 'Return Bus Wire', x: 2, y: 2, rotation: 0, valueLabel: '0 Ω' },
  { id: 'c-wire2', type: 'Wire', label: 'Ground Bus Wire', x: 1, y: 2, rotation: 0, valueLabel: '0 Ω' }
];

export const CircuitMakerModule: React.FC = () => {
  const { recordBrainifyInteraction, updateActivityProgress, showToast } = usePlatform();
  const [components, setComponents] = useState<PlacedComponent[]>(DEFAULT_VALID_CIRCUIT);
  const [selectedId, setSelectedId] = useState<string | null>('c-led');
  const [isRunning, setIsRunning] = useState<boolean>(true);

  const circuitAnalysis = useMemo(() => {
    const hasBattery = components.some((c) => c.type === 'Battery');
    const hasLoad = components.some((c) =>
      ['LED', 'Bulb', 'Motor', 'Buzzer'].includes(c.type)
    );
    const hasResistor = components.some((c) => c.type === 'Resistor');
    const openSwitches = components.filter(
      (c) => c.type === 'Switch' && c.switchClosed === false
    );
    const hasLED = components.some((c) => c.type === 'LED');

    if (!hasBattery) {
      return {
        valid: false,
        status: 'Open / Unpowered Circuit',
        explanation:
          'Missing voltage source: Add a Battery to provide electromotive force (EMF) to drive current around the loop.',
        currentMa: 0
      };
    }
    if (!hasLoad && !hasResistor) {
      return {
        valid: false,
        status: 'Short Circuit Warning',
        explanation:
          'Danger — Short Circuit! Connecting battery terminals with wires alone without a load or resistor causes excessive current and overheating.',
        currentMa: 0
      };
    }
    if (openSwitches.length > 0) {
      return {
        valid: false,
        status: 'Switch Open (Broken Loop)',
        explanation:
          'The circuit path is interrupted by an OPEN switch. Click the Switch to close the contacts so electrons can complete the closed loop.',
        currentMa: 0
      };
    }
    if (hasLED && !hasResistor && components.length < 4) {
      return {
        valid: false,
        status: 'LED Overcurrent Warning',
        explanation:
          'Connecting an LED directly across a 9V battery without a current-limiting series Resistor will exceed its maximum forward current rating.',
        currentMa: 0
      };
    }
    if (components.length < 3) {
      return {
        valid: false,
        status: 'Incomplete Loop',
        explanation:
          'A valid circuit requires a complete closed conductive path from the positive terminal through the load and back to the negative terminal.',
        currentMa: 0
      };
    }

    const totalResistance = hasResistor ? 220 + (hasLoad ? 50 : 0) : 120;
    const currentMa = Math.round((9 / totalResistance) * 1000 * 10) / 10;

    return {
      valid: true,
      status: 'Closed Loop Active · Current Flowing',
      explanation: `Valid closed series loop: 9.0 V source drives I = V / R = ${currentMa} mA through the connected components.`,
      currentMa
    };
  }, [components]);

  const activeFlow = isRunning && circuitAnalysis.valid;

  const handleAddComponent = (type: CircuitCompType) => {
    sound.playClick();
    let targetX = 0;
    let targetY = 0;
    outer: for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 5; x++) {
        if (!components.some((c) => c.x === x && c.y === y)) {
          targetX = x;
          targetY = y;
          break outer;
        }
      }
    }

    const defaults: Record<CircuitCompType, { label: string; val: string }> = {
      Battery: { label: '9V DC Battery', val: '9.0 V' },
      Resistor: { label: 'Series Resistor', val: '220 Ω' },
      LED: { label: 'Cyan GaN LED', val: 'Vf = 2.2V' },
      Switch: { label: 'SPST Switch', val: 'CLOSED' },
      Bulb: { label: 'Tungsten Filament Bulb', val: '6V / 1W' },
      Motor: { label: 'DC Brushless Motor', val: '1200 RPM' },
      Buzzer: { label: 'Piezo Audio Buzzer', val: '2.4 kHz' },
      Wire: { label: 'Copper Bus Wire', val: '0 Ω' }
    };

    const newComp: PlacedComponent = {
      id: `comp-${Date.now()}`,
      type,
      label: defaults[type].label,
      x: targetX,
      y: targetY,
      rotation: 0,
      switchClosed: true,
      valueLabel: defaults[type].val
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedId(newComp.id);
    recordBrainifyInteraction(15, 'Circuit Maker', 'First Spark (Completed First Circuit)');
    updateActivityProgress('circuit-maker', 20, 'add');
  };

  const selectedComp = components.find((c) => c.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Circuit Builder — DC Schematic &amp; Live Current Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Place components on the breadboard loop, toggle switches, rotate terminals, and run real-time Ohm&apos;s Law diagnostics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !isRunning;
              setIsRunning(next);
              updateActivityProgress('circuit-maker', 20, 'add');
              if (next) sound.playCircuitActivate();
              else sound.playClick();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
              isRunning
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-emerald-500 text-slate-950'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRunning ? 'Simulation Running (Click to Pause)' : 'Run Circuit'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setComponents(DEFAULT_VALID_CIRCUIT);
              setIsRunning(true);
              showToast('Loaded standard Battery → Switch → Resistor → LED loop.');
            }}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standard Loop</span>
          </button>
        </div>
      </div>

      {/* Component Palette */}
      <div className="bg-[#0B0D18] border border-purple-500/25 rounded-xl p-4">
        <div className="text-xs font-mono text-cyan-400 mb-2.5">
          ADD COMPONENT TO CIRCUIT BOARD:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            ['Battery', 'Resistor', 'LED', 'Switch', 'Bulb', 'Motor', 'Buzzer', 'Wire'] as CircuitCompType[]
          ).map((type) => (
            <button
              key={type}
              onClick={() => handleAddComponent(type)}
              className="px-3.5 py-2 rounded-lg bg-[#070810] hover:bg-purple-500/15 border border-white/10 hover:border-purple-400/50 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              + {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#070810] border border-purple-500/30 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-4">
            <span>SCHEMATIC LOOP CANVAS (CLICK ANY COMPONENT TO CONFIGURE)</span>
            <span className={activeFlow ? 'text-cyan-400 font-bold' : 'text-amber-400'}>
              {activeFlow ? `⚡ I = ${circuitAnalysis.currentMa} mA` : '○ I = 0.0 mA'}
            </span>
          </div>

          <div className="relative">
            <svg
              viewBox="0 0 600 260"
              className="w-full h-56 bg-[#0B0D18] rounded-lg border border-white/5 mb-4"
            >
              <rect
                x="60"
                y="35"
                width="480"
                height="190"
                rx="18"
                fill="none"
                stroke="#1E293B"
                strokeWidth="6"
              />
              {activeFlow && (
                <rect
                  x="60"
                  y="35"
                  width="480"
                  height="190"
                  rx="18"
                  fill="none"
                  stroke="#22D3EE"
                  strokeWidth="4"
                  className="animate-circuit-flow"
                />
              )}

              {components.map((comp, idx) => {
                const positions = [
                  { cx: 60, cy: 130 },
                  { cx: 210, cy: 35 },
                  { cx: 390, cy: 35 },
                  { cx: 540, cy: 130 },
                  { cx: 390, cy: 225 },
                  { cx: 210, cy: 225 }
                ];
                const pos = positions[idx % positions.length];
                const isSelected = comp.id === selectedId;
                const isLit =
                  activeFlow && (comp.type === 'LED' || comp.type === 'Bulb');
                return (
                  <g
                    key={comp.id}
                    transform={`translate(${pos.cx}, ${pos.cy})`}
                    onClick={() => setSelectedId(comp.id)}
                    className="cursor-pointer"
                  >
                    {isLit && (
                      <circle
                        r="34"
                        fill={comp.type === 'LED' ? 'rgba(34,211,238,0.28)' : 'rgba(250,204,21,0.3)'}
                      />
                    )}
                    <rect
                      x="-48"
                      y="-22"
                      width="96"
                      height="44"
                      rx="8"
                      fill="#111827"
                      stroke={isSelected ? '#A855F7' : isLit ? '#38BDF8' : '#475569'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <text
                      x="0"
                      y="-3"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {comp.type}
                    </text>
                    <text
                      x="0"
                      y="12"
                      textAnchor="middle"
                      fill={isLit ? '#22D3EE' : '#94A3B8'}
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {comp.type === 'Switch'
                        ? comp.switchClosed
                          ? 'CLOSED'
                          : 'OPEN'
                        : isLit
                        ? '★ ON / LIT'
                        : comp.valueLabel}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {components.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                    selectedId === c.id
                      ? 'bg-purple-950/40 border-purple-400 text-white'
                      : 'bg-[#0B0D18] border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white">{c.type}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {c.type === 'Switch'
                        ? c.switchClosed
                          ? '● Closed'
                          : '○ Open'
                        : `${c.valueLabel} · ${c.rotation}°`}
                    </div>
                  </div>
                  {activeFlow && ['LED', 'Bulb', 'Motor', 'Buzzer'].includes(c.type) && (
                    <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div
            className={`p-5 rounded-xl border ${
              activeFlow
                ? 'bg-emerald-950/25 border-emerald-500/40'
                : 'bg-amber-950/25 border-amber-500/40'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold mb-2">
              {activeFlow ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">{circuitAnalysis.status}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300">{circuitAnalysis.status}</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {circuitAnalysis.explanation}
            </p>
          </div>

          {selectedComp ? (
            <div className="bg-[#0B0D18] border border-white/10 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <div className="text-[11px] font-mono text-cyan-400">SELECTED COMPONENT</div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {selectedComp.label}
                  </h3>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {selectedComp.rotation}°
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedComp.type === 'Switch' && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      updateActivityProgress('circuit-maker', 20, 'add');
                      setComponents((prev) =>
                        prev.map((c) =>
                          c.id === selectedComp.id
                            ? { ...c, switchClosed: !c.switchClosed }
                            : c
                        )
                      );
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    Toggle Switch ({selectedComp.switchClosed ? 'Currently CLOSED' : 'Currently OPEN'})
                  </button>
                )}

                <button
                  onClick={() => {
                    sound.playClick();
                    updateActivityProgress('circuit-maker', 10, 'add');
                    setComponents((prev) =>
                      prev.map((c) =>
                        c.id === selectedComp.id
                          ? { ...c, rotation: (c.rotation + 90) % 360 }
                          : c
                      )
                    );
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate 90°</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setComponents((prev) => prev.filter((c) => c.id !== selectedComp.id));
                    setSelectedId(null);
                  }}
                  className="py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/35 border border-red-500/30 text-xs font-semibold text-red-300 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0B0D18] border border-white/10 rounded-xl p-5 text-xs text-slate-400">
              Click any component in the schematic to rotate, toggle switch state, or remove it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. INTERACTIVE 118-ELEMENT PERIODIC TABLE MODULE
// ============================================================================
export const PeriodicTableModule: React.FC = () => {
  const { recordBrainifyInteraction } = usePlatform();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedElement, setSelectedElement] = useState<PeriodicElement>(
    PERIODIC_ELEMENTS[0] // Hydrogen (1) default
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Interactive Periodic Table — All 118 Elements
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete IUPAC dataset from Hydrogen (1) to Oganesson (118) with full physical, atomic, and discovery properties
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, symbol, or Z (1–118)..."
            className="w-full bg-[#070810] border border-white/15 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {ELEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              categoryFilter === cat
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-[#0B0D18] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Detailed Element Inspector */}
      <ElementDetailPanel element={selectedElement} />

      {/* 18-Column Main Periodic Table Grid */}
      <div className="bg-[#070810] border border-white/10 rounded-2xl p-4 overflow-x-auto">
        <div
          className="grid gap-1.5 min-w-[1040px]"
          style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
        >
          {Array.from({ length: 10 }).map((_, rIdx) => {
            const rowNum = rIdx + 1;
            if (rowNum === 8) {
              return <div key="spacer-row" className="col-span-18 h-3" />;
            }
            return Array.from({ length: 18 }).map((__, cIdx) => {
              const colNum = cIdx + 1;
              const el = PERIODIC_ELEMENTS.find(
                (e) => e.row === rowNum && e.col === colNum
              );
              if (!el) {
                return <div key={`empty-${rowNum}-${colNum}`} className="h-14" />;
              }

              const matchesSearch =
                !search.trim() ||
                el.name.toLowerCase().includes(search.toLowerCase()) ||
                el.symbol.toLowerCase().includes(search.toLowerCase()) ||
                String(el.atomicNumber) === search.trim();
              const matchesCat =
                categoryFilter === 'All' || el.category === categoryFilter;
              const dimmed = !(matchesSearch && matchesCat);
              const isSelected = el.atomicNumber === selectedElement.atomicNumber;

              return (
                <button
                  key={el.atomicNumber}
                  onClick={() => {
                    sound.playClick();
                    setSelectedElement(el);
                    recordBrainifyInteraction(5, 'Periodic Table');
                  }}
                  className={`h-14 p-1 rounded-md border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    CATEGORY_COLOR_MAP[el.category]
                  } ${
                    isSelected
                      ? 'ring-2 ring-purple-400 scale-105 z-10'
                      : 'hover:border-white/50'
                  } ${dimmed ? 'opacity-20' : 'opacity-100'}`}
                >
                  <div className="text-[9px] font-mono leading-none opacity-80">
                    {el.atomicNumber}
                  </div>
                  <div className="font-display text-sm font-bold leading-none text-white">
                    {el.symbol}
                  </div>
                  <div className="text-[8px] truncate leading-none opacity-90">
                    {el.name}
                  </div>
                </button>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. UPGRADED REACTIMIX — COMPLETE 118-ELEMENT & ION CHEMISTRY LABORATORY
// ============================================================================
export interface ChemistryGlossaryTerm {
  id: string;
  term: string;
  category:
    | 'Periodic Trends'
    | 'Atomic Structure'
    | 'Chemical Bonding'
    | 'Stoichiometry & Reactions'
    | 'Acids, Bases & Ions';
  symbolOrUnit?: string;
  definition: string;
  scientificDetail: string;
  example: string;
}

export const CHEMISTRY_GLOSSARY: ChemistryGlossaryTerm[] = [
  {
    id: 'electronegativity',
    term: 'Electronegativity',
    category: 'Periodic Trends',
    symbolOrUnit: 'χ (Pauling Scale: 0.7 – 3.98)',
    definition:
      'A measure of the tendency of an atom to attract a shared pair of bonding electrons toward itself within a covalent bond.',
    scientificDetail:
      'Across a period (left → right), electronegativity increases due to higher effective nuclear charge (Z_eff) and smaller atomic radius. Down a group (top → bottom), it decreases because valence electrons are farther from the nucleus and shielded by inner shells.',
    example:
      'Fluorine (F) is the most electronegative element (χ = 3.98), whereas Francium/Caesium (χ ≈ 0.79) are the least. In HCl, Chlorine (3.16) pulls shared electrons away from Hydrogen (2.20), creating a polar covalent bond (δ⁺H–Clδ⁻).'
  },
  {
    id: 'valence-electrons',
    term: 'Valence Electrons',
    category: 'Atomic Structure',
    symbolOrUnit: 'Outermost s & p shell electrons',
    definition:
      'The electrons occupying the outermost principal energy shell (highest principal quantum number n) of an atom that participate in chemical bonding and reactions.',
    scientificDetail:
      'Main-group elements in Groups 1, 2, and 13–18 have 1 to 8 valence electrons corresponding to their group number. Atoms lose, gain, or share valence electrons to achieve a stable Noble Gas octet (8 valence electrons, or 2 for Helium/Hydrogen).',
    example:
      'Sodium (Na, 2,8,1) has 1 valence electron and readily loses it to form Na⁺. Chlorine (Cl, 2,8,7) has 7 valence electrons and gains 1 electron to form Cl⁻, completing its octet (2,8,8).'
  },
  {
    id: 'atomic-mass',
    term: 'Atomic Mass',
    category: 'Atomic Structure',
    symbolOrUnit: 'u (Unified Atomic Mass Unit) or Da',
    definition:
      'The weighted average mass of the naturally occurring isotopes of an element, measured relative to 1/12th the mass of a Carbon-12 atom (1 u ≈ 1.6605 × 10⁻²⁷ kg).',
    scientificDetail:
      'Unlike mass number (A = protons + neutrons of a single nucleus), standard atomic weight accounts for natural isotopic abundances. Numerically, atomic mass in u equals the molar mass in grams per mole (g/mol).',
    example:
      'Chlorine consists of ~75.76% ³⁵Cl (34.97 u) and ~24.24% ³⁷Cl (36.97 u), giving an average atomic mass of 35.45 u (35.45 g/mol).'
  },
  {
    id: 'atomic-number',
    term: 'Atomic Number (Z)',
    category: 'Atomic Structure',
    symbolOrUnit: 'Z = Number of Protons',
    definition:
      'The total number of positively charged protons in the atomic nucleus, which uniquely identifies a chemical element and determines its position on the Periodic Table.',
    scientificDetail:
      'In a neutral uncharged atom, the number of orbital electrons equals the atomic number Z. Elements in the periodic table are ordered sequentially from Z = 1 (Hydrogen) to Z = 118 (Oganesson).',
    example:
      'Every Carbon atom has Z = 6 protons; every Gold (Au) atom has Z = 79 protons.'
  },
  {
    id: 'electron-configuration',
    term: 'Electron Configuration',
    category: 'Atomic Structure',
    symbolOrUnit: '1s² 2s² 2p⁶ ...',
    definition:
      'The distribution of an atom’s or ion’s electrons across principal energy shells (n = 1, 2, 3...) and orbital subshells (s, p, d, f) in the ground state.',
    scientificDetail:
      'Governed by the Aufbau Principle (fill lowest energy orbitals first), Pauli Exclusion Principle (max 2 opposite-spin electrons per orbital), and Hund’s Rule (singly occupy degenerate orbitals before pairing).',
    example:
      'Calcium (Z = 20) has electron configuration [Ar] 4s² (or 1s² 2s² 2p⁶ 3s² 3p⁶ 4s²), placing its 2 valence electrons in the 4s subshell.'
  },
  {
    id: 'oxidation-state',
    term: 'Oxidation State (Oxidation Number)',
    category: 'Stoichiometry & Reactions',
    symbolOrUnit: '+1, +2, -1, -2, etc.',
    definition:
      'The hypothetical electric charge an atom would carry if all bonds to different elements were 100% ionic, used to track electron transfer in redox reactions and formula balancing.',
    scientificDetail:
      'In a neutral compound, the algebraic sum of all oxidation states must equal zero (Σ = 0). In a polyatomic ion, the sum equals the net charge of the ion.',
    example:
      'In Sulfuric Acid (H₂SO₄), H is +1 and O is -2, so Sulfur has an oxidation state of +6 because 2(+1) + (+6) + 4(-2) = 0.'
  },
  {
    id: 'molar-mass',
    term: 'Molar Mass (M)',
    category: 'Stoichiometry & Reactions',
    symbolOrUnit: 'g/mol',
    definition:
      'The mass in grams of one mole (6.02214 × 10²³ formula units or molecules) of a chemical element or compound.',
    scientificDetail:
      'Calculated by summing the standard atomic masses of every atom in the empirical or molecular formula: M = Σ (subscript × atomic mass).',
    example:
      'For Calcium Carbonate (CaCO₃): M = 40.078 (Ca) + 12.011 (C) + 3 × 15.999 (O) = 100.09 g/mol.'
  },
  {
    id: 'ionic-bonding',
    term: 'Ionic Bonding',
    category: 'Chemical Bonding',
    symbolOrUnit: 'Electrostatic Lattice (Cation + Anion)',
    definition:
      'The strong electrostatic attraction between positively charged cations (typically metals) and negatively charged anions (nonmetals or polyatomic radicals) formed by complete electron transfer.',
    scientificDetail:
      'Occurs when the electronegativity difference Δχ between bonding atoms exceeds ~1.7. Ionic compounds form high-melting crystalline lattices and conduct electricity when molten or dissolved in water.',
    example:
      'Calcium (Ca) transfers 2 valence electrons to two Chlorine (Cl) atoms: Ca²⁺ + 2Cl⁻ → CaCl₂.'
  },
  {
    id: 'covalent-bonding',
    term: 'Covalent Bonding',
    category: 'Chemical Bonding',
    symbolOrUnit: 'Shared Electron Pairs (Single, Double, Triple)',
    definition:
      'A chemical bond formed when two nonmetal atoms share one or more pairs of valence electrons to satisfy their octets.',
    scientificDetail:
      'A single bond shares 2 electrons (1 pair, e.g., H–H), a double bond shares 4 electrons (2 pairs, e.g., O=C=O), and a triple bond shares 6 electrons (3 pairs, e.g., N≡N).',
    example:
      'In Methane (CH₄), Carbon (4 valence e⁻) shares one electron with each of four Hydrogen atoms, forming 4 single covalent C–H bonds.'
  },
  {
    id: 'cation-and-anion',
    term: 'Cation & Anion',
    category: 'Acids, Bases & Ions',
    symbolOrUnit: 'Mⁿ⁺ (Cation) / Xⁿ⁻ (Anion)',
    definition:
      'A cation is a positively charged ion formed when an atom loses electrons; an anion is a negatively charged ion formed when an atom gains electrons.',
    scientificDetail:
      'Metals have low ionization energies and form cations (Na⁺, K⁺, Ca²⁺, Mg²⁺, Fe³⁺), whereas nonmetals have high electron affinities and form anions (Cl⁻, O²⁻, N³⁻).',
    example:
      'In NaCl, Na⁺ is the cation (11 protons, 10 electrons) and Cl⁻ is the anion (17 protons, 18 electrons).'
  },
  {
    id: 'polyatomic-ion',
    term: 'Polyatomic Ion (Radical)',
    category: 'Acids, Bases & Ions',
    symbolOrUnit: 'NH₄⁺, OH⁻, NO₃⁻, SO₄²⁻, CO₃²⁻, PO₄³⁻',
    definition:
      'A tightly bound group of two or more covalently bonded atoms that carries a net positive or negative electric charge and acts as a single unit in chemical reactions.',
    scientificDetail:
      'When more than one polyatomic ion is needed to balance charge in a chemical formula, the radical is enclosed in parentheses with a subscript outside.',
    example:
      'Combining Ca²⁺ with two Hydroxide (OH⁻) radicals produces Calcium Hydroxide: Ca(OH)₂.'
  },
  {
    id: 'octet-rule',
    term: 'Octet Rule',
    category: 'Chemical Bonding',
    symbolOrUnit: 'ns² np⁶ (8 Valence Electrons)',
    definition:
      'The chemical principle that main-group atoms tend to bond in ways that give each atom eight electrons in its valence shell, matching the stable electronic configuration of a Noble Gas.',
    scientificDetail:
      'Hydrogen, Helium, Lithium, and Beryllium follow the Duet Rule (2 valence electrons filling the 1s² shell). Elements in Period 3 and beyond (like P and S) can exhibit expanded octets using d-orbitals.',
    example:
      'Oxygen (2,6) needs 2 electrons to complete its octet (2,8), so it forms two bonds in H₂O or a double bond in O₂.'
  },
  {
    id: 'ionization-energy',
    term: 'Ionization Energy (IE)',
    category: 'Periodic Trends',
    symbolOrUnit: 'kJ/mol',
    definition:
      'The minimum energy required to remove the most loosely bound valence electron from an isolated neutral gaseous atom: X(g) → X⁺(g) + e⁻.',
    scientificDetail:
      'Ionization energy increases across a period (left → right) and decreases down a group. Noble gases have the highest ionization energies, while Alkali Metals (Group 1) have the lowest.',
    example:
      'Helium has the highest first ionization energy (2372 kJ/mol), while Caesium has one of the lowest (376 kJ/mol).'
  },
  {
    id: 'atomic-radius',
    term: 'Atomic Radius',
    category: 'Periodic Trends',
    symbolOrUnit: 'pm (Picometers, 10⁻¹² m) or Å',
    definition:
      'A measure of the size of an atom, defined as half the equilibrium distance between the nuclei of two identical bonded atoms.',
    scientificDetail:
      'Atomic radius decreases from left to right across a period (increasing nuclear charge pulls shells inward) and increases down a group (addition of new principal electron shells n).',
    example:
      'Across Period 3, atomic radius shrinks from Sodium (Na, 186 pm) to Chlorine (Cl, 99 pm).'
  },
  {
    id: 'isotopes',
    term: 'Isotopes',
    category: 'Atomic Structure',
    symbolOrUnit: 'ᴬZX (Same Z, Different N)',
    definition:
      'Atoms of the same chemical element that have the exact same number of protons (Z) and electrons, but different numbers of neutrons (N) and therefore different mass numbers (A = Z + N).',
    scientificDetail:
      'Because chemical behavior is governed by valence electrons, isotopes of an element exhibit nearly identical chemical reactions, though their nuclear stability and physical mass differ.',
    example:
      'Hydrogen has three isotopes: Protium (¹H, 0 neutrons), Deuterium (²H, 1 neutron), and radioactive Tritium (³H, 2 neutrons).'
  },
  {
    id: 'stoichiometry',
    term: 'Stoichiometry & Charge Balance',
    category: 'Stoichiometry & Reactions',
    symbolOrUnit: 'Conservation of Mass & Charge (Σq = 0)',
    definition:
      'The quantitative relationship between the relative quantities of reactants and products in a balanced chemical reaction or compound formula.',
    scientificDetail:
      'Every stable ionic compound must be electrically neutral overall: (count_cation × q_cation) + (count_anion × q_anion) = 0. Using the cross-valency method and reducing to lowest whole numbers yields the empirical formula.',
    example:
      'Iron(III) (Fe³⁺) and Oxide (O²⁻) require least common multiple charge ±6: 2(+3) + 3(-2) = 0 → Fe₂O₃.'
  },
  {
    id: 'acid-base-ph',
    term: 'Acids, Bases & pH Scale',
    category: 'Acids, Bases & Ions',
    symbolOrUnit: 'pH = -log₁₀[H⁺] (0 to 14)',
    definition:
      'Acids donate protons (H⁺ / H₃O⁺) in aqueous solution (pH < 7), while bases donate hydroxide ions (OH⁻) or accept protons (pH > 7). Pure water at 25°C is neutral (pH = 7.00).',
    scientificDetail:
      'When an acid and a base react in stoichiometric proportions, they undergo a neutralization reaction to form an ionic salt and water: H⁺(aq) + OH⁻(aq) → H₂O(l).',
    example:
      'Hydrochloric Acid + Sodium Hydroxide → Sodium Chloride + Water: HCl + NaOH → NaCl + H₂O.'
  },
  {
    id: 'blocks-s-p-d-f',
    term: 'Periodic Blocks (s, p, d, f)',
    category: 'Periodic Trends',
    symbolOrUnit: 's-block, p-block, d-block, f-block',
    definition:
      'Regions of the Periodic Table classified by the type of atomic orbital subshell (s, p, d, or f) that receives the highest-energy differentiating electron.',
    scientificDetail:
      'Groups 1–2 (+ He) form the s-block; Groups 13–18 form the p-block; Transition Metals (Groups 3–12) form the d-block; Lanthanides (57–71) and Actinides (89–103) form the f-block.',
    example:
      'Iron (Fe, Z=26, [Ar] 3d⁶ 4s²) is a d-block transition metal; Uranium (U, Z=92, [Rn] 5f³ 6d¹ 7s²) is an f-block actinide.'
  }
];

function explainUnsupportedReaction(selectedIds: string[]): string {
  if (selectedIds.length === 0) return '';

  // Check if any selected species is a Noble Gas
  const nobleGases = PERIODIC_ELEMENTS.filter((e) => e.category === 'Noble Gas');
  const pickedNoble = nobleGases.find((ng) => selectedIds.includes(ng.symbol));
  if (pickedNoble) {
    return `${pickedNoble.name} (${pickedNoble.symbol}, Group 18) is a Noble Gas with a completely filled valence shell (${pickedNoble.electronConfig}). Because its octet/duet is already satisfied, it is chemically inert under standard laboratory conditions and does not combine here.`;
  }

  // Check if any selected species is a synthetic superheavy transactinide
  const pickedSuperheavy = PERIODIC_ELEMENTS.find(
    (e) => selectedIds.includes(e.symbol) && e.atomicNumber >= 93
  );
  if (pickedSuperheavy) {
    return `${pickedSuperheavy.name} (${pickedSuperheavy.symbol}, Z=${pickedSuperheavy.atomicNumber}) is a radioactive transuranium/superheavy element with short half-lives that is not used in standard stoichiometric bench synthesis.`;
  }

  // Check if user selected only cations
  const selectedIons = REACTIMIX_IONS.filter((i) => selectedIds.includes(i.id));
  if (selectedIons.length >= 2 && selectedIons.every((i) => i.type === 'cation')) {
    return `All selected ions (${selectedIons.map((i) => i.symbol).join(', ')}) are positively charged cations. Like charges electrostatically repel each other and cannot achieve charge neutrality (Σq = 0) without a counter-anion.`;
  }

  // Check if user selected only anions
  if (selectedIons.length >= 2 && selectedIons.every((i) => i.type === 'anion')) {
    return `All selected ions (${selectedIons.map((i) => i.symbol).join(', ')}) are negatively charged anions. Two anions repel each other electrostatically and require a positively charged cation to balance charges.`;
  }

  // Check if user selected only metallic elements
  const selectedElements = PERIODIC_ELEMENTS.filter((e) =>
    selectedIds.includes(e.symbol)
  );
  const metalCategories: PeriodicElement['category'][] = [
    'Alkali Metal',
    'Alkaline Earth Metal',
    'Transition Metal',
    'Post-Transition Metal',
    'Lanthanide',
    'Actinide'
  ];
  if (
    selectedElements.length >= 2 &&
    selectedIons.length === 0 &&
    selectedElements.every((e) => metalCategories.includes(e.category))
  ) {
    return `${selectedElements.map((e) => `${e.name} (${e.symbol})`).join(' and ')} are electropositive metals. Metals do not form stoichiometric ionic or covalent compounds with one another; instead, they form solid solutions or metallic alloys. Combine a metal with a nonmetal (such as O, Cl, S) or a polyatomic anion.`;
  }

  return `The combination (${selectedIds.join(' + ')}) does not match a stable stoichiometric compound in the verified reaction database. Try combining compatible cations and anions (e.g., Ca²⁺ + Cl⁻ → CaCl₂, Na⁺ + HCO₃⁻ → NaHCO₃) or elements (e.g., Fe + O → Fe₂O₃, Cu + S + O → CuSO₄, H + O → H₂O).`;
}

export const ReactiMixModule: React.FC = () => {
  const { recordBrainifyInteraction, updateActivityProgress } = usePlatform();

  // Selected reactants in the Reaction Mixer (can be element symbols like 'Ca', 'C', 'O' OR ion IDs like 'Ca2+', 'Cl-')
  const [selectedIds, setSelectedIds] = useState<string[]>(['Ca2+', 'Cl-']);
  // Currently inspected element from the 118-element Periodic Table
  const [inspectedElement, setInspectedElement] = useState<PeriodicElement>(
    PERIODIC_ELEMENTS[19] // Calcium (Z=20)
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [tableViewMode, setTableViewMode] = useState<'periodic-grid' | 'element-cards'>('periodic-grid');

  // Chemistry Glossary state inside ReactiMix
  const [glossarySearch, setGlossarySearch] = useState<string>('');
  const [glossaryCategory, setGlossaryCategory] = useState<string>('All');
  const [selectedGlossaryId, setSelectedGlossaryId] = useState<string>('electronegativity');

  const filteredGlossary = useMemo(() => {
    const q = glossarySearch.trim().toLowerCase();
    return CHEMISTRY_GLOSSARY.filter((item) => {
      const matchesCat =
        glossaryCategory === 'All' || item.category === glossaryCategory;
      const matchesSearch =
        !q ||
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.scientificDetail.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q) ||
        (item.symbolOrUnit && item.symbolOrUnit.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [glossarySearch, glossaryCategory]);

  const activeGlossaryTerm = useMemo(() => {
    return (
      CHEMISTRY_GLOSSARY.find((g) => g.id === selectedGlossaryId) ||
      filteredGlossary[0] ||
      CHEMISTRY_GLOSSARY[0]
    );
  }, [selectedGlossaryId, filteredGlossary]);

  const toggleReactant = (id: string) => {
    sound.playClick();
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
    recordBrainifyInteraction(10, 'ReactiMix', 'Stoichiometry Master (Synthesized Compounds in ReactiMix)');
    updateActivityProgress('reactimix', 10, 'add');
  };

  const handleElementClick = (el: PeriodicElement, alsoToggleInMixer = true) => {
    sound.playClick();
    setInspectedElement(el);
    if (alsoToggleInMixer) {
      toggleReactant(el.symbol);
    } else {
      recordBrainifyInteraction(5, 'ReactiMix');
      updateActivityProgress('reactimix', 5, 'add');
    }
  };

  const matchedCompound: VerifiedCompound | null = useMemo(() => {
    if (selectedIds.length < 2) return null;
    const sortedKey = [...selectedIds].sort().join('+');
    return (
      VERIFIED_COMPOUNDS.find(
        (c) => c.key === sortedKey || c.acceptedKeys.includes(sortedKey)
      ) || null
    );
  }, [selectedIds]);

  const filteredElements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PERIODIC_ELEMENTS.filter((el) => {
      const matchesCat = categoryFilter === 'All' || el.category === categoryFilter;
      const matchesSearch =
        !q ||
        el.name.toLowerCase().includes(q) ||
        el.symbol.toLowerCase().includes(q) ||
        String(el.atomicNumber) === q ||
        el.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, categoryFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-purple-400 tracking-wider uppercase mb-1">
            COMPLETE 118-ELEMENT &amp; ION STOICHIOMETRY LABORATORY
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
            ReactiMix — Interactive Chemistry &amp; Compound Builder
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore all 118 elements (Hydrogen 1 to Oganesson 118), inspect complete atomic properties, and combine elements or ions/radicals to build verified chemical compounds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-400/30 text-xs font-mono text-purple-200">
            118 Elements Loaded
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-xs font-mono text-cyan-200">
            {REACTIMIX_IONS.length} Ions/Radicals
          </span>
          <a
            href="#reactimix-chemistry-glossary"
            onClick={() => sound.playClick()}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-xs font-mono font-bold text-emerald-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chemistry Glossary ({CHEMISTRY_GLOSSARY.length} Terms)</span>
          </a>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* GLOBAL 118-ELEMENT INSTANT SEARCH BAR IN REACTIMIX                    */}
      {/* ===================================================================== */}
      <div className="bg-[#0B0D18] border border-purple-500/35 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <label
              htmlFor="reactimix-global-element-search"
              className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-purple-400" />
              <span>Global 118-Element Instant Search</span>
            </label>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly find any of the 118 elements by <strong className="text-slate-200">Name</strong> (e.g., Hydrogen, Gold, Oganesson), <strong className="text-slate-200">Symbol</strong> (e.g., H, Fe, Au, Og), or <strong className="text-slate-200">Atomic Number</strong> (1–118)
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
            <input
              id="reactimix-global-element-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 118 elements by name, symbol, or atomic number (1–118)..."
              className="w-full bg-[#070810] border border-purple-400/40 rounded-xl pl-10 pr-8 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
            />
            {searchQuery.trim() !== '' && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Instant Global Search Results */}
        {searchQuery.trim() !== '' && (
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2.5">
              <span>
                Found <strong className="text-purple-300">{filteredElements.length}</strong> matching element{filteredElements.length === 1 ? '' : 's'} for &ldquo;{searchQuery}&rdquo;
              </span>
              <span>Click any element to inspect or add to mixer</span>
            </div>

            {filteredElements.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#070810] border border-white/10 text-xs text-slate-400 text-center">
                No element matched &ldquo;{searchQuery}&rdquo;. Try an element name (e.g. Oxygen), symbol (e.g. O), or atomic number (1–118).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {filteredElements.slice(0, 12).map((el) => {
                  const isInMixer = selectedIds.includes(el.symbol);
                  const isInspected = el.atomicNumber === inspectedElement.atomicNumber;
                  return (
                    <div
                      key={el.atomicNumber}
                      onClick={() => handleElementClick(el, false)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        CATEGORY_COLOR_MAP[el.category]
                      } ${isInspected ? 'ring-2 ring-cyan-400' : ''}`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono opacity-85">
                          <span>Z = {el.atomicNumber}</span>
                          <span>{el.atomicMass} u</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-display text-xl font-extrabold text-white">
                            {el.symbol}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {el.name}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono opacity-85 mt-0.5 truncate">
                          {el.category} · {el.electronConfig}
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleElementClick(el, false);
                          }}
                          className="flex-1 py-1 px-2 rounded bg-black/40 hover:bg-black/60 text-white border border-white/15 text-[10px] font-mono font-semibold cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleElementClick(el, true);
                          }}
                          className={`flex-1 py-1 px-2 rounded text-[10px] font-mono font-bold cursor-pointer ${
                            isInMixer
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          {isInMixer ? '✓ In Mixer' : '+ Mix'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TOP ZONE: REACTION MIXER & STOICHIOMETRY ANALYZER + IONS PALETTE      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Reactant Selection & Common Ions/Radicals */}
        <div className="lg:col-span-6 bg-[#0B0D18] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-display text-base font-bold text-white">
                Active Reactants in Chamber ({selectedIds.length} Selected)
              </h3>
              <p className="text-[11px] text-slate-400">
                Click any ion below or any element in the 118-Element Periodic Table to add/remove it
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              Clear All
            </button>
          </div>

          {/* Currently Selected Chips */}
          <div className="min-h-[54px] p-3 rounded-xl bg-[#070810] border border-purple-500/30 flex flex-wrap items-center gap-2">
            {selectedIds.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono">
                No reactants selected — click elements or ions below to combine...
              </span>
            ) : (
              selectedIds.map((id, idx) => {
                const ionObj = REACTIMIX_IONS.find((i) => i.id === id);
                const elObj = PERIODIC_ELEMENTS.find((e) => e.symbol === id);
                return (
                  <React.Fragment key={id}>
                    {idx > 0 && (
                      <span className="font-mono text-sm font-bold text-purple-400">+</span>
                    )}
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/30 to-cyan-600/30 border border-cyan-400/50 text-xs font-mono font-bold text-white">
                      <span>{ionObj ? ionObj.symbol : elObj ? `${elObj.symbol} (${elObj.name})` : id}</span>
                      <button
                        type="button"
                        onClick={() => toggleReactant(id)}
                        className="text-slate-300 hover:text-red-400 cursor-pointer"
                        title="Remove reactant"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Common Ions & Radicals Palette */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Common Ions &amp; Polyatomic Radicals (Click to Combine):
              </span>
              <span className="text-[11px] text-slate-400">Cations (+) &amp; Anions (–)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REACTIMIX_IONS.map((ion) => {
                const active = selectedIds.includes(ion.id);
                return (
                  <button
                    key={ion.id}
                    type="button"
                    onClick={() => toggleReactant(ion.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-[#070810] border-white/10 text-slate-300 hover:border-purple-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-cyan-300">
                        {ion.symbol}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          ion.type === 'cation'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-pink-500/15 text-pink-300'
                        }`}
                      >
                        {ion.charge}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-white truncate mt-0.5">
                      {ion.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Verified Target Compounds Bar */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-xs font-mono text-purple-300">
              QUICK VERIFIED COMPOUNDS (CLICK TO LOAD REACTANTS):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VERIFIED_COMPOUNDS.slice(0, 18).map((c) => (
                <button
                  key={c.formula}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedIds(c.acceptedKeys[0].split('+'));
                    updateActivityProgress('reactimix', 10, 'add');
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                    matchedCompound?.formula === c.formula
                      ? 'bg-purple-600 border-purple-400 text-white font-bold'
                      : 'bg-[#070810] hover:bg-purple-500/20 border-white/10 text-cyan-200'
                  }`}
                >
                  {c.formula}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Reaction Chamber Result & Charge Balancing Output */}
        <div className="lg:col-span-6 bg-[#0B0D18] border border-purple-500/35 rounded-2xl p-6 flex flex-col justify-between">
          {selectedIds.length < 2 ? (
            <div className="my-auto text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center mx-auto text-purple-300">
                <FlaskConical className="w-7 h-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">
                Select Two or More Elements / Ions
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Pick elements from the 118-Element Periodic Table below or ions from the left panel (for example, <strong className="text-cyan-300">Ca²⁺ + Cl⁻</strong>, <strong className="text-cyan-300">Na⁺ + HCO₃⁻</strong>, or <strong className="text-cyan-300">Fe + O</strong>) to synthesize a compound and inspect its charge balancing.
              </p>
            </div>
          ) : matchedCompound ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SUPPORTED COMPOUND SYNTHESIZED</span>
                  </span>
                  <h3 className="font-display text-3xl font-extrabold text-white mt-1">
                    {matchedCompound.formula}
                  </h3>
                  <div className="text-sm font-semibold text-purple-200 mt-0.5">
                    {matchedCompound.name}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#070810] border border-cyan-500/30 text-right font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">Molar Mass</div>
                  <div className="text-sm font-bold text-cyan-300">
                    {matchedCompound.molarMass}
                  </div>
                </div>
              </div>

              {/* Balanced Equation & Stoichiometric Charge Balancing */}
              <div className="p-3.5 rounded-xl bg-[#070810] border border-purple-500/30 space-y-1.5">
                <div className="text-[11px] font-mono text-purple-300 uppercase">
                  Reaction &amp; Charge Balancing Explanation
                </div>
                <div className="font-mono text-sm font-bold text-cyan-300">
                  {matchedCompound.equation}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {matchedCompound.chargeBalance}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
                  <span className="text-slate-400 block mb-0.5">Compound Classification</span>
                  <span className="text-white font-semibold">
                    {matchedCompound.compoundType}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#070810] border border-white/10">
                  <span className="text-slate-400 block mb-0.5">Chemical Bond &amp; Geometry</span>
                  <span className="text-white font-semibold">
                    {matchedCompound.bondType}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070810] border border-white/10 text-xs space-y-1">
                <strong className="text-cyan-400 block">Physical &amp; Chemical Properties:</strong>
                <div className="text-slate-200">
                  {matchedCompound.properties.join(' · ')}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070810] border border-white/10 text-xs space-y-1">
                <strong className="text-emerald-400 block">Scientific &amp; Industrial Uses:</strong>
                <p className="text-slate-200 leading-relaxed">{matchedCompound.uses}</p>
              </div>
            </div>
          ) : (
            <div className="my-auto p-6 rounded-xl bg-red-950/20 border border-red-500/40 text-center space-y-3">
              <AlertTriangle className="w-9 h-9 text-amber-400 mx-auto" />
              <div className="inline-block px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-xs font-mono font-bold text-red-200">
                Unsupported or invalid combination
              </div>
              <h3 className="font-display text-xl font-bold text-white">
                Unsupported or invalid combination
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 max-w-md mx-auto leading-relaxed">
                {explainUnsupportedReaction(selectedIds)}
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-400">
                Selected: {selectedIds.join(' + ')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MIDDLE ZONE: FULL 19-PROPERTY ELEMENT INSPECTOR FOR SELECTED ELEMENT  */}
      {/* ===================================================================== */}
      <ElementDetailPanel
        element={inspectedElement}
        onAddToReactiMix={(sym) => toggleReactant(sym)}
        isSelectedInReactiMix={selectedIds.includes(inspectedElement.symbol)}
      />

      {/* ===================================================================== */}
      {/* BOTTOM ZONE: COMPLETE 118-ELEMENT INTERACTIVE PERIODIC TABLE          */}
      {/* ===================================================================== */}
      <div className="bg-[#0B0D18] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Atom className="w-5 h-5 text-cyan-400" />
              <span>Interactive Periodic Table — All 118 Chemical Elements (Z = 1 to 118)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any element to view its full scientific profile above and toggle it in the ReactiMix reaction chamber
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 118 elements by name, symbol, Z..."
                className="w-full bg-[#070810] border border-white/15 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex items-center bg-[#070810] border border-white/10 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setTableViewMode('periodic-grid')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  tableViewMode === 'periodic-grid'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                18-Col Periodic Table
              </button>
              <button
                type="button"
                onClick={() => setTableViewMode('element-cards')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                  tableViewMode === 'element-cards'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All 118 Cards ({filteredElements.length})
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {ELEMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-[#070810] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {tableViewMode === 'periodic-grid' ? (
          <div className="bg-[#070810] border border-white/10 rounded-xl p-4 overflow-x-auto">
            <div
              className="grid gap-1.5 min-w-[1040px]"
              style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
            >
              {Array.from({ length: 10 }).map((_, rIdx) => {
                const rowNum = rIdx + 1;
                if (rowNum === 8) {
                  return <div key="spacer-row" className="col-span-18 h-3" />;
                }
                return Array.from({ length: 18 }).map((__, cIdx) => {
                  const colNum = cIdx + 1;
                  const el = PERIODIC_ELEMENTS.find(
                    (e) => e.row === rowNum && e.col === colNum
                  );
                  if (!el) {
                    return <div key={`empty-${rowNum}-${colNum}`} className="h-14" />;
                  }

                  const q = searchQuery.trim().toLowerCase();
                  const matchesSearch =
                    !q ||
                    el.name.toLowerCase().includes(q) ||
                    el.symbol.toLowerCase().includes(q) ||
                    String(el.atomicNumber) === q;
                  const matchesCat =
                    categoryFilter === 'All' || el.category === categoryFilter;
                  const dimmed = !(matchesSearch && matchesCat);
                  const isInspected = el.atomicNumber === inspectedElement.atomicNumber;
                  const isInMixer = selectedIds.includes(el.symbol);

                  return (
                    <button
                      key={el.atomicNumber}
                      type="button"
                      onClick={() => handleElementClick(el, true)}
                      className={`h-14 p-1 rounded-md border text-left transition-all flex flex-col justify-between cursor-pointer relative ${
                        CATEGORY_COLOR_MAP[el.category]
                      } ${
                        isInMixer
                          ? 'ring-2 ring-emerald-400 scale-105 z-20'
                          : isInspected
                          ? 'ring-2 ring-cyan-400 scale-105 z-10'
                          : 'hover:border-white/50'
                      } ${dimmed ? 'opacity-20' : 'opacity-100'}`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono leading-none opacity-80">
                        <span>{el.atomicNumber}</span>
                        {isInMixer && <span className="text-emerald-300 font-bold">✓</span>}
                      </div>
                      <div className="font-display text-sm font-bold leading-none text-white">
                        {el.symbol}
                      </div>
                      <div className="text-[8px] truncate leading-none opacity-90">
                        {el.name}
                      </div>
                    </button>
                  );
                });
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredElements.map((el) => {
              const isInMixer = selectedIds.includes(el.symbol);
              const isInspected = el.atomicNumber === inspectedElement.atomicNumber;
              return (
                <div
                  key={el.atomicNumber}
                  onClick={() => handleElementClick(el, false)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    CATEGORY_COLOR_MAP[el.category]
                  } ${
                    isInspected ? 'ring-2 ring-cyan-400' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono opacity-85">
                      <span>Z = {el.atomicNumber}</span>
                      <span>{el.atomicMass} u</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-display text-xl font-extrabold text-white">
                        {el.symbol}
                      </span>
                      <span className="text-xs font-semibold text-white truncate">
                        {el.name}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono opacity-80 mt-1 truncate">
                      {el.electronConfig}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleElementClick(el, true);
                    }}
                    className={`mt-2.5 w-full py-1 px-2 rounded text-[10px] font-mono font-bold cursor-pointer ${
                      isInMixer
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-black/40 hover:bg-black/60 text-white border border-white/15'
                    }`}
                  >
                    {isInMixer ? '✓ In Mixer' : '+ Add to Mixer'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SEARCHABLE CHEMISTRY GLOSSARY INSIDE REACTIMIX                        */}
      {/* ===================================================================== */}
      <div
        id="reactimix-chemistry-glossary"
        className="bg-[#0B0D18] border border-purple-500/30 rounded-2xl p-6 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-400 uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>REACTIMIX REFERENCE ENCYCLOPEDIA</span>
            </div>
            <h3 className="font-display text-xl md:text-2xl font-bold text-white">
              Searchable Chemistry Glossary
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Search and explore key chemical concepts including Electronegativity, Valence Electrons, Atomic Mass, Oxidation States, Molar Mass, and Bonding Rules
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="search"
              value={glossarySearch}
              onChange={(e) => setGlossarySearch(e.target.value)}
              placeholder="Search 'electronegativity', 'valence electrons', 'atomic mass'..."
              className="w-full bg-[#070810] border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* Featured Key Term Quick-Select Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 mr-1">
            Key Terms:
          </span>
          {[
            { id: 'electronegativity', label: 'Electronegativity' },
            { id: 'valence-electrons', label: 'Valence Electrons' },
            { id: 'atomic-mass', label: 'Atomic Mass' },
            { id: 'oxidation-state', label: 'Oxidation State' },
            { id: 'electron-configuration', label: 'Electron Configuration' },
            { id: 'molar-mass', label: 'Molar Mass' },
            { id: 'ionic-bonding', label: 'Ionic Bonding' },
            { id: 'covalent-bonding', label: 'Covalent Bonding' },
            { id: 'polyatomic-ion', label: 'Polyatomic Ion (Radical)' },
            { id: 'octet-rule', label: 'Octet Rule' }
          ].map((quick) => {
            const isSelected = activeGlossaryTerm.id === quick.id;
            return (
              <button
                key={quick.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSelectedGlossaryId(quick.id);
                  setGlossarySearch('');
                  setGlossaryCategory('All');
                  updateActivityProgress('reactimix', 5, 'add');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-[#070810] hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                {quick.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            'All',
            'Periodic Trends',
            'Atomic Structure',
            'Chemical Bonding',
            'Stoichiometry & Reactions',
            'Acids, Bases & Ions'
          ].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                sound.playClick();
                setGlossaryCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                glossaryCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-[#070810] text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Highlighted Term Inspector + Searchable Glossary Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Active Term Deep Dive */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#070810] via-[#100C22] to-[#080D1A] border border-purple-500/40 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/30 text-[11px] font-mono text-purple-200">
                  {activeGlossaryTerm.category}
                </span>
                {activeGlossaryTerm.symbolOrUnit && (
                  <span className="font-mono text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 rounded-md">
                    {activeGlossaryTerm.symbolOrUnit}
                  </span>
                )}
              </div>

              <h4 className="font-display text-2xl font-extrabold text-white">
                {activeGlossaryTerm.term}
              </h4>

              <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10">
                <div className="text-[10px] font-mono text-purple-300 uppercase mb-1">
                  Core Definition
                </div>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                  {activeGlossaryTerm.definition}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#070810]/80 border border-white/10">
                <div className="text-[10px] font-mono text-cyan-400 uppercase mb-1">
                  Scientific Principle &amp; Periodic Behavior
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeGlossaryTerm.scientificDetail}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-950/25 border border-emerald-500/30">
              <div className="text-[10px] font-mono text-emerald-400 uppercase mb-1">
                Chemical Example in ReactiMix
              </div>
              <p className="text-xs font-mono text-emerald-100 leading-relaxed">
                {activeGlossaryTerm.example}
              </p>
            </div>
          </div>

          {/* Right 7 Cols: Searchable List of Terms */}
          <div className="lg:col-span-7">
            {filteredGlossary.length === 0 ? (
              <div className="bg-[#070810] border border-white/10 rounded-xl p-8 text-center space-y-2">
                <p className="font-display text-sm font-bold text-white">
                  No chemistry terms matched &ldquo;{glossarySearch}&rdquo;
                </p>
                <p className="text-xs text-slate-400">
                  Try searching for &lsquo;electronegativity&rsquo;, &lsquo;valence electrons&rsquo;, &lsquo;atomic mass&rsquo;, &lsquo;molar mass&rsquo;, or &lsquo;ionic&rsquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setGlossarySearch('');
                    setGlossaryCategory('All');
                  }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold cursor-pointer"
                >
                  Show All {CHEMISTRY_GLOSSARY.length} Terms
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredGlossary.map((item) => {
                  const isActive = item.id === activeGlossaryTerm.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedGlossaryId(item.id);
                        updateActivityProgress('reactimix', 5, 'add');
                      }}
                      className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isActive
                          ? 'bg-purple-950/35 border-purple-400 ring-1 ring-purple-400/50'
                          : 'bg-[#070810] border-white/10 hover:border-purple-400/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-mono text-purple-300">
                            {item.category}
                          </span>
                          {item.symbolOrUnit && (
                            <span className="text-[10px] font-mono text-cyan-400 truncate max-w-[130px]">
                              {item.symbolOrUnit}
                            </span>
                          )}
                        </div>
                        <h5 className="font-display text-sm font-bold text-white mb-1">
                          {item.term}
                        </h5>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {item.definition}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-cyan-300">
                        <span>{isActive ? '● Viewing Full Definition' : 'Click to inspect example →'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. PHYSICS LAB, MATH LAB, SPACE & HUMAN BODY EXPLORERS
// ============================================================================
export const PhysicsLabModule: React.FC = () => {
  const { updateActivityProgress } = usePlatform();
  const [mass, setMass] = useState<number>(10);
  const [velocity, setVelocity] = useState<number>(12);
  const [height, setHeight] = useState<number>(15);
  const [gravity] = useState<number>(9.81);
  const [appliedForce, setAppliedForce] = useState<number>(50);
  const [incidentAngle, setIncidentAngle] = useState<number>(35);

  const kineticEnergy = 0.5 * mass * velocity * velocity;
  const potentialEnergy = mass * gravity * height;
  const totalMechanicalEnergy = kineticEnergy + potentialEnergy;
  const acceleration = appliedForce / mass;
  const refractedRad = Math.asin(Math.sin((incidentAngle * Math.PI) / 180) / 1.5);
  const refractedDeg = ((refractedRad * 180) / Math.PI).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">
          Interactive Physics Laboratory
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manipulate mass, velocity, gravitational field, force, and optical incidence to observe live physical laws
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0B0D18] border border-purple-500/30 rounded-xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-white">
            01. Kinetic &amp; Gravitational Potential Energy
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Object Mass (m)</span>
                <span className="font-mono text-cyan-300">{mass} kg</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={mass}
                onChange={(e) => {
                  setMass(Number(e.target.value));
                  updateActivityProgress('physics-lab', 20, 'add');
                }}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Velocity (v)</span>
                <span className="font-mono text-cyan-300">{velocity} m/s</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={velocity}
                onChange={(e) => {
                  setVelocity(Number(e.target.value));
                  updateActivityProgress('physics-lab', 20, 'add');
                }}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Height (h) · Gravity (g = {gravity} m/s²)</span>
                <span className="font-mono text-cyan-300">{height} m</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={height}
                onChange={(e) => {
                  setHeight(Number(e.target.value));
                  updateActivityProgress('physics-lab', 20, 'add');
                }}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
              <span className="text-slate-400 block">KE = ½mv²</span>
              <span className="font-mono text-base font-bold text-cyan-400 tabular-nums">
                {kineticEnergy.toFixed(0)} J
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
              <span className="text-slate-400 block">PE = mgh</span>
              <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                {potentialEnergy.toFixed(0)} J
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
              <span className="text-slate-400 block">Total E_mech</span>
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {totalMechanicalEnergy.toFixed(0)} J
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0B0D18] border border-purple-500/30 rounded-xl p-6 space-y-4">
          <h3 className="font-display text-lg font-bold text-white">
            02. Newton&apos;s Second Law (F = ma) &amp; Snell&apos;s Law Optics
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Net Applied Force (F) on {mass} kg Mass</span>
                <span className="font-mono text-cyan-300">{appliedForce} N</span>
              </div>
              <input
                type="range"
                min={0}
                max={200}
                value={appliedForce}
                onChange={(e) => {
                  setAppliedForce(Number(e.target.value));
                  updateActivityProgress('physics-lab', 20, 'add');
                }}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#070810] border border-white/10 flex justify-between items-center">
              <span className="text-slate-300">Resulting Acceleration (a = F / m):</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                {acceleration.toFixed(2)} m/s²
              </span>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">
                  Optics Incidence Angle θ₁ (Air n=1.00 → Crown Glass n=1.50)
                </span>
                <span className="font-mono text-cyan-300">{incidentAngle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                value={incidentAngle}
                onChange={(e) => {
                  setIncidentAngle(Number(e.target.value));
                  updateActivityProgress('physics-lab', 20, 'add');
                }}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#070810] border border-white/10 flex justify-between items-center">
              <span className="text-slate-300">Refracted Angle θ₂ (Snell&apos;s Law):</span>
              <span className="font-mono text-base font-bold text-cyan-300">
                {refractedDeg}°
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MathLabModule: React.FC = () => {
  const { updateActivityProgress } = usePlatform();
  const [expr, setExpr] = useState<string>('25');
  const [calcResult, setCalcResult] = useState<string>('25');
  const [graphFreq, setGraphFreq] = useState<number>(2);
  const [graphAmp, setGraphAmp] = useState<number>(40);

  const applyMathOp = (op: string) => {
    sound.playClick();
    updateActivityProgress('math-lab', 20, 'add');
    const val = parseFloat(expr) || 0;
    const rad = (val * Math.PI) / 180;
    switch (op) {
      case 'sqrt':
        setCalcResult(Math.sqrt(val).toFixed(4));
        break;
      case 'sq':
        setCalcResult((val * val).toFixed(4));
        break;
      case 'sin':
        setCalcResult(Math.sin(rad).toFixed(4));
        break;
      case 'cos':
        setCalcResult(Math.cos(rad).toFixed(4));
        break;
      case 'tan':
        setCalcResult(Math.tan(rad).toFixed(4));
        break;
      case 'log':
        setCalcResult(Math.log10(Math.max(0.0001, val)).toFixed(4));
        break;
      case 'pi':
        setExpr(Math.PI.toFixed(6));
        setCalcResult(Math.PI.toFixed(6));
        break;
      case 'pct':
        setCalcResult((val / 100).toFixed(4));
        break;
    }
  };

  const wavePoints = useMemo(() => {
    const pts: string[] = [];
    for (let x = 0; x <= 400; x += 4) {
      const t = (x / 400) * 2 * Math.PI * graphFreq;
      const y = 75 - Math.sin(t) * graphAmp;
      pts.push(`${x},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [graphFreq, graphAmp]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">
          Mathematics Lab — Scientific Evaluator &amp; Harmonic Wave Plotter
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Scientific function evaluator (√, x², %, sin, cos, tan, log₁₀, π) and interactive harmonic graph plotter
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#0B0D18] border border-purple-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Calculator className="w-4 h-4" />
            <span>SCIENTIFIC CALCULATOR (ANGLES IN DEGREES)</span>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Input Value (x)</label>
            <input
              type="number"
              value={expr}
              onChange={(e) => {
                setExpr(e.target.value);
                setCalcResult(e.target.value);
              }}
              className="w-full bg-[#070810] border border-white/15 rounded-lg px-3.5 py-2.5 font-mono text-lg text-white"
            />
          </div>

          <div className="p-3.5 rounded-lg bg-[#070810] border border-cyan-500/30 flex items-center justify-between">
            <span className="text-xs text-slate-400">Computed Output:</span>
            <span className="font-mono text-xl font-bold text-cyan-300 tabular-nums">
              {calcResult}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {[
              { id: 'sqrt', label: '√x' },
              { id: 'sq', label: 'x²' },
              { id: 'pct', label: '%' },
              { id: 'pi', label: 'π' },
              { id: 'sin', label: 'sin(x°)' },
              { id: 'cos', label: 'cos(x°)' },
              { id: 'tan', label: 'tan(x°)' },
              { id: 'log', label: 'log₁₀(x)' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => applyMathOp(btn.id)}
                className="py-2.5 rounded-lg bg-[#070810] hover:bg-purple-500/20 border border-white/10 text-cyan-200 font-bold cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#0B0D18] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-white">
            Interactive Trigonometric Graph Plotter: y = A · sin(f · x)
          </h3>

          <svg
            viewBox="0 0 400 150"
            className="w-full h-40 bg-[#070810] rounded-lg border border-white/10"
          >
            <line x1="0" y1="75" x2="400" y2="75" stroke="#334155" strokeDasharray="4 4" />
            <polyline
              fill="none"
              stroke="#A855F7"
              strokeWidth="2.5"
              points={wavePoints}
            />
          </svg>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Frequency (f)</span>
                <span className="font-mono text-cyan-300">{graphFreq} cycles</span>
              </div>
              <input
                type="range"
                min={1}
                max={6}
                value={graphFreq}
                onChange={(e) => {
                  setGraphFreq(Number(e.target.value));
                  updateActivityProgress('math-lab', 20, 'add');
                }}
                className="w-full accent-purple-400"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Amplitude (A)</span>
                <span className="font-mono text-cyan-300">{graphAmp} units</span>
              </div>
              <input
                type="range"
                min={10}
                max={65}
                value={graphAmp}
                onChange={(e) => {
                  setGraphAmp(Number(e.target.value));
                  updateActivityProgress('math-lab', 20, 'add');
                }}
                className="w-full accent-purple-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SpaceAndBodyExplorerModule: React.FC<{ mode: 'space' | 'body' }> = ({ mode }) => {
  const { updateActivityProgress } = usePlatform();
  const [selectedPlanet, setSelectedPlanet] = useState(SOLAR_SYSTEM_BODIES[3]);
  const [selectedSystem, setSelectedSystem] = useState(HUMAN_BODY_SYSTEMS[3]);

  if (mode === 'space') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Space Explorer — Solar System Planetary Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select the Sun or any of the 8 planets to inspect orbital distance, surface gravity, atmosphere, and moons
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {SOLAR_SYSTEM_BODIES.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                sound.playClick();
                setSelectedPlanet(b);
                updateActivityProgress('space-explorer', 15, 'add');
              }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedPlanet.id === b.id
                  ? 'bg-purple-500/20 border-purple-400 text-white'
                  : 'bg-[#0B0D18] border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        <div className="bg-[#0B0D18] border border-purple-500/35 rounded-xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-[#070810] rounded-xl border border-white/10">
            <div
              className="w-28 h-28 rounded-full shadow-2xl mb-3"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${selectedPlanet.color}, #090A0F)`
              }}
            />
            <span className="font-display text-lg font-bold text-white">
              {selectedPlanet.name}
            </span>
            <span className="text-xs font-mono text-cyan-300">{selectedPlanet.type}</span>
          </div>

          <div className="md:col-span-8 space-y-4">
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedPlanet.summary}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
                <span className="text-slate-400 block">Distance from Sun</span>
                <span className="font-mono text-white font-semibold">
                  {selectedPlanet.distanceFromSun}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
                <span className="text-slate-400 block">Orbital Period</span>
                <span className="font-mono text-white font-semibold">
                  {selectedPlanet.orbitalPeriod}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
                <span className="text-slate-400 block">Surface Gravity</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {selectedPlanet.gravityMs2} m/s²
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
                <span className="text-slate-400 block">Mean Radius</span>
                <span className="font-mono text-white">{selectedPlanet.radiusKm}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
                <span className="text-slate-400 block">Known Moons</span>
                <span className="font-mono text-white">{selectedPlanet.moons}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#070810] border border-white/10">
                <span className="text-slate-400 block">Atmosphere</span>
                <span className="font-mono text-white">{selectedPlanet.atmosphere}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">
          Human Body Physiological Systems Explorer
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Click any of the 7 major human organ systems to study its organs, physiological mechanism, and clinical data
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {HUMAN_BODY_SYSTEMS.map((sys) => (
          <button
            key={sys.id}
            onClick={() => {
              sound.playClick();
              setSelectedSystem(sys);
              updateActivityProgress('human-body', 15, 'add');
            }}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              selectedSystem.id === sys.id
                ? 'bg-purple-500/20 border-purple-400 text-white'
                : 'bg-[#0B0D18] border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {sys.name}
          </button>
        ))}
      </div>

      <div className="bg-[#0B0D18] border border-purple-500/35 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="font-display text-2xl font-bold text-white">
            {selectedSystem.name}
          </h3>
          <p className="text-xs text-cyan-300 mt-1">{selectedSystem.tagline}</p>
        </div>

        <div className="p-4 rounded-lg bg-[#070810] border border-white/10 text-xs">
          <strong className="text-cyan-400 block mb-1">Primary Organs &amp; Structures:</strong>
          <div className="text-white font-medium">
            {selectedSystem.keyOrgans.join(' · ')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#070810] border border-white/10">
            <strong className="text-cyan-400 block mb-1">Physiological Mechanism:</strong>
            <p className="text-slate-300 leading-relaxed">{selectedSystem.mechanism}</p>
          </div>
          <div className="p-4 rounded-lg bg-[#070810] border border-white/10">
            <strong className="text-emerald-400 block mb-1">Quantitative Clinical Fact:</strong>
            <p className="text-slate-300 leading-relaxed">{selectedSystem.clinicalFact}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
