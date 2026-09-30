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
