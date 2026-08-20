const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const frontendRoot = path.resolve(__dirname, "..");

const baselinePath = path.join(
  frontendRoot,
  "validation",
  "eslint-baseline.json"
);

const eslintPath = path.join(
  frontendRoot,
  "node_modules",
  "eslint",
  "bin",
  "eslint.js"
);

function runEslint() {
  try {
    const output = execFileSync(
      process.execPath,
      [
        eslintPath,
        ".",
        "--format",
        "json",
      ],
      {
        cwd: frontendRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    return JSON.parse(output);
  } catch (error) {
    if (!error.stdout) {
      console.error(
        "\n✗ ESLint could not be executed.\n"
      );

      if (error.stderr) {
        console.error(
          error.stderr.toString()
        );
      }

      process.exit(1);
    }

    return JSON.parse(
      error.stdout.toString()
    );
  }
}

function createFindingKey(
  filePath,
  message
) {
  const relativeFile =
    path.relative(
      frontendRoot,
      filePath
    );

  return [
    relativeFile.replace(/\\/g, "/"),
    message.ruleId || "",
    message.line || "",
    message.column || "",
    message.message || "",
  ].join("|");
}

function collectFindings(results) {
  const findings = new Map();

  for (const result of results) {
    for (const message of result.messages) {
      const key =
        createFindingKey(
          result.filePath,
          message
        );

      findings.set(key, {
        file:
          path.relative(
            frontendRoot,
            result.filePath
          ),
        line:
          message.line,
        column:
          message.column,
        rule:
          message.ruleId,
        severity:
          message.severity,
        message:
          message.message,
      });
    }
  }

  return findings;
}

function loadBaseline() {
  if (
    !fs.existsSync(
      baselinePath
    )
  ) {
    return new Set();
  }

  const raw =
    fs.readFileSync(
      baselinePath,
      "utf8"
    ).trim();

  if (!raw) {
    return new Set();
  }

  const parsed =
    JSON.parse(raw);

  return new Set(parsed);
}

function saveBaseline(
  findings
) {
  const sorted =
    [...findings.keys()].sort();

  fs.writeFileSync(
    baselinePath,
    `${JSON.stringify(
      sorted,
      null,
      2
    )}\n`,
    "utf8"
  );
}

function runBuild() {
  console.log(
    "\nRunning production build...\n"
  );

  try {
    execFileSync(
      process.execPath,
      [
        path.join(
          frontendRoot,
          "node_modules",
          "vite",
          "bin",
          "vite.js"
        ),
        "build",
      ],
      {
        cwd: frontendRoot,
        stdio: "inherit",
      }
    );

    console.log(
      "\n✓ Frontend production build passed."
    );

    return true;
  } catch (error) {
    console.error(
      "\n✗ Frontend production build failed."
    );

    return false;
  }
}

console.log(
  "Checking frontend ESLint configuration...\n"
);

const results =
  runEslint();

const currentFindings =
  collectFindings(results);

const baseline =
  loadBaseline();

const newFindings =
  [...currentFindings.entries()]
    .filter(
      ([key]) =>
        !baseline.has(key)
    );

const resolvedFindings =
  [...baseline]
    .filter(
      (key) =>
        !currentFindings.has(key)
    );

console.log(
  `Known baseline findings: ${baseline.size}`
);

console.log(
  `Current ESLint findings:  ${currentFindings.size}`
);

console.log(
  `New ESLint findings:      ${newFindings.length}`
);

console.log(
  `Resolved findings:        ${resolvedFindings.length}`
);

if (newFindings.length > 0) {
  console.log(
    "\n✗ NEW ESLINT FINDINGS DETECTED:\n"
  );

  for (const [, finding] of newFindings) {
    console.log(
      `${finding.file}:${finding.line}:${finding.column} ` +
        `[${finding.rule}] ${finding.message}`
    );
  }

  process.exit(1);
}

if (
  currentFindings.size > 0 &&
  baseline.size === 0
) {
  console.log(
    "\nNo baseline exists yet."
  );

  console.log(
    "Creating the initial ESLint baseline..."
  );

  saveBaseline(
    currentFindings
  );

  console.log(
    `✓ Baseline created with ${currentFindings.size} findings.`
  );
} else {
  saveBaseline(
    currentFindings
  );

  console.log(
    "\n✓ ESLint baseline validation passed."
  );
}

const buildPassed =
  runBuild();

if (!buildPassed) {
  process.exit(1);
}

console.log(
  "\n========================================"
);

console.log(
  "✓ FRONTEND VALIDATION PASSED"
);

console.log(
  "========================================"
);