// Authoring source for saved reference measurements, not live runtime status.
// One Laya question is not a whole preset: a preset asks several questions and
// also includes tokenization/decoding/HTTP work. Never advertise this as preset latency.
// Re-measure decision inference: python tests/bench_backends.py
// Regenerate published numbers: python scripts/sync-measurements.py

export const MEASURED = {
  date: "2026-10-26",
  asrDate: "2026-10-24",
  machine: "Intel Core Ultra 9 386H",
  runtime: "OpenVINO 2026.4.1, INT8",
  window: "256 tokens, 1 question per request",
  iterations: 40,
  model: {
    parameters: 421293830,
    parameters_millions: 421,
    download_mb: 405,
    window_tokens: 256,
    parameter_source: "https://huggingface.co/api/models/convaiinnovations/laya",
    export_source: "https://huggingface.co/rupeshs/laya-ov-int8",
  },

  // Decision model (Laya), milliseconds per question.
  decision: {
    NPU: { ms: 27.5, compile_s: 14.1 },
    GPU: { ms: 30.8, compile_s: 2.9 },
    CPU: { ms: 142.0, compile_s: 2.7 },
  },

  // Whisper (speech), seconds for this specific saved audio workload.
  asrAudioSeconds: 45.3,
  asr: {
    NPU: { s: 0.79, realtime: 57 },
    CPU: { s: 1.74, realtime: 26 },
    GPU: { s: 2.49, realtime: 18 },
  },

  // Historical pipeline examples from README, separate from the single-question run.
  pipeline: {
    date: "recording date unverified",
    invoice: { audio_s: 45, asr_s: 0.78, decision_s: 0.14, total_s: 0.92, realtime: 49 },
    outage: { audio_s: 6.8, asr_s: 0.24, decision_s: 0.07, total_s: 0.31, realtime: 22 },
    first_request_s: 88,
  },

  // Headline figures used on the Overview and in the social card.
  headline: {
    perQuestionMs: 27.5,
    asrRealtime: 57,
    whisperSizeMb: 85,
    costPerRequest: "$0",
  },
};

export function decisionMs(device: string): number | null {
  const row = MEASURED.decision[device.toUpperCase() as keyof typeof MEASURED.decision];
  return row ? row.ms : null;
}
