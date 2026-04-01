import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center text-center p-8">
      <div>
        <div className="text-7xl mb-6">🌿</div>
        <h1 className="font-display text-5xl text-gray-800 dark:text-gray-100 mb-3">404</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">Page introuvable</p>
        <p className="text-sm text-gray-400 mb-8">Cette page n'existe pas ou a été déplacée.</p>
        <Link to="/" className="btn btn-primary inline-flex">← Retour à l'accueil</Link>
      </div>
    </div>
  )
}