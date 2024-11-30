const esbuild = require("esbuild");
const fs = require('fs');

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
		".node": "copy",
	},
	outExtension: { '.js': '.cjs' },
	assetNames: '[name]',
	sourcemap: process.argv[2] !== "prod",
	minify: process.argv[2] === "prod",
};

fs.rmSync('./dist', { recursive: true, force: true });

console.time("Build Time");
esbuild
	.build(options)
	.then(() => {
		console.timeEnd("Build Time");
		filesToCopy.forEach(file => {
			const from = `./node_modules/${file}`;
			const to = `${outdir}/${file.split("/").pop()}`;
			fs.copyFileSync(from, to);
			console.log(`Copied ${from} to ${to}`);
		});
	})
	.catch(() => {
		console.error("Build failed");
		console.timeEnd("Build Time");
		process.exit(1);
	});
