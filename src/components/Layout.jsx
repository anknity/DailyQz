import Navbar from './Navbar'

/**
 * Layout — wraps every protected page with the sidebar Navbar
 * and applies the correct content offset so nothing hides
 * behind the fixed sidebar on desktop (lg:ml-[296px]).
 *
 * Props:
 *   fullScreen  — when true, content area takes full viewport height (for code editors, etc.)
 *
 * Usage:
 *   <Layout>
 *     <YourPageContent />
 *   </Layout>
 *
 *   <Layout fullScreen>
 *     <FullScreenEditor />
 *   </Layout>
 */
const Layout = ({ children, upcomingExams = [], fullScreen = false }) => (
  <div className={`dq-app-bg ${fullScreen ? 'h-screen overflow-hidden' : 'min-h-screen'} text-slate-200`}>
    <Navbar upcomingExams={upcomingExams} />
    {/* pt-16 offsets the mobile top-bar; lg:pt-0 removes it on desktop */}
    <main className={`lg:ml-[296px] ${fullScreen ? 'h-screen overflow-hidden' : 'min-h-screen'} overflow-x-hidden pt-16 lg:pt-0`}>
      {children}
    </main>
  </div>
)

export default Layout
