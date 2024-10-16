const esbuild = require("esbuild");
const { spawn } = require("child_process");

const options = {
	entryPoints: ["src/index.ts"],
	bundle: true,
	outfile: "dist/index.js",
	platform: "node",
	target: ["node16"],
	format: "cjs",
};

esbuild
	.build(options)
	.then(() => {
		if (process.argv[2] !== "dev") return;
		const child = spawn("node dist/index.js", {
			shell: true,
			stdio: ["pipe", "pipe", "pipe"],
		});

		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);

		child.on("close", (code) => {
			console.log(`- Child process exited with code ${code} -`);
		});
	})
	.catch(() => {
		process.exit(1);
	});
