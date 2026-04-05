import { useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Playground from './pages/Playground.jsx'
import AgentRunner from './pages/AgentRunner.jsx'
import DocsPage from './pages/DocsPage.jsx'
import './index.css'

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',    icon: '⬡' },
  { id: 'playground', label: 'Playground',   icon: '◈' },
  { id: 'agent',      label: 'Agent Runner', icon: '◎' },
  { id: 'docs',       label: 'API Docs',     icon: '◻' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  const page = {
    dashboard:  <Dashboard />,
    playground: <Playground />,
    agent:      <AgentRunner />,
    docs:       <DocsPage />,
  }[tab]

  return (
    <div className="min-h-screen bg-surface-900 bg-grid-pattern">
      <Header tab={tab} tabs={TABS} onTabChange={setTab} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {page}
      </main>
    </div>
  )
}
