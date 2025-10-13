import request from 'supertest'
import express from 'express'
import { describe, expect, test, beforeEach } from 'vitest'
import { readAll, writeAll } from './storage'


// Build a tiny app using same storage as the real server
function makeApp() {
    const a = express(); a.use(express.json())
    a.get('/api/todos', async (_req, res) => res.json({ todos: await readAll() }))
    a.post('/api/todos', async (req, res) => {
        const text = String(req.body?.text || '')
        const todos = await readAll()
        const max = Math.max(-1, ...todos.map(t => t.order))
        const todo = { id: 'test', text, completed: false, createdAt: Date.now(), order: max + 1, tags: [], dueAt: null }
        await writeAll([todo, ...todos]); res.status(201).json({ todo })
    })
    a.delete('/api/todos/:id', async (req, res) => {
        const todos = await readAll(); await writeAll(todos.filter(t => t.id !== req.params.id)); res.status(204).end()
    })
    return a
}


beforeEach(async () => { await writeAll([]) })


describe('todos api', () => {
    test('create, list, delete', async () => {
        const app = makeApp()
        const created = await request(app).post('/api/todos').send({ text: 'test item' }).expect(201)
        expect(created.body.todo.text).toBe('test item')


        const listed = await request(app).get('/api/todos').expect(200)
        expect(listed.body.todos.length).toBeGreaterThan(0)


        await request(app).delete('/api/todos/test').expect(204)
    })
})