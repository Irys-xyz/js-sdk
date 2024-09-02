import { Provenance } from "@irys-network/core-bundler-client/provenance";
import type { UploadReceipt } from "@irys-network/core-bundler-client/types";
import type { CreateAndUploadOptions } from "@irys-network/core-bundler-client/types";
import type {BaseNodeIrys} from "./base"
export class NodeProvenance extends Provenance {
  declare irys: BaseNodeIrys;
  constructor(irys: BaseNodeIrys) {
    super(irys);
  }

  public async uploadFile(path: string, opts?: CreateAndUploadOptions): Promise<UploadReceipt> {
    return this.irys.uploadFile(path, { ...opts, upload: { ...opts?.upload } }) as Promise<UploadReceipt>;
  }

  public async uploadFolder(
    path: string,
    {
      batchSize = 10,
      keepDeleted = true,
      indexFile,
      interactivePreflight,
      logFunction,
      manifestTags,
      itemOptions,
    }: {
      batchSize: number;
      keepDeleted: boolean;
      indexFile?: string;
      interactivePreflight?: boolean;
      logFunction?: (log: string) => Promise<void>;
      manifestTags?: { name: string; value: string }[];
      itemOptions?: CreateAndUploadOptions;
    } = { batchSize: 10, keepDeleted: true },
  ): Promise<UploadReceipt & { receipts: Map<string, UploadReceipt> }> {
    return this.irys.uploadFolder(path, {
      batchSize,
      keepDeleted,
      indexFile,
      interactivePreflight,
      logFunction,
      manifestTags,
      itemOptions: { ...itemOptions, upload: { ...itemOptions?.upload } },
    }) as Promise<UploadReceipt & { receipts: Map<string, UploadReceipt> }>;
  }
}
