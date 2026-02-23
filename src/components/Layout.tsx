import { Outlet, Link, useNavigate } from 'react-router-dom'
import { HiBriefcase, HiChartBar, HiLogout } from 'react-icons/hi'
import { useAuthStore } from '../store/authStore'
import styles from './Layout.module.css'

export function Layout() {
  const { token, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.layout}>
      {token && (
        <nav className={styles.nav}>
          <Link to="/job">
            <HiBriefcase className="nav-icon" aria-hidden />
            Job Input
          </Link>
          <Link to="/gap">
            <HiChartBar className="nav-icon" aria-hidden />
            Skill Gap
          </Link>
          <button type="button" onClick={handleLogout}>
            <HiLogout className="nav-icon" aria-hidden />
            Logout
          </button>
        </nav>
      )}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
