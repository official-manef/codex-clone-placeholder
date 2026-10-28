/** Release every microphone track, even if a driver throws while stopping one. */
export function releaseMicrophone(stream: Pick<MediaStream, "getTracks"> | null): void {
  for (const track of stream?.getTracks() ?? []) {
    try {
      track.stop();
    } catch {
      /* Continue releasing the remaining tracks. */
    }
  }
}

/** A permission dialog can resolve after cancellation, navigation, or a newer request. */
export async function acquireMicrophone(
  request: () => Promise<MediaStream>,
  stillCurrent: () => boolean,
): Promise<MediaStream | null> {
  const stream = await request();
  if (!stillCurrent()) {
    releaseMicrophone(stream);
    return null;
  }
  return stream;
}

export function recordingMime(isSupported: (mime: string) => boolean): string | undefined {
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find(isSupported);
}
