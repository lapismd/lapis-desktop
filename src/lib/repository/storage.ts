export type StorageLocation = "external" | "colocated";
export type StorageStatus = {
  repositoryPath?: string;
  canReveal?: boolean;
  revision: number;
  location: StorageLocation;
  pending: {
    request_id: string;
    location: StorageLocation;
    phase: string;
  } | null;
};
export interface StorageService {
  status(): Promise<StorageStatus>;
  change(
    revision: number,
    location: StorageLocation,
    requestId: string,
  ): Promise<StorageStatus>;
  recover(): Promise<StorageStatus>;
  rollback(requestId: string): Promise<StorageStatus>;
  reveal?(revision: number): Promise<StorageStatus>;
  reload(): Promise<void>;
}
export type StorageState = {
  busy: boolean;
  phase: string;
  data?: StorageStatus;
  needsReload: boolean;
};
