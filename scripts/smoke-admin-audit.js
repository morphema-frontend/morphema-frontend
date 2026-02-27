const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const PASSWORD = process.env.SMOKE_PASSWORD || 'Password123!'

async function readJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function assertOk(res, label) {
  if (res.ok) return
  const payload = await readJsonSafe(res)
  const msg = `${label} failed: ${res.status} ${res.statusText} ${payload ? JSON.stringify(payload) : ''}`
  throw new Error(msg)
}

async function postJson(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  await assertOk(res, `POST ${path}`)
  return readJsonSafe(res)
}

async function getJson(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  await assertOk(res, `GET ${path}`)
  return readJsonSafe(res)
}

async function registerUser(email, role) {
  return postJson('/api/auth/register', { email, password: PASSWORD, role }, null)
}

async function login(email) {
  const res = await postJson('/api/auth/login', { email, password: PASSWORD }, null)
  if (!res?.accessToken) throw new Error(`Login failed for ${email}`)
  return res.accessToken
}

async function uploadDemoFile(token) {
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
  const bytes = Buffer.from(pngBase64, 'base64')
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'image/png' }), 'demo.png')

  const res = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  await assertOk(res, 'POST /api/uploads')
  return readJsonSafe(res)
}

async function run() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const workerEmail = process.env.WORKER_EMAIL || 'worker@example.com'
  const venueEmail = process.env.VENUE_EMAIL || 'venue@example.com'

  await registerUser(adminEmail, 'admin').catch(() => {})
  await registerUser(workerEmail, 'worker').catch(() => {})
  await registerUser(venueEmail, 'horeca').catch(() => {})

  const adminToken = await login(adminEmail)
  const workerToken = await login(workerEmail)
  const venueToken = await login(venueEmail)

  await uploadDemoFile(workerToken)

  const gig = await postJson(
    '/api/venue/gigs',
    { title: 'Smoke gig', payAmount: 50, currency: 'EUR' },
    venueToken,
  )
  await postJson(`/api/venue/gigs/${gig.id}/publish`, {}, venueToken)

  await postJson(`/api/gigs/${gig.id}/apply`, { workerName: 'Smoke Worker' }, workerToken)
  const apps = await getJson(`/api/venue/gigs/${gig.id}/applications`, venueToken)
  if (!apps?.length) throw new Error('Expected at least one application')
  await postJson(`/api/venue/applications/${apps[0].id}/accept`, {}, venueToken)

  const workerApps = await getJson('/api/worker/applications', workerToken)
  if (!workerApps?.length) throw new Error('Expected worker applications')
  await postJson(`/api/applications/${workerApps[0].id}/complete`, {}, workerToken)
  await postJson(`/api/gigs/${gig.id}/settle`, {}, venueToken)

  const audit = await getJson('/api/admin/audit?limit=10', adminToken)
  if (!audit?.items?.length) throw new Error('Expected audit items')

  console.log('Smoke test completed.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
