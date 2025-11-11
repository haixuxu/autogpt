'use client'

import { useEffect, useState } from 'react'

interface Task {
  id: string
  name: string
  task: string
  status: string
  createdAt: string
  _count: { cycles: number }
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/tasks')
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch tasks:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <a 
          href="/tasks/new" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          New Task
        </a>
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{task.name}</h3>
                  <p className="text-muted-foreground mt-1">{task.task}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      task.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status}
                    </span>
                    <span className="text-muted-foreground">
                      {task._count.cycles} cycles
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <a 
                  href={`/tasks/${task.id}`}
                  className="text-primary hover:underline"
                >
                  View →
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}



