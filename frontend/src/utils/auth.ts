export function getUserFromToken(): { id: number; role: string } | null {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return { id: decoded.userId, role: decoded.role }
  } catch {
    return null
  }
}

export function isAdmin(): boolean {
  return getUserFromToken()?.role === 'ADMIN'
}