export interface MockHandlerResult {
  data?: unknown;
  error?: { status: number; message: string };
}

export type MockHandler = (
  endpoint: string,
  method: string,
  body?: unknown
) => MockHandlerResult | null | Promise<MockHandlerResult | null>;
