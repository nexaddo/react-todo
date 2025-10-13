import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Todo, Filter } from './types'
import * as api from './api'
import TodoItem from './components/TodoItem'
import FilterBar from './components/FilterBar'
import { DraggableList } from './dnd'


export default function App() {
    const [todos, setTodos] = useState<Todo[]>([])
    const [draft, setDraft] = useState('')
    const [due, setDue] = useState<string>('')
    const [tags, setTags] = useState<string>('')
    const [filter, setFilter] = useState<Filter>('all')
    const [tagQuery, setTagQuery] = useState('')
    const inputRef = useRef<HTMLInputElement | null>(null)


    useEffect(() => {
        api.listTodos().then(ts => setTodos(sortByOrder(ts)))
    }, [])


    const remaining = useMemo(() => todos.filter(t => !t.completed).length, [todos])


    const allSorted = useMemo(() => sortByOrder(todos), [todos])


    const visibleTodos = useMemo(() => {
        let list = [...allSorted]
        if (filter === 'active') list = list.filter(t => !t.completed)
        if (filter === 'completed') list = list.filter(t => t.completed)
        if (tagQuery.trim()) {
            const wanted = tagQuery.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
            list = list.filter(t => wanted.every(w => t.tags.map(x => x.toLowerCase()).includes(w)))
        }
        return list
    }, [allSorted, filter, tagQuery])


    async function add(e: React.FormEvent) {
        e.preventDefault()
        const text = draft.trim()
        if (!text) return
        const created = await api.createTodo({
            text,
            dueAt: due ? new Date(due).getTime() : null,
            tags: toTags(tags)
        })
        setTodos(prev => sortByOrder([created, ...prev]))
        setDraft(''); setDue(''); setTags('');
        inputRef.current?.focus()
    }


    async function toggle(id: string) {
        const t = todos.find(x => x.id === id)
        if (!t) return
        const updated = await api.updateTodo(id, { completed: !t.completed })
        setTodos(prev => prev.map(x => x.id === id ? updated : x))
    }


    async function edit(id: string, patch: Partial<Todo>) {
        const updated = await api.updateTodo(id, patch)
        setTodos(prev => prev.map(x => x.id === id ? updated : x))
    }


    async function remove(id: string) {
        await api.deleteTodo(id)
        setTodos(prev => prev.filter(x => x.id !== id))
    }


    async function clearCompleted() {
        const completed = todos.filter(t => t.completed)
        await Promise.all(completed.map(t => api.deleteTodo(t.id)))
        setTodos(prev => prev.filter(t => !t.completed))
    }


    // Reorder that works when filtered/tagged views are active.
    async function reorder(newVisibleIds: string[]) {
        // If not filtered, just reorder all ids in one go.
        const isUnfiltered = filter === 'all' && !tagQuery.trim()
        if (isUnfiltered) {
            const reordered = await api.reorderTodos(newVisibleIds)
            setTodos(sortByOrder(reordered))
            return
        }


        // Build a full ordered id list, then replace the contiguous block of
        // currently visible ids with the newVisibleIds sequence.
        const fullIds = allSorted.map(t => t.id)
        const visibleSet = new Set(visibleTodos.map(t => t.id))


        // Find the contiguous segment [start..end] that contains visible ids.
        const positions = fullIds.map((id, i) => visibleSet.has(id) ? i : -1).filter(i => i !== -1)
        if (positions.length === 0) return
        const start = Math.min(...positions)
        const end = Math.max(...positions)


        // Keep non-visible ids in the segment in their relative order *before* and *after*.
        const segment = fullIds.slice(start, end + 1)
        const nonVisibleInSegment = segment.filter(id => !visibleSet.has(id))


        // Merge: [prefix] + [nonVisibleBefore + newVisibleIds + nonVisibleAfter] + [suffix]
        const prefix = fullIds.slice(0, start)
        const suffix = fullIds.slice(end + 1)


        // Split non-visible in segment into before/after using original order
        const beforeNV: string[] = []
        const afterNV: string[] = []
        let seenFirstVisible = false
        for (const id of segment) {
            if (visibleSet.has(id)) seenFirstVisible = true
            else (seenFirstVisible ? afterNV : beforeNV).push(id)
        }


        const merged = [...prefix, ...beforeNV, ...newVisibleIds, ...afterNV, ...suffix]


        const reordered = await api.reorderTodos(merged)
        setTodos(sortByOrder(reordered))
    }
    return (
        <div className="min-h-screen w-full bg-gray-50 text-gray-900">
            <div className="mx-auto max-w-2xl px-4 py-10">
                <header className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Todo</h1>
                </header>


                <form onSubmit={add} className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
                    <input
                        ref={inputRef}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        placeholder="What needs doing?"
                        className="md:col-span-2 rounded-2xl border px-4 py-3 shadow-sm"
                    />
                    <input
                        type="datetime-local"
                        value={due}
                        onChange={e => setDue(e.target.value)}
                        className="rounded-2xl border px-4 py-3 shadow-sm"
                    />
                    <input
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="tags, comma, separated"
                        className="rounded-2xl border px-4 py-3 shadow-sm"
                    />
                    <div className="md:col-span-4 flex justify-end">
                        <button type="submit" className="rounded-2xl bg-black px-5 py-3 text-white">Add</button>
                    </div>
                </form>


                <FilterBar
                    filter={filter}
                    setFilter={setFilter}
                    tagQuery={tagQuery}
                    setTagQuery={setTagQuery}
                    remaining={remaining}
                    clearCompleted={clearCompleted}
                />


                <DraggableList ids={visibleTodos.map(t => t.id)} onReorder={reorder}>
                    <ul className="space-y-2">
                        {visibleTodos.map(todo => (
                            <TodoItem key={todo.id} todo={todo} onToggle={toggle} onDelete={remove} onEdit={edit} />
                        ))}
                    </ul>
                </DraggableList>


                <footer className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-gray-500">API-backed • {new Date().toLocaleDateString()}</span>
                </footer>
            </div>
        </div>
    )
}

function sortByOrder(list: Todo[]) {
    return [...list].sort((a, b) => a.order - b.order)
}


function toTags(s: string) {
    return s.split(',').map(x => x.trim()).filter(Boolean)
}