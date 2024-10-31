import * as fs from "fs";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { renderFile } from "template-file";
import { glob } from "fast-glob";
import { Command } from "commander";

const CONTRACTS_DIR = "contracts";
const OUTPUT_DIR = "contracts-preprocessed";

const params = {
  SYSTEM_CONTRACTS_OFFSET: "0x8000",
};

async function preprocess(testMode: boolean) {
  if (testMode) {
    console.log("\x1b[31mWarning: test mode for the preprocessing being used!\x1b[0m");
    params.SYSTEM_CONTRACTS_OFFSET = "0x9000";
  }
  const substring = "uint160 constant SYSTEM_CONTRACTS_OFFSET = 0x8000;"
  const replacingSubstring = `uint160 constant SYSTEM_CONTRACTS_OFFSET = ${params.SYSTEM_CONTRACTS_OFFSET};`

  const contracts = await glob(
    [`${CONTRACTS_DIR}/**/*.sol`, `${CONTRACTS_DIR}/**/*.yul`, `${CONTRACTS_DIR}/**/*.zasm`],
    { onlyFiles: true }
  );

  for (const contractPath of contracts) {
    let contract = fs.readFileSync(contractPath,'utf8');
    const preprocessed = await contract.replace(substring, replacingSubstring);
    const fileName = `${OUTPUT_DIR}/${contractPath.slice(CONTRACTS_DIR.length)}`;
    const directory = path.dirname(fileName);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    writeFileSync(fileName, preprocessed);
  }

  console.log("System Contracts preprocessing done!");
}

async function main() {
  const program = new Command();

  program.version("0.1.0").name("system contracts preprocessor").description("preprocess the system contracts");

  program.option("--test-mode").action(async (cmd) => {
    await preprocess(cmd.testMode);
  });

  await program.parseAsync(process.argv);
}

main();
