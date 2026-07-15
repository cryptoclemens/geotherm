import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generat von `npm run test:coverage` (v8-Reporter). Nicht im Repo (.gitignore),
    // aber lokal lintbar: Wer erst Tests, dann Lint fährt, bekam sonst eine Warnung
    // aus fremdem Generat. In der CI fällt es nur deshalb nicht auf, weil Lint dort
    // VOR test:coverage läuft — Reihenfolge, kein Schutz.
    'coverage/**',
    // GPA-Migration: JSX→TSX Konvertierungen, werden in M3 schrittweise getypt
    'src/apps/gpa/components/**',
  ]),
]);

export default eslintConfig;
