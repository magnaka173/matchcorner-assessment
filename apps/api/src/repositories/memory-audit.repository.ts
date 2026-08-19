import type {
  AuditRepository,
  SaveConversionRunInput,
  SaveSlipSnapshotInput
} from "./audit.repository.js";

/** Test double. Not used by the production composition root. */
export class InMemoryAuditRepository implements AuditRepository {
  readonly snapshots: SaveSlipSnapshotInput[] = [];
  readonly conversionRuns: SaveConversionRunInput[] = [];

  async saveSlipSnapshot(input: SaveSlipSnapshotInput): Promise<void> {
    this.snapshots.push(structuredClone(input));
  }

  async saveConversionRun(input: SaveConversionRunInput): Promise<void> {
    this.conversionRuns.push(structuredClone(input));
  }
}
