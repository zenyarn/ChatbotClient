declare module 'ai' {
  export interface OpenAIStreamCallbacks {
    onStart?: () => void;
    onToken?: (token: string) => void;
    onCompletion?: (completion: string) => void;
    onFinal?: (completion: string) => void;
  }

  export function OpenAIStream(
    response: any,
    callbacks?: OpenAIStreamCallbacks
  ): ReadableStream;

  export function StreamingTextResponse(
    stream: ReadableStream,
    init?: ResponseInit
  ): Response;
} 