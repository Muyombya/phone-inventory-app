const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const backendRoot = path.resolve(__dirname, "..");

function getJavaScriptFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git"
    ) {
      continue;
    }

    const fullPath = path.join(
      directory,
      entry.name
    );

    if (entry.isDirectory()) {
      files.push(
        ...getJavaScriptFiles(fullPath)
      );
      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(".js")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

const files =
  getJavaScriptFiles(backendRoot);

console.log(
  `Checking ${files.length} backend JavaScript files...`
);

for (const file of files) {
  try {
    execFileSync(
      process.execPath,
      ["--check", file],
      {
        stdio: "pipe",
      }
    );
  } catch (error) {
    console.error(
      `\nSyntax error in: ${path.relative(
        backendRoot,
        file
      )}\n`
    );

    if (error.stderr) {
      console.error(
        error.stderr.toString()
      );
    }

    process.exit(1);
  }
}

console.log(
  `✓ All ${files.length} backend JavaScript files passed syntax validation.`
);