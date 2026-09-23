const projects = [
  {
    name: 'Webstore Frontend',
    description:
      'React + TypeScript e-commerce frontend with cart, checkout, payments, and backoffice.',
    tags: ['React', 'TypeScript', 'Tailwind', 'Zustand'],
    url: 'https://gitlab.com/mariosergio30',
  },
  {
    name: 'Webstore Java API',
    description:
      'Spring Boot hexagonal-architecture REST API powering the webstore catalog, cart, and orders.',
    tags: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
    url: 'https://gitlab.com/mariosergio30',
  },
  {
    name: 'SIAP Java API',
    description:
      'Survey data-collection platform built with Spring Boot, clean architecture, and AWS deployment.',
    tags: ['Java', 'Spring Boot', 'AWS', 'H2/PostgreSQL'],
    url: 'https://gitlab.com/mariosergio30',
  },
  {
    name: 'Micro API Ecommerce',
    description: 'Microservices e-commerce experiment with Spring Cloud, Eureka, and Kafka.',
    tags: ['Java', 'Spring Cloud', 'Kafka', 'Docker'],
    url: 'https://gitlab.com/mariosergio30',
  },
];

const skills = [
  { category: 'Languages', items: ['Java', 'TypeScript', 'Kotlin', 'SQL'] },
  { category: 'Frontend', items: ['React', 'Tailwind CSS', 'Vite', 'React Router'] },
  {
    category: 'Backend',
    items: ['Spring Boot', 'Spring Security', 'Spring Cloud', 'Quarkus'],
  },
  { category: 'Data', items: ['PostgreSQL', 'H2', 'Kafka', 'Redis'] },
  { category: 'DevOps', items: ['Docker', 'AWS ECS', 'AWS CloudFormation', 'Terraform'] },
];

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">Projects</h1>
      <p className="mb-10 text-gray-500">A selection of things I have built.</p>

      {/* Project cards */}
      <div className="mb-16 grid gap-6 sm:grid-cols-2">
        {projects.map((p) => (
          <div
            key={p.name}
            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">{p.name}</h2>
            <p className="mb-4 flex-1 text-sm text-gray-600">{p.description}</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {p.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View on GitLab →
            </a>
          </div>
        ))}
      </div>

      {/* Skills */}
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Skills</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((s) => (
          <div key={s.category} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {s.category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {s.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
