import { onRequestPost as __api_auth_js_onRequestPost } from "P:\\literature_platform\\functions\\api\\auth.js"
import { onRequestGet as __api_stats_js_onRequestGet } from "P:\\literature_platform\\functions\\api\\stats.js"

export const routes = [
    {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_js_onRequestPost],
    },
  {
      routePath: "/api/stats",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_stats_js_onRequestGet],
    },
  ]