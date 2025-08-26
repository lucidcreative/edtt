import { Suspense } from 'react'
import { AuthChecker } from '@/components/auth/auth-checker'
import { Dashboard } from '@/components/dashboard/dashboard'
import { AuthForm } from '@/components/auth/auth-form'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <AuthChecker>
          {({ user, isLoading }) => {
            if (isLoading) {
              return (
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                </div>
              )
            }

            if (!user) {
              return <AuthForm />
            }

            return <Dashboard user={user} />
          }}
        </AuthChecker>
      </Suspense>
    </main>
  )
}