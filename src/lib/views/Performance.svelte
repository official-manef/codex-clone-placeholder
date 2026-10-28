<script lang="ts">
  import View from "#lib/View.svelte";
  import { MEASURED } from "#lib/measured.js";
  const ROWS = Object.entries(MEASURED.decision).map(([label, v]) => ({
    label,
    ms: v.ms,
    compile: v.compile_s,
  }));
  const CPU_RATIO = (MEASURED.decision.CPU.ms / MEASURED.decision.NPU.ms).toFixed(1);
  const AUDIO_RATIO = (MEASURED.asr.GPU.s / MEASURED.asr.NPU.s).toFixed(1);
</script>

<View
  title="Benchmarks"
  icon="gauge"
  subtitle={`Recorded reference results from ${MEASURED.date} on ${MEASURED.machine}. These are saved measurements, not a live test of your laptop.`}
>
  <h2 class="mb-2 text-[15px] font-semibold">Laya decisions · lower is faster</h2>
  <p class="mb-4 max-w-[70ch] text-[12px] leading-relaxed text-ink-2">
    {MEASURED.runtime}; {MEASURED.window}. Warm latency excludes the initial compile. A preset
    containing several questions runs them separately, so its total is longer.
  </p>
  <div class="card overflow-x-auto">
    <table class="w-full min-w-[420px] text-left text-[13px]">
      <caption class="sr-only">Saved Laya decision benchmark</caption><thead
        class="bg-panel-2 text-ink-2"
        ><tr
          ><th scope="col" class="px-4 py-3 font-medium">Device</th><th
            scope="col"
            class="px-4 py-3 font-medium">Warm question</th
          ><th scope="col" class="px-4 py-3 font-medium">First compile</th></tr
        ></thead
      ><tbody
        >{#each ROWS as r}<tr class="border-t border-line"
            ><th scope="row" class="px-4 py-3 font-medium">{r.label}</th><td class="mono px-4 py-3"
              >{r.ms.toFixed(1)} ms</td
            ><td class="mono px-4 py-3">{r.compile} s</td></tr
          >{/each}</tbody
      >
    </table>
  </div>
  <p class="mt-3 max-w-[70ch] text-[12px] leading-relaxed text-ink-2">
    On this recorded run, CPU took about {CPU_RATIO}× as long as NPU for a warm question. Initial
    compilation took longer on NPU. Power draw and sustained concurrent throughput were not measured
    by this table.
  </p>
  <h2 class="mt-6 mb-2 text-[15px] font-semibold">Whisper speech recognition</h2>
  <p class="mb-3 text-[12px] text-ink-2">
    Recorded {MEASURED.asrDate}: inference time for a 45.3-second audio sample with Whisper base
    INT8.
  </p>
  <div class="card overflow-x-auto">
    <table class="w-full min-w-[420px] text-left text-[13px]">
      <caption class="sr-only">Saved Whisper speech benchmark</caption><thead
        class="bg-panel-2 text-ink-2"
        ><tr
          ><th scope="col" class="px-4 py-3 font-medium">Device</th><th
            scope="col"
            class="px-4 py-3 font-medium">Inference time</th
          ><th scope="col" class="px-4 py-3 font-medium">Realtime factor</th></tr
        ></thead
      ><tbody
        >{#each Object.entries(MEASURED.asr) as [device, row]}<tr class="border-t border-line"
            ><th scope="row" class="px-4 py-3 font-medium">{device}</th><td class="mono px-4 py-3"
              >{row.s.toFixed(2)} s</td
            ><td class="mono px-4 py-3">{row.realtime}× realtime</td></tr
          >{/each}</tbody
      >
    </table>
  </div>
  <p class="mt-3 max-w-[70ch] text-[12px] leading-relaxed text-ink-2">
    NPU processed this audio about {AUDIO_RATIO}× faster than GPU. Different models and inputs can
    change the ranking. Chat generation is a separate workload;
    <a class="text-link" href="#chat">Local chat</a> reports actual response time and generated tokens
    per second.
  </p>
  <details class="mt-6 text-[12px] text-ink-2">
    <summary>Reproduce the measurements</summary>
    <p class="mt-2 leading-relaxed">
      Run <code class="mono">python tests/bench_backends.py</code> from the project on the machine being
      measured. NPU access requires the Windows host and a supported driver. Compilation caches and competing
      workloads affect results.
    </p>
  </details>
</View>
