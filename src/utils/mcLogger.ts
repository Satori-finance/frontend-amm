function genLogger(handler: Function, category: string, module: string, info: any[]) {
  handler(
    `%c${category} %c${module}`,
    'background:red;color:white;font-weight:bold;padding:0 8px;',
    'background:blue;color:white;font-weight:bold;margin-left: 10px;padding:0 8px;',
    ...info,
  )
}

interface Logger {
  error: (...info: any[]) => void
  log: (...info: any[]) => void
}

export function mcLogger(category: string, module: string): Logger {
  return {
    error: (...info: any[]) => {
      return genLogger(console.error, category, module, info)
    },
    log: (...info: any[]) => {
      return genLogger(console.log, category, module, info)
    },
  }
}
