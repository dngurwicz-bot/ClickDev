export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text-primary mb-4">גישה נדחתה</h1>
        <p className="text-text-secondary mb-8">אין לך הרשאה לגשת לדף זה</p>
        <a href="/login" className="text-primary hover:text-primary-dark font-medium">
          חזור לדף ההתחברות
        </a>
      </div>
    </div>
  )
}
