import { mkdirSync, rmSync } from 'fs'
import path from 'path'

const TMP_DIR = path.join(process.cwd(), '.tmp-audit-tests')

beforeEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true })
  mkdirSync(TMP_DIR, { recursive: true })
  process.env.AUDIT_DATA_DIR = TMP_DIR
  process.env.BACKEND_ORIGIN = 'http://backend.test'
})

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true })
})
