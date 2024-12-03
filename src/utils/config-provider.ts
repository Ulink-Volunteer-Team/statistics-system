import z from "zod";
import yaml from "js-yaml";
import {createIfNotExists, readFile} from "./my-fs";
import process from "process";

export class ConfigProvider<T extends z.ZodType> {
    private schema: T;
    private defaults: Partial<z.infer<T>>;

    /**
	 * A class for reading and validating configuration files.
	 *
     * @param schema the Zod schema that defines the shape of the configuration
     * @param defaults the default values for the configuration fields
     */
    constructor(schema: T, defaults: Partial<z.infer<T>> = {}) {
        this.schema = schema;
        this.defaults = defaults;
    }

    /**
     * Reads a configuration file from the given path.
     * @param file the path to the configuration file
     * @returns a Promise that resolves to a partial configuration object
     *
     * If the file does not exist, it will be created with all fields set to their default values.
     *
     * If the file contains invalid YAML, the promise will be rejected.
     *
     * If the file contains unknown fields, they will be ignored.
     *
     * If the file contains fields that are not in the schema, they will be ignored.
     */
    readConfigFromFile(file: string) {
        return new Promise<Partial<z.infer<T>>>((resolve, reject) => {
            createIfNotExists(file).then(() => {
                readFile(file)
                    .then(data => resolve(yaml.load(data) as Partial<z.infer<T>>))
                    .catch(error => reject(`Failed to load config file: ${error}`));
            });
        });
    }

    /**
     * @param file the path to the configuration file
     * @returns a Promise that resolves to a validated configuration object
     *
     * The configuration object is constructed from the following sources in order of priority:
     * 1. The default values provided in the constructor
     * 2. The values loaded from the configuration file
     * 3. The values set as environment variables
     *
     * If a value is set in multiple sources, the value from the highest-priority source will be used.
     *
     * The configuration file is expected to be a YAML file.
     *
     * If the configuration file does not exist, it will be created with all fields set to their default values.
     *
     * If a value is set in the configuration file but not in the schema, it will be ignored.
     *
     * If a value is set in the schema but not in the configuration file, it will use the default value.
     *
     * If a value is set in the environment variables but not in the schema, it will be ignored.
     *
     * If a value is set in the schema but not in the environment variables, it will use the default value.
     *
     * If a value is invalid according to the schema, a {@link z.ZodError} will be thrown.
     */
    async getConfig(file: string): Promise<z.infer<T>> {
        const env = {} as Record<string, unknown>;

        for (const key of Object.keys(this.schema)) {
            env[key] = JSON.parse(process.env[key] || "null");
        }

		const combined = ({
            ...this.defaults,
            ...(await this.readConfigFromFile(file)),
            ...((() => {
				const obj = {} as Record<string, unknown>;
				for(const key of Object.keys(this.defaults)) {
					if(process.env[key]) (obj)[key] = JSON.parse(process.env[key]);
				}
				return obj;
			})()),
        })

        return this.schema.parse(combined);
    }
}

export default ConfigProvider;
