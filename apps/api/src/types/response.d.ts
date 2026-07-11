/**
 * Augment the global Response type for Vercel's Node.js environment.
 * @types/node 26.1.1 on Vercel's build machines doesn't expose
 * the standard Fetch API Response properties (.ok, .status, .json(), etc.).
 */
declare global {
  interface Response {
    ok: boolean;
    status: number;
    statusText: string;
    json(): Promise<any>;
    text(): Promise<string>;
    blob(): Promise<Blob>;
    arrayBuffer(): Promise<ArrayBuffer>;
  }
}

export {};
