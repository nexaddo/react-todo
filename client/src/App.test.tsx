import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { expect, test, vi } from 'vitest'


// Minimal API mock for deterministic tests
vi.mock('./api', () => ({
    listTodos: () => Promise.resolve([]),
    createTodo: (x: any) => Promise.resolve({ id: '1', order: 0, completed: false, createdAt: Date.now(), tags: x.tags ?? [], dueAt: x.dueAt ?? null, text: x.text }),
    updateTodo: (_: string, patch: any) => Promise.resolve({ id: '1', order: 0, createdAt: Date.now(), text: 'X', completed: !!patch.completed, dueAt: null, tags: [] }),
    deleteTodo: async () => { },
    reorderTodos: (ids: string[]) => Promise.resolve(ids.map((id, i) => ({ id, order: i, createdAt: Date.now(), text: 'X', completed: false, dueAt: null, tags: [] })))
}))


test('adds a todo', async () => {
    render(<App />)
    const input = await screen.findByPlaceholderText(/what needs doing/i)
    fireEvent.change(input, { target: { value: 'Buy milk' } })
    fireEvent.submit(input.closest('form')!)
    expect(await screen.findByText('Buy milk')).toBeInTheDocument()
})