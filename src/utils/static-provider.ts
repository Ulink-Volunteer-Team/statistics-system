import express from "express";
import { mkdirIfNotExists } from "./my-fs";
import chokidar from "chokidar";
import path from "path";

type Logger = { info: (msg: string) => void, error: (msg: string) => void }

export class StaticProvider {
	readonly path: string;
	app: express.Application;
	logger: Logger
	/**
	 * Initializes a StaticProvider instance.
	 *
	 * @param app - The Express application instance to attach static file serving.
	 * @param path - The directory path where static files are located.
	 * @param logger - Logger for logging information and errors.
	 */
	constructor(app: express.Application, path: string, logger: Logger) {
		this.path = path;
		this.app = app;
		this.logger = logger
	}

	/**
	 * Sets up static file serving for the provided directory path.
	 * Automatically reloads the static file serving when any file in the directory changes.
	 * Also serves index.html for routes.
	 */
	async serve() {
		await mkdirIfNotExists(this.path);
		this.app.use(express.static(this.path));

		chokidar.watch(this.path).on('all', (event, path) => {
			if (event === 'change' || event === 'add' || event === 'unlink') {
				this.logger.info(`StaticProvider: File ${event} detected at ${path}.`);
				this.removeServes();
				this.app.use(express.static(this.path));
			}
		});

		const resolvedDefaultFile = path.resolve(this.path, 'index.html');

		this.app.get('*', (req, res) => {
			res.sendFile(resolvedDefaultFile);
			this.logger.info(`StaticProvider: Serving ${resolvedDefaultFile} for ${req.url}`);
		});
	}

	/**
	 * Removes the static file serving middleware set up by serve().
	 *
	 * It filters out the middleware from the Express app's stack.
	 */
	removeServes() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.app._router.stack = this.app._router.stack.filter((layer: any) => {
			return !(layer.name === 'serveStatic' && layer.regexp.test(path));
		});
	}
}
