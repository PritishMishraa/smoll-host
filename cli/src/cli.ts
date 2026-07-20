#!/usr/bin/env node

import { defaultIo, runCli } from "./commands.js";

async function main() {
	process.exitCode = await runCli(process.argv.slice(2), defaultIo);
}

void main();
