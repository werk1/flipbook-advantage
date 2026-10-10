import type { Access, CollectionConfig } from 'payload'

const isAdmin = (user: unknown) => Boolean((user as { roles?: string[] } | null)?.roles?.includes('admin'))
const adminOnly: Access = ({ req: { user } }) => isAdmin(user)

/**
 * A series groups the issues of a publication (e.g. one magazine). Flipbooks
 * choose theirs in the field `series`; the reader search can then look through
 * all issues of the series at once.
 */
export const FlipbookSeries: CollectionConfig = {
  slug: 'flipbook-series',
  labels: {
    singular: { de: 'Serie', en: 'Series' },
    plural: { de: 'Serien', en: 'Series' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
    description: {
      de: 'Fasst die Ausgaben einer Publikation zusammen. Die Suche im Reader kann dann alle Ausgaben einer Serie durchsuchen.',
      en: 'Groups the issues of a publication. The reader search can then look through all issues of a series.',
    },
  },
  access: { read: () => true, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [{ name: 'title', label: { de: 'Titel', en: 'Title' }, type: 'text', required: true }],
}
