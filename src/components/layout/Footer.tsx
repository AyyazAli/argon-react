export function Footer() {
  return (
    <footer className="border-t py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()}{' '}
          <span className="font-medium text-foreground">Argon Portal</span>. All
          rights reserved.
        </p>
        <p className="text-xs">
          Built with React + Tailwind CSS
        </p>
      </div>
    </footer>
  )
}




