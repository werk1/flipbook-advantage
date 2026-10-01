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
      name: "colorPalette",
      label: { de: "Farbschema", en: "Color palette" },
      type: "select",
      required: true,
      defaultValue: "graphite",
      options: [
        { label: { de: "Graphit", en: "Graphite" }, value: "graphite" },
        { label: { de: "Advantage-Blau gedämpft", en: "Advantage blue (muted)" }, value: "advantage" },
        { label: { de: "Salbei / Stein", en: "Sage / Stone" }, value: "sage" },
      ],
      admin: {
        description: {
          de: "Farben der Reader-Oberfläche. Hell oder Dunkel folgt automatisch dem System bzw. Browser der Besucher.",
          en: "Colors of the reader UI. Light or dark follows the visitor's system or browser automatically.",
        },
      },
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
