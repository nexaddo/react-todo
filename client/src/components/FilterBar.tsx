import React from 'react'
import type { Filter } from '../types'


export default function FilterBar({ filter, setFilter, tagQuery, setTagQuery, remaining, clearCompleted }: {
    filter: Filter
    setFilter: (f: Filter) => void
    tagQuery: string
    setTagQuery: (v: string) => void
    remaining: number
    clearCompleted: () => void
}) {
    return (
        <div className="mb-3 flex flex-wrap items-center gap-2">
            {(['all', 'active', 'completed'] as const).map(v => (
                <button key={v} onClick={() => setFilter(v)} className={`rounded-full border px-3 py-1 text-sm ${filter === v ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>{v[0].toUpperCase() + v.slice(1)}</button>
            ))}
            <input value={tagQuery} onChange={e => setTagQuery(e.target.value)} placeholder="filter by tag (comma ok)" className="ml-2 flex-1 rounded-full border px-3 py-1.5 text-sm" />
            <span className="ml-auto text-sm text-gray-600">{remaining} item{remaining === 1 ? '' : 's'} left</span>
            <button onClick={clearCompleted} className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-100">Clear completed</button>
        </div>
    )
}