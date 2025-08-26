import { AuthForm } from '@/components/auth/auth-form'

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <AuthForm />
    </main>
  )
}