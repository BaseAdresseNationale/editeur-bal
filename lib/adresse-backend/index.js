const ADRESSE_BACKEND_URL = process.env.NEXT_PUBLIC_ADRESSE_BACKEND_URL || 'https://backend.adresse.data.gouv.fr'

async function request(url, options_ = {}) {
  const {json, ...options} = options_

  const res = await fetch(`${ADRESSE_BACKEND_URL}${url}`, options)

  if (!res.ok) {
    switch (res.status) {
      case 403:
        throw new Error('Jeton de sécurité invalide')
      case 404:
        throw new Error('Ressource non trouvée')

      default:
        throw new Error('Erreur inattendue')
    }
  }

  if (json !== false) {
    return res.json()
  }

  return res
}

export async function getPublishedBasesLocales() {
  if (!process.env.NEXT_PUBLIC_ADRESSE_BACKEND_URL) {
    return []
  }

  const items = await request('/publication/submissions/published')
  return items.filter(item => item.url)
}

