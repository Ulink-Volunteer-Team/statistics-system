import express from "express";
import { mkdirIfNotExists } from "./my-fs";
import chokidar from "chokidar";
import path from "path";

type Logger = { info: (msg: string) => void, error: (msg: string) => void }

export class StaticProvider {
    readonly path: string;
    app: express.Application;
    logger: Logger
    constructor(app: express.Application, path: string, logger: Logger) {
        this.path = path;
        this.app = app;
        this.logger = logger
    }

    async serve() {
        await mkdirIfNotExists(this.path);
        this.app.use(express.static(this.path));

        chokidar.watch(this.path).on('all', (event, path) => {
            if (event === 'change' || event === 'add' || event === 'unlink') {
                this.logger.info(`StaticProvider: File ${event} detected at ${path}.`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.app._router.stack = this.app._router.stack.filter((layer: any) => {
                    return !(layer.name === 'serveStatic' && layer.regexp.test(path));
                });
                this.app.use(express.static(this.path));
            }
        });

        // Serving index.html for routes
        this.app.get('*', (req, res) => {
            const filePath = path.resolve(this.path, 'index.html');
            res.sendFile(filePath);
            this.logger.info(`StaticProvider: Serving ${filePath} for ${req.url}`);
        });
    }
}
