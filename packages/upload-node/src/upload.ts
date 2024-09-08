import type { PathLike } from "fs";
import { promises, createReadStream, createWriteStream } from "fs";
import type { CreateAndUploadOptions, Token, IrysTransactonCtor, UploadReceipt, UploadResponse, Tags } from "@irys/upload-core";
import {Uploader, Api, Utils} from "@irys/upload-core"
import mime from "mime-types";
import inquirer from "inquirer";
import { Readable } from "stream";
import type { DataItem } from "@irys/bundles";
import { basename, join, relative, resolve, sep } from "path";
import {parse} from "csv-parse";
import {stringify} from "csv-stringify";

export const checkPath = async (path: PathLike): Promise<boolean> => {
  return promises
    .stat(path)
    .then((_) => true)
    .catch((_) => false);
};

export class NodeUploader extends Uploader {
  constructor(api: Api, utils: Utils, token: string, tokenConfig: Token, irysTx: IrysTransactonCtor) {
    super(api, utils, token, tokenConfig, irysTx);
  }
  /**
   * Uploads a file to the bundler
   * @param path to the file to be uploaded
   * @returns the response from the bundler
   */
  public async uploadFile(path: string, opts?: CreateAndUploadOptions): Promise<UploadResponse> {
    if (
      !(await promises
        .stat(path)
        .then((_) => true)
        .catch((_) => false))
    ) {
      throw new Error(`Unable to access path: ${path}`);
    }
    // don't add Content-type tag if it already exists
    const hasContentTypeTag = opts?.tags && opts.tags.some((t) => t.name.toLowerCase() === "content-type");
    const mimeType = mime.contentType(mime.lookup(path) || "application/octet-stream");

    (opts ??= {}).tags = (hasContentTypeTag || mimeType === false)
      ? opts.tags ?? []
      : [{ name: "Content-Type", value: this.contentTypeOverride ?? mimeType }, ...(opts?.tags ?? [])];

    const data = createReadStream(path);

    return await this.uploadData(data, opts);
  }

  public async *walk(dir: string): AsyncGenerator<string, void, any> {
    for await (const d of await promises.opendir(dir)) {
      const entry = join(dir, d.name);
      if (d.isDirectory()) yield* await this.walk(entry);
      else if (d.isFile()) yield entry;
    }
  }

  /**
   * Preprocessor for folder uploads, ensures the rest of the system has a correct operating environment.
   * @param path - path to the folder to be uploaded
   * @param indexFile - path to the index file (i.e index.html)
   * @param batchSize - number of items to upload concurrently
   * @param interactivePreflight - whether to interactively prompt the user for confirmation of upload (CLI ONLY)
   * @param keepDeleted - Whether to keep previously uploaded (but now deleted) files in the manifest
   * @param logFunction - for handling logging from the uploader for UX
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
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
  ): Promise<((UploadResponse | UploadReceipt) & { receipts?: Map<string, UploadReceipt> | undefined }) | undefined> {
    path = resolve(path);
    const alreadyProcessed = new Map();

    const receiptTxs = new Map();

    if (!(await checkPath(path))) {
      throw new Error(`Unable to access path: ${path}`);
    }

    // fallback to console.log if no logging function is given and interactive preflight is on.
    if (!logFunction && interactivePreflight) {
      logFunction = async (log): Promise<void> => {
        console.log(log);
      };
    } else if (!logFunction) {
      // blackhole logs
      logFunction = async (_: any): Promise<any> => {
        return;
      };
    }

    // manifest with folder name placed in parent directory of said folder - keeps contamination down.
    const manifestPath = join(join(path, `${sep}..`), `${basename(path)}-manifest.csv`);
    const csvHeader = "path,id,receipt\n";
    if (await checkPath(manifestPath)) {
      const rstrm = createReadStream(manifestPath);
      // check if empty
      if ((await promises.stat(manifestPath)).size === 0) {
        await promises.writeFile(manifestPath, csvHeader);
      }
      // validate header
      await new Promise((res) => {
        createReadStream(manifestPath).once("data", async (d) => {
          const fl = d.toString().split("\n")[0];
          if (`${fl}\n` !== csvHeader) {
            await promises.writeFile(manifestPath, csvHeader);
          }
          res(d);
        });
      });
      const csvStream = Readable.from(rstrm.pipe(parse({ delimiter: ",", columns: true })));

      for await (const record of csvStream) {
        record as { path: string; id: string; receipt: string };
        if (record.path && record.id) {
          alreadyProcessed.set(record.path, record.id);
          receiptTxs.set(record.path, JSON.parse(record.receipt));
        }
      }
    } else {
      await promises.writeFile(manifestPath, csvHeader);
    }

    const files = [] as any[];
    let total = 0;
    let i = 0;
    for await (const f of this.walk(path)) {
      const relPath = relative(path, f);
      if (!alreadyProcessed.has(relPath)) {
        files.push(f);
        total += (await promises.stat(f)).size;
      } else {
        alreadyProcessed.delete(relPath);
      }
      if (++i % batchSize == 0) {
        logFunction(`Checked ${i} files...`);
      }
    }

    if (!keepDeleted) {
      alreadyProcessed.clear();
    }
    // pass as param otherwise it thinks logFunction can be undef
    const uploadManifest = async (logFunction: (log: string) => Promise<void>): Promise<UploadResponse> => {
      // generate JSON
      await logFunction("Generating JSON manifest...");
      const jsonManifestPath = await this.generateManifestFromCsv(path, alreadyProcessed, indexFile);
      // upload the manifest
      await logFunction("Uploading JSON manifest...");
      const tags = [
        { name: "Type", value: "manifest" },
        { name: "Content-Type", value: "application/x.irys-manifest+json" },
        ...(manifestTags ?? []),
      ];
      const mres = await this.uploadData(createReadStream(jsonManifestPath), { tags }).catch((e) => {
        throw new Error(`Failed to upload manifest: ${e.message}`);
      });
      await logFunction("Done!");
      if (mres?.id) {
        await promises.writeFile(join(join(path, `${sep}..`), `${basename(path)}-id.txt`), JSON.stringify(mres));
      } else {
        throw new Error(`Unable to get upload ID! ${JSON.stringify(mres)}`);
      }
      return mres;
    };

    // TODO: add logic to detect changes (MD5/other hash)
    if (files.length == 0 && alreadyProcessed.size === 0) {
      logFunction("No items to process");
      // return the txID of the upload
      const idpath = join(join(path, `${sep}..`), `${basename(path)}-id.txt`);
      if (await checkPath(idpath)) {
        return JSON.parse(await promises.readFile(idpath, "utf-8")) as UploadResponse;
      }
      // assume manifest wasn't uploaded
      return await uploadManifest(logFunction);
    }

    // const zprice = (await this.utils.getPrice(this.currency, 0)).multipliedBy(files.length);

    // const price = (await this.utils.getPrice(this.currency, total)).plus(zprice).toFixed(0);

    const price = await this.utils.estimateFolderPrice({ fileCount: files.length, totalBytes: total });

    if (interactivePreflight) {
      if (
        !(await confirmation(
          `Authorize upload?\nTotal amount of data: ${total} bytes over ${files.length} files - cost: ${price} ${
            this.tokenConfig.base[0]
          } (${this.utils.fromAtomic(price).toFixed()} ${this.token})\n Y / N`,
        ))
      ) {
        throw new Error("Confirmation failed");
      }
    }

    const stringifier = stringify({
      header: false,
      columns: {
        path: "path",
        id: "id",
        receipt: "receipt",
      },
    });
    const wstrm = createWriteStream(manifestPath, { flags: "a+" });
    stringifier.pipe(wstrm);

    const processor = async (data: any): Promise<void> => {
      if (data?.res?.id) {
        const receipt = data.res.signature
          ? {
              id: data.res.id,
              block: data.res.block,
              deadlineHeight: data.res.deadlineHeight,
              public: data.res.public,
              signature: data.res.signature,
              timestamp: data.res.timestamp,
              validatorSignatures: data.res.validatorSignatures,
              version: data.res.version,
            }
          : {};
        receiptTxs.set(relative(path, data.item), receipt);
        stringifier.write([relative(path, data.item), data.res.id, JSON.stringify(receipt)]);
      }
    };

    const processingResults = await this.concurrentUploader(files, {
      concurrency: batchSize,
      resultProcessor: processor,
      logFunction,
      itemOptions,
    });

    if (processingResults.errors.length > 0) {
      await logFunction(`${processingResults.errors.length} Errors detected, skipping manifest upload...`);
      const ewstrm = createWriteStream(join(join(path, `${sep}..`), `${basename(path)}-errors.txt`), { flags: "a+" });
      ewstrm.write(`Errors from upload at ${new Date().toString()}:\n`);
      processingResults.errors.forEach((e) => ewstrm.write(`${e?.stack ?? JSON.stringify(e)}\n`));
      await new Promise((res) => ewstrm.close(res));
      throw new Error(`${processingResults.errors.length} Errors detected - check ${basename(path)}-errors.txt for more information.`);
    }
    await logFunction(`Finished processing ${files.length} Items`);

    await new Promise((r) => wstrm.close(r));

    return await uploadManifest(logFunction);
  }

  /**
   * processes an item to convert it into a DataItem, and then uploads it.
   * @param item can be a string value, a path to a file, a Buffer of data or a DataItem
   * @returns A dataItem
   */
  protected async processItem(item: string | Buffer | Readable | DataItem, opts?: CreateAndUploadOptions): Promise<any> {
    if (this.bundles.DataItem.isDataItem(item)) {
      return this.uploadTransaction(item, { ...opts?.upload });
    }

    let tags: Tags = []
    if (typeof item === "string") {
      if (await checkPath(item)) {
        const mimeType = mime.contentType(mime.lookup(item) || "application/octet-stream");
        if(mimeType) tags = [{ name: "Content-Type", value: this.contentTypeOverride ?? mimeType }];
        // returnVal = item;
        item = createReadStream(item);
      } else {
        item = Buffer.from(item);
        if (this.contentTypeOverride) {
          tags = [{ name: "Content-Type", value: this.contentTypeOverride }];
        }
      }
    }
    return this.uploadData(item, { ...opts, tags: [...tags, ...(opts?.tags ?? [])] });
  }

  /**
   * Stream-based CSV parser and JSON assembler
   * @param path base path of the upload
   * @param indexFile optional path to an index file
   * @returns the path to the generated manifest
   */
  public async generateManifestFromCsv(path: string, nowRemoved?: Map<string, true>, indexFile?: string): Promise<string> {
    const csvstrm = parse({ delimiter: ",", columns: true });
    const csvPath = join(join(path, `${sep}..`), `${basename(path)}-manifest.csv`);
    const manifestPath = join(join(path, `${sep}..`), `${basename(path)}-manifest.json`);
    const wstrm = createWriteStream(manifestPath, { flags: "w+" });
    createReadStream(csvPath).pipe(csvstrm); // pipe csv
    /* eslint-disable quotes */
    // "header"
    wstrm.write(`{\n"manifest": "irys/paths",\n"version": "0.1.0",\n"paths": {\n`);
    const csvs = Readable.from(csvstrm);
    let firstValue = true;

    for await (const d of csvs) {
      if (nowRemoved?.has(d.path)) {
        nowRemoved.delete(d.path);
        continue;
      }
      const prefix = firstValue ? "" : ",\n";
      wstrm.write(`${prefix}"${d.path.replaceAll("\\", "/")}":{"id":"${d.id}"}`);
      firstValue = false;
    }
    // "trailer"
    wstrm.write(`\n}`);
    // add index
    if (indexFile) {
      wstrm.write(`,\n"index":{"path":"${indexFile.replaceAll("\\", "/")}"}`);
    }

    wstrm.write(`\n}`);
    await new Promise((r) => wstrm.close(r));
    return manifestPath;
  }
}

async function confirmation(message: string): Promise<boolean> {
  const answers = await inquirer.prompt([{ type: "input", name: "confirmation", message }]);
  return answers.confirmation.toLowerCase() == "y";
}

export default NodeUploader;
