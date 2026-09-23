export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-4xl font-bold text-white">
            MS
          </div>
          <h1 className="mb-2 text-5xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-lg text-gray-500">Mario Silva · Software Architect</p>
        </div>

        {/* Contact card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-700">Contact &amp; Links</h2>
          <ul className="space-y-4">          
            <ContactRow
              icon="💼"
              label="LinkedIn"
              value="linkedin.com/in/mariosergio30"
              href="https://www.linkedin.com/in/mariosergio30"
            />
            <ContactRow
              icon="🦊"
              label="GitHub - exploratory projects"
            contac
              href="https://github.com/mariosergio-portfolio"
            />
            <ContactRow
              icon="✉️"
              label="Email"
              value="mariosergio30@gmail.com"
              href="mailto:mariosergio30@gmail.com"
            />
            <ContactRow icon="📍" label="Home" value="Braga, Portugal" />
          </ul>
        </div>
      </div>
    </div>
  );
}

interface ContactRowProps {
  icon: string;
  label: string;
  value: string;
  href?: string;
}

function ContactRow({ icon, label, value, href }: ContactRowProps) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-0.5 text-xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-blue-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-gray-800">{value}</p>
        )}
      </div>
    </li>
  );
}
