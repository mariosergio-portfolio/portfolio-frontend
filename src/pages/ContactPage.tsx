export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">Contact</h1>
      <p className="mb-10 text-gray-500">Feel free to reach out through any of the channels below.</p>

      <div className="space-y-6">       
        <ContactCard
          icon="💼"
          title="LinkedIn"
          description="Connect with me professionally on LinkedIn."
          cta="linkedin.com/in/mariosergio30"
          href="https://www.linkedin.com/in/mariosergio30"
        />
        <ContactCard
          icon="🦊"
          title="GitLab"
          description="Browse my open-source work and contributions."
          cta="gitlab.com/mariosergio30"
          href="https://github.com/orgs/mariosergio-portfolio/repositories"
        />
         <ContactCard
          icon="✉️"
          title="Email"
          description="Best way to reach me for professional enquiries."
          cta="mariosergio30@gmail.com"
          href="mailto:mariosergio30@gmail.com"
        />
        <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="text-2xl">📍</span>
          <div>
            <h2 className="font-semibold text-gray-900">Location</h2>
            <p className="mt-1 text-gray-600">Braga, Braga (Portugal)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContactCardProps {
  icon: string;
  title: string;
  description: string;
  cta: string;
  href: string;
}

function ContactCard({ icon, title, description, cta, href }: ContactCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block break-all text-sm font-medium text-blue-600 hover:underline"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}
