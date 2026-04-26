declare module 'node:fs' {
  export function readFileSync(path: string, encoding: string): string;
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
}

declare module 'node:vm' {
  const vm: {
    createContext(sandbox: Record<string, unknown>): unknown;
    runInContext(source: string, context: unknown, options: { filename: string }): void;
  };

  export default vm;
}

declare const process: {
  cwd(): string;
};
