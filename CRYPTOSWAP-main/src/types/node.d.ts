declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SOLANA_RPC_ENDPOINT?: string;
  }
}

declare const Buffer: {
  from(data: string, encoding?: string): Uint8Array;
  isBuffer(obj: any): boolean;
}; 