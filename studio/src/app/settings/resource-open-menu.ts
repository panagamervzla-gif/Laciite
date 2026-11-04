const settingKey = 'laccite.showResourceMenuOnActivation';

export function getShowResourceMenuOnActivation(): boolean {
  return localStorage.getItem(settingKey) !== 'false';
}

export function setShowResourceMenuOnActivation(enabled: boolean): void {
  localStorage.setItem(settingKey, String(enabled));
}
