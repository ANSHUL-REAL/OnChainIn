/**
 * Keep registration forms short and unique.
 * AI/organizer drafts often repeat "Name", "Full Name", "Email" — strip those
 * and always use one clean core set + a few unique extras.
 */

export type DraftFormField = {
  label: string
  field_type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'checkbox'
  required: boolean
  options: string[]
  sort_order?: number
}

const CORE_FIELDS: DraftFormField[] = [
  { label: 'Full Name', field_type: 'text', required: true, options: [] },
  { label: 'Email', field_type: 'email', required: true, options: [] },
  { label: 'Phone Number', field_type: 'phone', required: true, options: [] },
  { label: 'College / Organization', field_type: 'text', required: false, options: [] },
  { label: 'Why do you want to attend?', field_type: 'textarea', required: false, options: [] },
]

/** Map messy labels to a canonical bucket */
function fieldBucket(label: string, fieldType?: string): string {
  const raw = (label || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const compact = raw.replace(/\s+/g, '')

  if (
    fieldType === 'email' ||
    compact === 'email' ||
    compact === 'emailid' ||
    compact === 'emailaddress' ||
    compact === 'mail' ||
    compact.includes('email')
  ) {
    return 'email'
  }
  if (
    fieldType === 'phone' ||
    compact === 'phone' ||
    compact === 'phonenumber' ||
    compact === 'mobile' ||
    compact === 'mobilenumber' ||
    compact === 'whatsapp' ||
    compact === 'contact' ||
    compact.includes('phone') ||
    compact.includes('mobile')
  ) {
    return 'phone'
  }
  if (
    compact === 'name' ||
    compact === 'fullname' ||
    compact === 'yourname' ||
    compact === 'participantname' ||
    compact === 'studentname' ||
    compact === 'firstname' ||
    compact === 'lastname' ||
    raw === 'full name' ||
    raw === 'your full name' ||
    raw === 'participant name'
  ) {
    return 'name'
  }
  if (
    compact.includes('college') ||
    compact.includes('organization') ||
    compact.includes('organisation') ||
    compact.includes('university') ||
    compact.includes('institute') ||
    compact === 'company'
  ) {
    return 'org'
  }
  if (
    compact.includes('why') ||
    compact.includes('motivation') ||
    compact.includes('reason') ||
    compact.includes('expect')
  ) {
    return 'why'
  }

  return `custom:${compact || 'field'}`
}

/**
 * Deduplicate + cap fields for a clean participant form.
 * Always keeps: Full Name, Email, Phone, College, Why attend?
 * Plus up to `maxExtras` unique custom questions from AI/organizer.
 */
export function normalizeRegistrationFormFields(
  fields: Array<Partial<DraftFormField> | null | undefined> | null | undefined,
  maxExtras = 3,
): DraftFormField[] {
  const input = Array.isArray(fields) ? fields.filter(Boolean) as Partial<DraftFormField>[] : []
  const seenBuckets = new Set<string>(['name', 'email', 'phone', 'org', 'why'])
  const extras: DraftFormField[] = []

  for (const raw of input) {
    const label = (raw.label || '').trim()
    if (!label) continue
    const field_type = (raw.field_type || 'text') as DraftFormField['field_type']
    const bucket = fieldBucket(label, field_type)

    // Drop duplicates of core identity fields (AI often repeats these)
    if (bucket === 'name' || bucket === 'email' || bucket === 'phone' || bucket === 'org' || bucket === 'why') {
      continue
    }
    if (seenBuckets.has(bucket)) continue
    seenBuckets.add(bucket)

    extras.push({
      label: label.slice(0, 80),
      field_type: ['text', 'textarea', 'number', 'email', 'phone', 'select', 'checkbox'].includes(field_type)
        ? field_type
        : 'text',
      required: Boolean(raw.required),
      options: Array.isArray(raw.options) ? raw.options.filter(Boolean).slice(0, 12) : [],
    })

    if (extras.length >= maxExtras) break
  }

  return [...CORE_FIELDS, ...extras].map((f, index) => ({
    ...f,
    sort_order: index,
  }))
}

export function defaultRegistrationFormFields(): DraftFormField[] {
  return CORE_FIELDS.map((f, index) => ({ ...f, sort_order: index }))
}
