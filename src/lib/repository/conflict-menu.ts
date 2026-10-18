export const conflictMenuContext = Symbol("conflict-surface-menu");
export type ConflictMenuState = (id: symbol, open: boolean) => void;
