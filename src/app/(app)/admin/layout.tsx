export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {children}
    </div>
  )
}
