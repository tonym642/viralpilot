import Link from 'next/link'
import { supabase } from '@/src/lib/supabaseClient'

export default async function ProjectsPage() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main style={{ padding: '32px', fontFamily: 'Arial, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '28px', margin: 0 }}>Projects</h1>

        <Link
          href="/projects/new"
          style={{
            padding: '10px 16px',
            background: 'black',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          New Project
        </Link>
      </div>

      {error && <p style={{ color: 'red' }}>Error loading projects.</p>}

      {!projects || projects.length === 0 ? (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '12px',
            padding: '24px',
            background: '#fafafa',
          }}
        >
          No projects yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
              }}
            >
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
                {project.name}
              </h2>

              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Type:</strong> {project.type || 'N/A'}
              </p>

              <p style={{ margin: 0 }}>
                <strong>Description:</strong>{' '}
                {project.description || 'No description'}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}