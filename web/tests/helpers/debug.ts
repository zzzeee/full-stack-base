export const printOutput = (...args: any[]) => {
    const strArgs = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    process.stdout.write(strArgs + '\n')
}