import type { Todo } from './types'


const headers = { 'Content-Type': 'application/json' }


export async function listTodos(): Promise<Todo[]> {
    const res = await fetch('/api/todos')
    const data = await res.json()
    return data.todos as Todo[]
}


export async function createTodo(input: { text: string; dueAt?: number | null; tags?: string[] }): Promise<Todo> {
    const res = await fetch('/api/todos', { method: 'POST', headers, body: JSON.stringify(input) })
    const data = await res.json()
    return data.todo as Todo
}


export async function updateTodo(id: string, patch: Partial<Todo>): Promise<Todo> {
    const res = await fetch(`/api/todos/${id}`, { method: 'PATCH', headers, body: JSON.stringify(patch) })
    const data = await res.json()
    return data.todo as Todo
}


export async function deleteTodo(id: string): Promise<void> {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
}


export async function reorderTodos(ids: string[]): Promise<Todo[]> {
    const res = await fetch('/api/todos/reorder', { method: 'PUT', headers, body: JSON.stringify(ids) })
    const data = await res.json()
    return data.todos as Todo[]
}