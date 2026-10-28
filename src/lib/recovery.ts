export type RecoveryLink = { label: string; href: string };

/** Recovery choices are navigation only. No failed write or download is retried here. */
export function recoveryFor(message: string): {
  hint: string;
  links: RecoveryLink[];
  reload: boolean;
} {
  if (/recording limit.*reach/i.test(message))
    return {
      hint: "Choose an old run in Saved recordings and use Delete recording. Confirm only after reviewing it, then start a new run.",
      links: [],
      reload: false,
    };
  if (/captcha|automated.traffic|consent prompt|google.*blocked/i.test(message))
    return {
      hint: "The external site blocked this browser run. Review the recording, try again later, or choose Windows RPA for the installed Solitaire app.",
      links: [],
      reload: false,
    };
  if (/native|Solitaire|local OCR|Windows.*app|observed Hint|accessibility tree/i.test(message))
    return {
      hint: "Open the Windows game, dismiss any prompt yourself, and keep its window visible. Review the captured frame before starting a new attempt. Uncertain observations stop without a click.",
      links: [{ label: "Windows RPA", href: "#apps" }],
      reload: false,
    };
  if (/401|unauthori[sz]ed|bearer|access token/i.test(message))
    return { hint: "Reload the app to refresh its access token.", links: [], reload: true };
  if (
    /fetch|network|connection|cannot reach|disconnected|failed to load|server.*unavailable/i.test(
      message,
    )
  )
    return {
      hint: "Check the server connection. If this is an old test tab, open the installed app.",
      links: [{ label: "Open installed app", href: "http://127.0.0.1:8649/" }],
      reload: true,
    };
  if (
    /not verified for|unsupported.*device|unavailable.*device|device.*unavailable|compile|driver/i.test(
      message,
    )
  )
    return {
      hint: "Check the selected model and device. A different device is used only when you choose it.",
      links: [
        { label: "Compute & devices", href: "#backends" },
        { label: "Setup check", href: "#setup" },
      ],
      reload: false,
    };
  if (
    /not installed|missing|pip install|openvino|numpy|tokenizer|not set|no .*model/i.test(message)
  )
    return {
      hint: "Open Setup to install missing packages and check model files, then restart Laya.",
      links: [
        { label: "Fix setup", href: "#setup" },
        { label: "Decision models", href: "#models" },
      ],
      reload: false,
    };
  if (/expired|preview|destination.*occupied|already exists/i.test(message))
    return {
      hint: "Review a fresh preview before approving this operation again.",
      links: [],
      reload: false,
    };
  if (/busy|already running|operation.*progress|429|rate limit|too many requests/i.test(message))
    return {
      hint: "Wait for the current operation to finish, or stop it before trying again.",
      links: [],
      reload: false,
    };
  if (/microphone|permission|denied/i.test(message))
    return {
      hint: "Check the browser's permission for this site, then use the record control again.",
      links: [],
      reload: false,
    };
  if (/context|token.*limit|too many messages|conversation.*full/i.test(message))
    return {
      hint: "Shorten the message or start a new chat. Your saved conversation is preserved.",
      links: [{ label: "Open Chat", href: "#chat" }],
      reload: false,
    };
  return {
    hint: "Your input is preserved. Check the settings or correct the input before trying again.",
    links: [{ label: "Setup check", href: "#setup" }],
    reload: false,
  };
}
