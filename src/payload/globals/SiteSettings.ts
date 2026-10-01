import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: { de: "Seiteneinstellungen", en: "Site Settings" },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "siteTitle",
      label: { de: "Seitentitel", en: "Site Title" },
      type: "text",
      required: true,
      defaultValue: "W1 System Core",
      localized: true,
    },
    {
      name: "siteDescription",
      label: { de: "Seitenbeschreibung", en: "Site Description" },
      type: "textarea",
      defaultValue: "W1 System Core",
      localized: true,
    },
    {
      name: "colorScheme",
      label: { de: "Farbschema", en: "Color scheme" },
      type: "relationship",
      relationTo: "color-schemes",
      admin: {
        description: {
          de: "Farben der Reader-Oberfläche (Collection Farbschemata). Ohne Auswahl gilt Graphit. Hell oder Dunkel folgt automatisch dem System bzw. Browser der Besucher.",
          en: "Colors of the reader UI (Colour schemes collection). Graphite when empty. Light or dark follows the visitor's system or browser automatically.",
        },
      },
    },
    {
      name: "clientLogo",
      label: { de: "Kundenlogo", en: "Client logo" },
      type: "group",
      admin: {
        description: {
          de: "Logo: ersetzt den Namen links oben im Reader. Piktogramm: steht am Handy im Querformat oben in der schmalen Leiste. PNG mit transparentem Hintergrund. Ist nur eine Variante geladen, gilt sie für Hell und Dunkel.",
          en: "Logo: replaces the name at the top left of the reader. Pictogram: sits at the top of the slim bar on phones in landscape. PNG with a transparent background. If only one variant is set it is used for light and dark.",
        },
      },
      fields: [
        {
          name: "positive",
          label: { de: "Logo positiv (für helle Flächen)", en: "Logo positive (for light surfaces)" },
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { contains: "image" } },
        },
        {
          name: "negative",
          label: { de: "Logo negativ (für dunkle Flächen)", en: "Logo negative (for dark surfaces)" },
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { contains: "image" } },
        },
        {
          name: "pictogramPositive",
          label: { de: "Piktogramm positiv (für helle Flächen)", en: "Pictogram positive (for light surfaces)" },
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { contains: "image" } },
          admin: {
            description: {
              de: "Quadratisches Bildzeichen für die schmale Leiste am Handy im Querformat. Ohne Piktogramm steht dort der Anfangsbuchstabe als rundes Zeichen in der Primärfarbe.",
              en: "Square mark for the slim bar on phones in landscape. Without a pictogram the initial is shown as a round badge in the primary colour.",
            },
          },
        },
        {
          name: "pictogramNegative",
          label: { de: "Piktogramm negativ (für dunkle Flächen)", en: "Pictogram negative (for dark surfaces)" },
          type: "upload",
          relationTo: "media",
          filterOptions: { mimeType: { contains: "image" } },
        },
      ],
    },
    {
      name: "navigation",
      label: { de: "Navigation", en: "Navigation" },
      type: "array",
      admin: {
        description: {
          de: "Zentrales Navigationsmodell für Onepager und mehrseitige Apps.",
          en: "Central navigation model for one-pager and multi-page apps.",
        },
      },
      fields: [
        {
          name: "label",
          label: { de: "Bezeichnung", en: "Label" },
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "href",
          label: { de: "Link", en: "Link" },
          type: "text",
          required: true,
        },
        {
          name: "order",
          label: { de: "Reihenfolge", en: "Order" },
          type: "number",
          defaultValue: 0,
          required: true,
        },
        {
          name: "openInNewTab",
          label: { de: "In neuem Tab öffnen", en: "Open in New Tab" },
          type: "checkbox",
          defaultValue: false,
        },
      ],
    },
  ],
};
