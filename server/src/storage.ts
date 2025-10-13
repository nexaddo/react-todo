import { promises as fs } from "fs";
import path from "path";


export type Todo = {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    order: number; // for sorting
    dueAt?: number | null; // epoch ms
    tags: string[];
};


const DATA_DIR = path.resolve(process.cwd(), "server/data");
const FILE_PATH = path.join(DATA_DIR, "todos.json");


async function ensure() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.access(FILE_PATH);
    } catch {
        await fs.writeFile(FILE_PATH, JSON.stringify({ todos: [] }, null, 2));
    }
}


export async function readAll(): Promise<Todo[]> {
    await ensure();
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const data = JSON.parse(raw) as { todos: Todo[] };
    return data.todos;
}


export async function writeAll(todos: Todo[]) {
    await ensure();
    await fs.writeFile(FILE_PATH, JSON.stringify({ todos }, null, 2));
}