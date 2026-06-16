import fs from "fs";
import path from "path";
import { Compiler } from "inkjs/full";

const storiesDir = path.join(process.cwd(), "src/ink/stories");
const watch = process.argv.includes("--watch");

function compileAll() {
  if (!fs.existsSync(storiesDir)) {
    console.log("No stories directory found");
    return;
  }

  const files = fs.readdirSync(storiesDir).filter((f) => f.endsWith(".ink"));
  let count = 0;

  for (const file of files) {
    const inkPath = path.join(storiesDir, file);
    const jsonPath = path.join(storiesDir, file.replace(".ink", ".json"));
    const source = fs.readFileSync(inkPath, "utf-8");
    const compiler = new Compiler(source);
    const story = compiler.Compile();
    if (compiler.errors.length > 0) {
      console.error(`Errors in ${file}:`, compiler.errors);
      continue;
    }
    fs.writeFileSync(jsonPath, story.ToJson(), "utf-8");
    count++;
  }

  console.log(`Compiled ${count} ink stories`);
}

compileAll();

if (watch) {
  console.log("Watching ink files...");
  fs.watch(storiesDir, { recursive: false }, () => {
    compileAll();
  });
}
