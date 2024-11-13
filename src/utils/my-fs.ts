// THIS FILE RELIES ON NODE.JS FS API
import fs from "node:fs/promises"

export const readFile = async (file: string): Promise<string> => {
    return fs.readFile(file, "utf8")
}

export const writeFile = async (file: string, data: string): Promise<void> => {
    return fs.writeFile(file, data)
}

export const existFile = async (file: string): Promise<boolean> => {
    return fs.access(file).then(() => true).catch(() => false)
}

export const createIfNotExists = async (file: string): Promise<void> => {
    if(!await existFile(file)) {
        await writeFile(file, "");
    }
}

export const getItems = async (dir: string): Promise<string[]> => {
    return fs.readdir(dir);
}

