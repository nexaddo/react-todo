export type Filter = 'all' | 'active' | 'completed'


export type Todo = {
    id: string
    text: string
    completed: boolean
    createdAt: number
    order: number
    dueAt?: number | null
    tags: string[]
}