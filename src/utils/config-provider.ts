import z from "zod";
import yaml from "js-yaml";
import {createIfNotExists, readFile} from "./my-fs";
import process from "process";

export class ConfigProvider<T extends z.ZodType> {
    private schema: T;
    private defaults: Partial<z.infer<T>>;

    constructor(schema: T, defaults: Partial<z.infer<T>> = {}) {
        this.schema = schema;
        this.defaults = defaults;
    }

    readConfigFromFile(file: string) {
        return new Promise<Partial<z.infer<T>>>((resolve, reject) => {
            createIfNotExists(file).then(() => {
                readFile(file)
                    .then(data => resolve(yaml.load(data) as Partial<z.infer<T>>))
                    .catch(error => reject(`Failed to load config file: ${error}`));
            });
        });
    }

    async getConfig(file: string): Promise<z.infer<T>> {
        const env = {} as Record<string, unknown>;

        for (const key of Object.keys(this.schema)) {
            env[key] = JSON.parse(process.env[key] || "null");
        }

        return this.schema.parse({
            ...this.defaults,
            ...(await this.readConfigFromFile(file)),
            ...process.env,
        });
    }
}

export default ConfigProvider;