/**
 * TasksPage — page dédiée à toutes les tâches (vue globale).
 */
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { TasksPanel } from '../components/tasks/TasksPanel'

export function TasksPage() {
  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-forma-muted hover:text-forma-accent transition-colors">
          <Icon name="chevron-left" className="w-4 h-4" />
          Tableau de bord
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-forma-text inline-flex items-center gap-2 mb-4">
        <Icon name="check" className="w-5 h-5 text-forma-accent" />
        Tâches
      </h1>
      <TasksPanel />
    </div>
  )
}
