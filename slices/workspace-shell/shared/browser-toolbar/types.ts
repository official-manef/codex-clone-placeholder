import type { WorkspaceMenuItem } from "../menu/index.js";

/** Each control is provided by its host; this component never opens or controls a browser itself. */
export type BrowserToolbarAction = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
};

export type BrowserToolbarConfig = {
  back?: BrowserToolbarAction;
  forward?: BrowserToolbarAction;
  reload?: BrowserToolbarAction;
  annotate?: BrowserToolbarAction & { pressed?: boolean };
  addressLabel: string;
  addressPlaceholder?: string;
  addressDescribedBy?: string;
  submitLabel: string;
  onSubmit?: (value: string) => void;
  addressDisabled?: boolean;
  menuLabel?: string;
  menu?: readonly WorkspaceMenuItem[];
};
