export type RootMethod =
  | 'bisection'
  | 'newton'
  | 'secant'
  | 'falsePosition'
  | 'fixedPoint';

export type AngleMode = 'deg' | 'rad';
export type MachineMode = 'chop' | 'round';
export type StoppingKind = 'iterations' | 'epsilon';
export type ToleranceType = 'absolute' | 'relative';
export type DecisionBasis = 'exact' | 'machine';
export type SignDisplay = 'both' | 'exact' | 'machine';
export type MethodGroup = 'bracket' | 'open' | 'fixed-point';
export type FieldKind = 'text' | 'number' | 'select';

export interface MachineConfig {
  k: number;
  mode: MachineMode;
}

export interface StoppingInput {
  kind: StoppingKind;
  value: string | number;
  toleranceType?: ToleranceType;
}

export interface EngineStopping {
  kind: StoppingKind;
  input: string | number;
  epsilon?: number | null;
  epsilonBound?: number | null;
  toleranceType?: ToleranceType;
  iterationsRequired?: number;
  plannedIterations?: number;
  actualIterations?: number;
  maxIterations?: number;
  capReached?: boolean;
}

export interface BisectionOptions {
  expression: string;
  interval: { a: string; b: string };
  machine: MachineConfig;
  stopping: StoppingInput;
  decisionBasis: DecisionBasis;
  signDisplay: SignDisplay;
  angleMode: AngleMode;
}

export interface NewtonOptions {
  expression: string;
  dfExpression: string;
  x0: string;
  machine: MachineConfig;
  stopping: StoppingInput;
  angleMode: AngleMode;
}

export interface SecantOptions {
  expression: string;
  x0: string;
  x1: string;
  machine: MachineConfig;
  stopping: StoppingInput;
  angleMode: AngleMode;
}

export interface FalsePositionOptions {
  expression: string;
  interval: { a: string; b: string };
  machine: MachineConfig;
  stopping: StoppingInput;
  decisionBasis: DecisionBasis;
  signDisplay: SignDisplay;
  angleMode: AngleMode;
}

export interface FixedPointOptions {
  gExpression: string;
  x0: string;
  machine: MachineConfig;
  stopping: StoppingInput;
  angleMode: AngleMode;
}

export interface RootSummary {
  approximation: unknown | null;
  intervalStatus?: string | null;
  stopReason?: string | null;
  residual?: unknown | null;
  residualBasis?: string | null;
  error?: number | null;
  bound?: number | null;
  stopDetail?: string;
}

export interface IterationRow {
  iteration: number;
  note?: string;
  error?: number | null;
  [key: string]: unknown;
}

export interface RootWarning {
  code: string;
  message: string;
}

export interface RootRunResult {
  method: RootMethod;
  expression?: string;
  dfExpression?: string;
  canonical?: string;
  machine?: MachineConfig;
  stopping?: EngineStopping;
  summary?: RootSummary;
  initial?: {
    note?: string;
    hasDisagreement?: boolean;
    [key: string]: unknown;
  } | null;
  decisionBasis?: DecisionBasis | null;
  signDisplay?: SignDisplay | null;
  rows?: IterationRow[];
  warnings?: RootWarning[];
  /** Unix ms timestamp set when the engine produces this result. */
  completedAt?: number;
  [key: string]: unknown;
}

export type MethodFormState = Record<string, string>;

export interface SelectOption {
  value: string;
  label: string;
}

export interface MethodFieldConfig {
  id: string;
  label: string;
  kind: FieldKind;
  defaultValue: string;
  placeholder?: string;
  options?: SelectOption[];
  advanced?: boolean;
  when?: (formState: MethodFormState) => boolean;
}

export interface MethodConfig {
  method: RootMethod;
  label: string;
  shortLabel: string;
  group: MethodGroup;
  summary: string;
  details: string;
  expressionLabel: string;
  expressionFieldId: string;
  runLabel: string;
  fields: MethodFieldConfig[];
  tableHeaders: string[];
}

export type RunFreshness = 'empty' | 'current' | 'stale';

export interface RunRequestSnapshot {
  method: RootMethod;
  angleMode: AngleMode;
  values: MethodFormState;
}

export interface StoredRunState {
  result: RootRunResult;
  request: RunRequestSnapshot;
}

export interface DisplayedRunState {
  run: RootRunResult | null;
  request: RunRequestSnapshot | null;
  freshness: RunFreshness;
  staleReason: string | null;
  hasCompareEntry: boolean;
}

export interface WorkbenchStatus {
  kind: 'idle' | 'loading' | 'ready' | 'error';
  message: string;
}

export interface FixedPointCandidate {
  id: string;
  label: string;
  expression: string;
}

export interface FixedPointRankingBlock {
  targetLabel: string;
  targetValue?: number;
  initialValue: string;
  candidates: FixedPointCandidate[];
}

export interface RootPreset {
  id: string;
  label: string;
  group: string;
  method: RootMethod;
  fields: MethodFormState;
  description: string;
  guardedFieldIds: string[];
  ranking?: FixedPointRankingBlock;
}

export type FixedPointOutcomeKind =
  | 'convergent'
  | 'diverged'
  | 'cycle'
  | 'stalled'
  | 'undefined'
  | 'other';

export interface FixedPointCandidateRun {
  candidate: FixedPointCandidate;
  result: RootRunResult | null;
  errorMessage?: string;
}

export interface FixedPointComparisonRow {
  candidate: FixedPointCandidate;
  outcome: FixedPointOutcomeKind;
  rank: number | null;
  iterations: number;
  finalValue: unknown | null;
  finalStep: unknown | null;
  stopReason: string | null;
  note: string;
}

export interface FixedPointComparisonResult {
  targetLabel: string;
  initialValue: string;
  rows: FixedPointComparisonRow[];
}
