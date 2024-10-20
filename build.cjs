const esbuild = require("esbuild");
const { spawn } = require("child_process");
const outFile = "dist/index.cjs";
const ON_DEATH = require("death");

const options = {
	entryPoints: ["src/index.ts"],
	bundle: true,
	outfile: outFile,
	platform: "node",
	target: ["node16"],
	format: "cjs",
	minify: process.argv[2] === "prod",
};

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
