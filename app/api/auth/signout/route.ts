import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json(
      { error: 'Error signing out' },
      { status: 500 }
    )
  }

  return NextResponse.redirect(new URL('/auth', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}