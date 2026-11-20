import type { Project } from '../data/projects'

export default function Poster({ project, big = false }: { project: Project; big?: boolean }) {
  const lines = [
    `$ ${project.id} --run`,
    ...project.stack.map((s, i) => `[${String(i + 1).padStart(2, '0')}] load ${s.toLowerCase()} … ok`),
    'watching stream ▍',
    'edge 0.031 > thr 0.025',
    '→ signal fired',
  ]
  return (
    <div className={'poster' + (big ? ' poster-big' : '')} style={{ ['--accent' as string]: project.accent }}>
      <pre className="mono">{lines.join('\n')}</pre>
      <div className="poster-title">{project.title}</div>
    </div>
  )
}
