export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Classroom Economy Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-2">Welcome</h2>
            <p className="text-muted-foreground">
              Your classroom management system is ready to go!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
