const esbuild = require("esbuild");
const { spawn } = require("child_process");
const outFile = "dist/index.cjs";
const ON_DEATH = require("death");
const child_process = require("node:child_process");


const options = {
	entryPoints: ["src/index.ts"],
	bundle: true,
	outfile: outFile,
	platform: "node",
	target: ["node16"],
	format: "cjs",
	sourcemap: process.argv[2] !== "prod",
	minify: process.argv[2] === "prod",
};

// remove all the files except for the wasm
child_process.execSync(`find "dist/" -type f ! -name "*wasm" -exec rm -v {} \\;`)

esbuild
	.build(options)
	.then(() => {
		if (process.argv[2] !== "dev") return;
		const child = spawn("node " + outFile, {
			shell: true,
			stdio: ["pipe", "pipe", "pipe"],
		});

		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);

		ON_DEATH(() => {
			child.kill();
		});

		child.on("exit", (code) => {
			console.log(`\n- Child process exited with code ${code} -`);
			process.exit(code);
		});
	})
	.catch(() => {
		process.exit(1);
	});
