export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto print:p-0 print:max-w-none">
      {children}
    </div>
  )
}
