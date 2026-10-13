import { forecastHistory, parseHistory } from "./forecast";
self.onmessage = (event: MessageEvent<{ text: string }>) => {
  try {
    self.postMessage({
      report: forecastHistory(parseHistory(event.data.text)),
    });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "Riwayat tidak dapat diproses.",
    });
  }
};
