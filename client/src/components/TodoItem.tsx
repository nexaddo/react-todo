import React, { useState } from 'react'
import type { Todo } from '../types'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'


export default function TodoItem({ todo, onToggle, onDelete, onEdit }: {
    todo: Todo
    onToggle: (id: string) => void
    onDelete: (id: string) => void
    onEdit: (id: string, patch: Partial<Todo>) => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [text, setText] = useState(todo.text)
    const [due, setDue] = useState<string | ''>(todo.dueAt ? new Date(todo.dueAt).toISOString().slice(0, 16) : '')
    const [tags, setTags] = useState<string>(todo.tags.join(', '))


    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id })
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    }


    function save() {
        onEdit(todo.id, {
            text: text.trim() || todo.text,
            dueAt: due ? new Date(due).getTime() : null,
            tags: tags.split(',').map(s => s.trim()).filter(Boolean)
        })
        setIsEditing(false)
    }


    return (
        <li ref={setNodeRef} style={style} className="rounded-2xl border bg-white p-3 shadow-sm">
            <div className="flex items-start gap-3">
                <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} className="mt-1 h-5 w-5" />
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-2">
                            <input className="w-full rounded border px-2 py-1" value={text} onChange={e => setText(e.target.value)} />
                            <div className="flex gap-2">
                                <input className="rounded border px-2 py-1" type="datetime-local" value={due} onChange={e => setDue(e.target.value)} />
                                <input className="flex-1 rounded border px-2 py-1" placeholder="tags, comma, separated" value={tags} onChange={e => setTags(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                                <button className="rounded bg-black px-3 py-1 text-white" onClick={save}>Save</button>
                                <button className="rounded border px-3 py-1" onClick={() => setIsEditing(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className={`text-left ${todo.completed ? 'text-gray-400 line-through' : ''}`}>
                            <div className="font-medium">{todo.text}</div>
                            <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-2">
                                {todo.dueAt && <span>Due: {new Date(todo.dueAt).toLocaleString()}</span>}
                                {todo.tags?.length ? (
                                    <span>Tags: {todo.tags.join(', ')}</span>
                                ) : null}
                            </div>
                        </button>
                    )}
                </div>
                <button {...attributes} {...listeners} className="rounded border px-2 py-1 text-xs">Drag</button>
                <button onClick={() => onDelete(todo.id)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>
            </div>
        </li>
    )
}