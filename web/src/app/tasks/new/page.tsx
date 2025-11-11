'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTask() {
  const router = useRouter()
  const [task, setTask] = useState('')
  const [workspace, setWorkspace] = useState('./workspace')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, workspace }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/tasks/${data.agent.id}`)
      } else {
        alert('Failed to create task')
      }
    } catch (error) {
      alert('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Create New Task</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Task Description
          </label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
            rows={4}
            placeholder="Describe what you want the agent to do..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Workspace Directory
          </label>
          <input
            type="text"
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="./workspace"
          />
          <p className="text-sm text-muted-foreground mt-1">
            The directory where the agent will work
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
          <a
            href="/"
            className="px-6 py-3 border rounded-lg hover:bg-secondary"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}



