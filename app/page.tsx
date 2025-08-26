import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to dashboard for now  
  redirect("/dashboard")
}
