export function setExplorerMenuEnabled(
  details: HTMLDetailsElement,
  trigger: HTMLElement,
  enabled: boolean
): void {
  details.inert = !enabled;
  details.setAttribute('aria-disabled', String(!enabled));
  trigger.setAttribute('aria-disabled', String(!enabled));
  if (!enabled) details.open = false;
}
