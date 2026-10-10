import type { CollectionConfig } from 'payload'

/**
 * Search index of the published flipbooks, one row per text block, for the
 * search across the issues of a series. Never edited by hand: the search
 * builds the rows of a flipbook from its text model (`ensureIndexed` in
 * `lib/flipbook/seriesSearch.ts`) and replaces them when the searchable text
 * changes (`indexKey`). Not readable through the API; only the server reads it.
 */
export const FlipbookSearchBlocks: CollectionConfig = {
  slug: 'flipbook-search-blocks',
  labels: {
    singular: { de: 'Suchindex-Block', en: 'Search index block' },
    plural: { de: 'Suchindex', en: 'Search index' },
  },
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  timestamps: false,
  fields: [
    { name: 'flipbook', type: 'text', required: true, index: true },
    // Version of the indexed text (see `indexKeyOf`): rows of an older one are stale.
    { name: 'indexKey', type: 'text', required: true, index: true },
    { name: 'pageIndex', type: 'number', required: true },
    { name: 'blockId', type: 'text', required: true },
    { name: 'text', type: 'textarea', required: true },
    // Normalized terms of the block (`normalizeTerms`): the multikey index of the search.
    { name: 'terms', type: 'text', hasMany: true, index: true },
  ],
}
