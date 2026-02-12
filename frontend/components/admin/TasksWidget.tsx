import { useState, useEffect } from 'react'
import { CheckCircle2, User, Plus, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Task {
    id: string
    title: string
    description?: string
    status: 'pending' | 'in_progress' | 'done'
    priority: 'low' | 'medium' | 'high'
    assigned_to?: string
    due_date?: string
}

export default function TasksWidget() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: 'self'
    })

    useEffect(() => {
        const loadCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUserId(user?.id || null)
        }
        loadCurrentUser()
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch('/api/tasks', {
                headers: { Authorization: `Bearer ${session.access_token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setTasks(data)
            }
        } catch (error) {
            console.error('Error fetching tasks', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify(newTask)
            })

            if (response.ok) {
                toast.success('המשימה נוצרה בהצלחה')
                setShowAddModal(false)
                setNewTask({ title: '', description: '', priority: 'medium', assigned_to: 'self' })
                fetchTasks()
            } else {
                toast.error('שגיאה ביצירת המשימה')
            }
        } catch (error) {
            toast.error('שגיאה ביצירת המשימה')
        }
    }

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ status: newStatus })
            })

            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t))
            toast.success('סטטוס עודכן')
        } catch (error) {
            toast.error('שגיאה בעדכון סטטוס')
        }
    }

    const deleteTask = async (taskId: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` }
            })

            setTasks(tasks.filter(t => t.id !== taskId))
            toast.success('המשימה נמחקה')
        } catch (error) {
            toast.error('שגיאה במחיקת המשימה')
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800'
            case 'medium': return 'bg-yellow-100 text-yellow-800'
            case 'low': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary">משימות</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="p-2 bg-primary-light text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center text-gray-500 py-4">טוען משימות...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">אין משימות פתוחות</div>
                ) : (
                    tasks.map((task) => (
                        <div key={task.id} className={`flex items-start justify-between p-4 rounded-lg border ${task.status === 'done' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => updateTaskStatus(task.id, task.status === 'done' ? 'pending' : 'done')}
                                    className={`mt-1 ${task.status === 'done' ? 'text-primary' : 'text-gray-300 hover:text-primary transition-colors'}`}
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <div>
                                    <h3 className={`font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>{task.title}</h3>
                                    {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                                            {task.priority === 'high' ? 'גבוהה' : task.priority === 'medium' ? 'בינונית' : 'נמוכה'}
                                        </span>
                                        {task.assigned_to && (
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <User className="w-3 h-3" />
                                                {task.assigned_to === 'self' || task.assigned_to === currentUserId ? 'אני' : 'משתמש אחר'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Task Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-right"
                            dir="rtl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">משימה חדשה</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        placeholder="מה צריך לעשות?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        rows={3}
                                        placeholder="פרטים נוספים..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">עדיפות</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                            className="w-full px-4 py-2 border rounded-lg outline-none"
                                        >
                                            <option value="low">נמוכה</option>
                                            <option value="medium">בינונית</option>
                                            <option value="high">גבוהה</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">הקצאה ל</label>
                                        <select
                                            value={newTask.assigned_to}
                                            onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg outline-none"
                                        >
                                            <option value="self">לעצמי</option>
                                            {/* Future: Add list of admins */}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        ביטול
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                    >
                                        צור משימה
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
