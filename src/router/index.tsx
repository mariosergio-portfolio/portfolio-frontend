import { BrowserRouter, Routes, Route, NavLink } from 'react-router';
import { Suspense, lazy } from 'react';

const HomePage         = lazy(() => import('@/pages/HomePage'));
const ProjectsPage     = lazy(() => import('@/pages/ProjectsPage'));
const ContactPage      = lazy(() => import('@/pages/ContactPage'));

const ParallelismPage    = lazy(() => import('@/pages/case-studies/ParallelismPage'));
const CustomersPage      = lazy(() => import('@/pages/case-studies/CustomersPage'));
const SsePage            = lazy(() => import('@/pages/case-studies/SsePage'));
const CircuitBreakerPage = lazy(() => import('@/pages/case-studies/CircuitBreakerPage'));


const CASE_STUDIES = [
  { to: '/case-studies/parallelism',    label: 'Parallelism — Java vs GoLang' },
  { to: '/case-studies/customers',      label: 'Customers API' },
  { to: '/case-studies/sse',            label: 'SSE' },
  { to: '/case-studies/circuit-breaker', label: 'Circuit Breaker' },  
];

function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'font-semibold text-blue-600'
      : 'text-gray-600 hover:text-gray-900';

  return (
    <nav className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <NavLink to="/" className="text-xl font-bold text-blue-600">
          Portfolio
        </NavLink>
        <div className="flex items-center gap-6 text-sm">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/projects" className={linkClass}>
            Projects
          </NavLink>

          {/* Case Studies dropdown */}
          <div className="group relative">
            <NavLink
              to="/case-studies"
              className={({ isActive }) =>
                isActive ? 'font-semibold text-green-600' : 'text-gray-600 hover:text-gray-900'
              }
            >
              Case Studies ▾
            </NavLink>
            <div className="absolute left-0 top-full z-50 hidden w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg group-hover:block">
              {CASE_STUDIES.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm ${
                      isActive
                        ? 'bg-green-50 font-semibold text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          <NavLink to="/contact" className={linkClass}>
            Contact
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function CaseStudiesLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50 p-4 space-y-1">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Case Studies
        </p>
        {CASE_STUDIES.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${
                isActive
                  ? 'bg-green-50 font-semibold text-green-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 p-8">
        <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />}>
          <Routes>
            <Route path="parallelism"     element={<ParallelismPage />} />
            <Route path="sse"             element={<SsePage />} />
            <Route path="circuit-breaker" element={<CircuitBreakerPage />} />
            <Route path="customers"       element={<CustomersPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          }
        >
          <Routes>
            <Route path="/"         element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/contact"  element={<ContactPage />} />
            <Route path="/case-studies/*" element={<CaseStudiesLayout />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
