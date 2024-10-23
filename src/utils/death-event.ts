type Handler = () => Promise<boolean> | boolean

export class DeathEvent {
    handlers: Map<number, () => Promise<boolean> | boolean> = new Map();
    count = 0;
    constructor() {
        this.handlers = new Map();
    }

    addHandler(callback: Handler) {
        this.handlers.set(this.count, callback);
        return this.count++;
    }

    removeHandler(id: number) {
        this.handlers.delete(id);
    }

    async prepareToDie() {
        let flag = true;
        for (const handler of this.handlers.values()) {
            if (!await handler()) flag = false;
        }
        return flag;
    }
}

export default DeathEvent;
