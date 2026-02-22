import { useAuth } from './hooks/useAuth'
import LoginPage from './components/LoginPage'
import FileExplorer from './components/FileExplorer'

export default function App() {
  const { user, loading, signIn, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} />
  }

  return <FileExplorer user={user} onSignOut={signOut} />
}
