export type ExistingHistory = { operation: string; commit: string };
export type AdoptionRequest = { request_id: string; source: ExistingHistory };
export type AdoptionStatus = {
  source_unavailable?: boolean;
  source: ExistingHistory | null;
  pending: AdoptionRequest | null;
};
export interface AdoptionService {
  status(): Promise<AdoptionStatus>;
  adopt(request: AdoptionRequest): Promise<AdoptionStatus>;
  stop(id: string): Promise<AdoptionStatus>;
}
export interface AdoptionRecovery {
  load(): Promise<AdoptionRequest | undefined>;
  save(request: AdoptionRequest | undefined): Promise<void>;
}
export function existingHistory(value: unknown): ExistingHistory {
  const source = value as ExistingHistory;
  if (
    !source ||
    typeof source.operation !== "string" ||
    typeof source.commit !== "string" ||
    !/^[a-f0-9]{128}$/.test(source.operation) ||
    !/^[a-f0-9]{40}$/.test(source.commit)
  )
    throw new Error("Invalid original history selection");
  return source;
}
export function adoptionRequest(value: unknown): AdoptionRequest {
  const request = value as AdoptionRequest;
  if (
    !request ||
    typeof request.request_id !== "string" ||
    !/^[a-zA-Z0-9-]{1,128}$/.test(request.request_id)
  )
    throw new Error("Invalid original history import request");
  return {
    request_id: request.request_id,
    source: existingHistory(request.source),
  };
}
export type AdoptionState = {
  busy: boolean;
  phase: string;
  data?: AdoptionStatus;
  request?: AdoptionRequest;
};
