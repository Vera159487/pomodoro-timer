export {}

declare global {
  interface Window {
    electronAPI: {
      setAlwaysOnTop: (flag: boolean) => Promise<boolean>
      getAlwaysOnTop: () => Promise<boolean>
      minimizeToTray: () => Promise<void>
    }
  }
}
