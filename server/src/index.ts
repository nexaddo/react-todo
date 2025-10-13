import express from "express";
import cors from "cors";
import { readAll, Todo, writeAll } from "./storage";
import z from "zod";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";


app.use(cors({ origin: ORIGIN }));
app.use(express.json());


// --- Robust coercers for incoming payloads ---
const Tags = z
    .preprocess((v) => {
        if (Array.isArray(v)) return v;
        if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
        return [];
    }, z.array(z.string().trim().min(1)).default([]))
    .transform((arr) => Array.from(new Set(arr)));


const DueAt = z.preprocess((v) => {
    if (v === "" || v === undefined) return null;
    if (v === null) return null;
    if (typeof v === "number") return Math.trunc(v);
    if (typeof v === "string") {
        // accept epoch string or ISO
        const asNum = Number(v);
        if (!Number.isNaN(asNum)) return Math.trunc(asNum);
        const ms = new Date(v).getTime();
        return Number.isNaN(ms) ? null : Math.trunc(ms);
    }
    return null;
}, z.number().int().nullable());


// Fixed: accept empty string/null/number for dueAt, coerce tags from string or array, trim text
export const NewTodo = z
    .object({
        text: z.string().trim().min(1, "text is required"),
        dueAt: DueAt.optional(),
        tags: Tags,
    })
    .strict();


// Fixed: optional fields, but when provided we validate/trim, and coerce dueAt/tags
export const UpdateTodo = z
    .object({
        text: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1, "text cannot be empty"))
            .optional(),
        completed: z.boolean().optional(),
        dueAt: DueAt.optional(),
        tags: Tags.optional(),
    })
    .strict();


function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}


// GET all
app.get("/api/todos", async (_req, res) => {
    const todos = await readAll();
    res.json({ todos });
});


// POST create
app.post("/api/todos", async (req, res) => {
    const parsed = NewTodo.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const todos = await readAll();
    const maxOrder = Math.max(-1, ...todos.map(t => t.order));
    const todo: Todo = {
        id: uid(),
        text: parsed.data.text,
        completed: false,
        createdAt: Date.now(),
        order: maxOrder + 1,
        dueAt: parsed.data.dueAt ?? null,
        tags: parsed.data.tags ?? [],
    };
    const next = [todo, ...todos];
    await writeAll(next);
    res.status(201).json({ todo });
});


// PATCH update by id
app.patch("/api/todos/:id", async (req, res) => {
    const { id } = req.params;
    const parsed = UpdateTodo.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const todos = await readAll();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ message: "Not found" });
    const updated = { ...todos[idx], ...parsed.data } as Todo;
    todos[idx] = updated;
    await writeAll(todos);
    res.json({ todo: updated });
});


// DELETE by id
app.delete("/api/todos/:id", async (req, res) => {
    const { id } = req.params;
    const todos = await readAll();
    const next = todos.filter(t => t.id !== id);
    await writeAll(next);
    res.status(204).end();
});


// PUT reorder (accepts array of ids in new order)
app.put("/api/todos/reorder", async (req, res) => {
    const ids = z.array(z.string()).safeParse(req.body).data ?? [];
    if (!ids.length) return res.status(400).json({ message: "Body must be array of ids" });
    const todos = await readAll();
    const map = new Map(todos.map(t => [t.id, t] as const));
    let order = 0;
    const reordered: Todo[] = [];
    for (const id of ids) {
        const t = map.get(id);
        if (t) reordered.push({ ...t, order: order++ });
    }
    // Append any missing ids at the end
    for (const t of todos) if (!ids.includes(t.id)) reordered.push({ ...t, order: order++ });
    await writeAll(reordered);
    res.json({ todos: reordered });
});


app.listen(PORT, () => {
    console.log(`API on http://localhost:${PORT}`);
});