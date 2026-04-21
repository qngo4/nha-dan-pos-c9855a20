# Service layer

UI components import ONLY from `@/services` and `@/services/types`.
Direct `localStorage` access is forbidden outside `src/services/adapters/local/**`.

To swap to a real backend (EC2), implement the same interfaces under
`src/services/adapters/api/*` and replace the singletons in
`src/services/index.ts`. UI screens require no changes.
