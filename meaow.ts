import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url"; // Required for Windows compatibility with dynamic import

// parse arguments
let args = process.argv.slice(2);
const command = args[0];
args = args.slice(1);

// target command ts file lookup
function get_file(name: string) {
    // Resolve to absolute path for reliable importing
    const file = path.resolve("./infra/commands", `${name}.ts`);
    if (fs.existsSync(file)) return file;
    return null;
}

// Main executing function
// Must be async to use dynamic import
async function main() {
    try {
        const file = get_file(command);
        if (!file) {
            console.error(`Command "${command}" not found`);
            process.exit(1);
        }

        // 1. Convert path to file URL (required for dynamic import on Windows/Node ESM)
        const fileUrl = pathToFileURL(file).href;

        // 2. Dynamic Import
        // tsx handles the compilation of the imported TS file automatically
        const module = await import(fileUrl);

        // 3. Execute the default export
        if (typeof module.default === 'function') {
            await module.default(args);
        } else {
            console.error(`Error: ${command}.ts does not have a default export function.`);
            process.exit(1);
        }
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
