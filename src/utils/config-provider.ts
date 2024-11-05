import z from "zod";
import yaml from "js-yaml";
import { readFile } from "node:fs/promises";
import process from "process";

export class ConfigProvider<T extends z.ZodType> {
    private schema: T;

    constructor(schema: T) {
        this.schema = schema;
    }

    readConfigFromFile(file: string){
        return new Promise<Partial<z.infer<T>>>((resolve, reject) => {
            readFile(file, "utf8")
                .then(data => resolve(yaml.load(data) as Partial<z.infer<T>>))
                .catch(error => reject(`Failed to load config file: ${error}`));
        })
    }

    async getConfig(file: string): Promise<z.infer<T>> {
        const env = {} as Record<string, unknown>;

        for(const key of Object.keys(this.schema)) {
            env[key] = JSON.parse(process.env[key] || "null");
        }
        
        return this.schema.parse({
            ...(await this.readConfigFromFile(file)),
            ...process.env,
        });
    }
}

export default ConfigProvider;