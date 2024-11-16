const esbuild = require("esbuild");
const { spawn } = require("child_process");
const outFile = "dist/index.cjs";
const ON_DEATH = require("death");
const child_process = require("node:child_process");
const fs = require('fs');
const path = require('path');

const outdir = "dist";

const filesToCopy = [
	'bcrypt-fast/bcrypt_fast_bg.wasm',
	'node-sqlite3-wasm/dist/node-sqlite3-wasm.wasm'
];

const options = {
	entryPoints: ["src/index.ts"],
	bundle: true,
	outdir: outdir,
	platform: "node",
	target: ["node16"],
	format: "cjs",
	loader: {
		".wasm": "copy",
	},
	outExtension: { '.js': '.cjs' },
	assetNames: '[name]',
	sourcemap: process.argv[2] !== "prod",
	minify: process.argv[2] === "prod",
};

child_process.execSync(`rm -r ./dist/*`)

esbuild
	.build(options)
	.then(() => {
		filesToCopy.forEach(file => {
			const from = `./node_modules/${file}`;
			const to = `${outdir}/${file.split("/").pop()}`;
			fs.copyFileSync(from, to);
			console.log(`Copied ${from} to ${to}`);
		});

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
