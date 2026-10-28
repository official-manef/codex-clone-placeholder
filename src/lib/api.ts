// All views use the same token-aware transport.
export { api } from "./http";

export type BackendOpts = {
  backend?: string;
  byokUrl?: string;
  byokKey?: string;
  byokModel?: string;
};
