import React from 'react'


export default function TagInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="tags, comma, separated"
            className="w-full rounded border px-3 py-2"
        />
    )
}