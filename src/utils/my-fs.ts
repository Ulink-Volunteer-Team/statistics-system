// THIS FILE RELIES ON NODE.JS FS API
import fs from "node:fs/promises"

/**
 * Reads the given file and returns its content as a string.
 * @param file the path to the file to read
 * @returns a Promise that resolves to the content of the file
 * @throws if the file does not exist or if there is an error reading it
 */
export const readFile = async (file: string): Promise<string> => {
    return fs.readFile(file, "utf8")
}

/**
 * Writes the given data to the given file.
 * @param file the path to the file to write
 * @param data the data to write
 * @returns a Promise that resolves when the write is complete
 * @throws if there is an error writing the file
 */
export const writeFile = async (file: string, data: string): Promise<void> => {
    return fs.writeFile(file, data)
}

/**
 * Checks if a file exists at the specified path.
 * @param file The path to the file to check
 * @returns A Promise that resolves to true if the file exists, otherwise false
 */
export const existFile = async (file: string): Promise<boolean> => {
    return fs.access(file).then(() => true).catch(() => false)
}

/**
 * Creates the given file if it does not exist.
 * @param file The path to the file to create
 * @returns A Promise that resolves when the file is created
 * @throws if there is an error creating the file
 */
export const createIfNotExists = async (file: string): Promise<void> => {
    if(!await existFile(file)) {
        await writeFile(file, "");
    }
}

/**
 * Creates a directory at the specified path if it does not exist.
 * If the directory already exists, no error is thrown.
 *
 * @param dir The path to the directory to create.
 * @returns A Promise that resolves when the directory is created or already exists.
 * @throws If there is an error creating the directory, other than it already existing.
 */
export const mkdirIfNotExists = async (dir: string): Promise<void> => {
    fs.mkdir(dir, { recursive: true }).catch((error) => {
        if(error.code !== "EEXIST") throw error;
    });
}

/**
 * Retrieves a list of items (files and directories) in the specified directory.
 *
 * @param dir The path to the directory to read.
 * @returns A Promise that resolves to an array of item names in the directory.
 * @throws If there is an error reading the directory.
 */
export const getItems = async (dir: string): Promise<string[]> => {
    return fs.readdir(dir);
}

