import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/contact-imports.tsx"),
  route("/dotdigital", "routes/dotdigital.tsx"),
  route("/addressbooks", "routes/addressbooks.tsx"),
  route("/api/dotdigital", "routes/api.dotdigital.tsx"),
  route("/api/dotdigital-delete", "routes/api.dotdigital-delete.tsx"),
  route("/api/addressbook", "routes/api.addressbook.tsx"),
  route("/api/contact-import/create-list", "routes/api.contact-import.create-list.tsx"),
  route("/api/contact-import/import", "routes/api.contact-import.import.tsx"),
  route("/api/contact-import/status", "routes/api.contact-import.status.tsx"),
  route("/api/accounts", "routes/api.accounts.tsx")
] satisfies RouteConfig;
