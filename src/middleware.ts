import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Mapeo de rutas a permisos requeridos
const ROUTE_PERMISSIONS: Record<string, string> = {
  "/transactions": "transactions",
  "/budgets": "budgets",
  "/accounts": "accounts",
  "/reports": "reports",
  "/settings": "settings",
  "/vision": "vision",
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const permissions = (token?.permissions as any) || {};
    const pathname = req.nextUrl.pathname;

    // Los Administradores tienen acceso total
    if (role === "ADMIN") {
      return NextResponse.next();
    }

    // --- PROTECCIÓN DE RUTAS (PÁGINAS) ---
    // El Dashboard (/) requiere permiso explícito
    if (pathname === "/") {
      if (!permissions.dashboard) {
        // Redirigir a vision si no tiene acceso al dashboard
        if (permissions.vision) {
          return NextResponse.redirect(new URL("/vision", req.url));
        }
      }
      return NextResponse.next();
    }

    // Verificar si la ruta actual requiere un permiso específico
    const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
      pathname.startsWith(route)
    )?.[1];

    if (requiredPermission) {
      if (!permissions[requiredPermission]) {
        // Si no tiene permiso, redirigir a la primera sección que sí tenga permitida
        // Si no tiene ninguna, por defecto a /vision (si la tiene) o login
        if (permissions.vision && pathname !== "/vision") {
          return NextResponse.redirect(new URL("/vision", req.url));
        }
        // Si intenta acceder a algo prohibido y no tiene vision, mandarlo a una página neutra o denegar
        // Por simplicidad redirigimos a /vision si no es admin, asumiendo que es la base.
        if (pathname !== "/vision") {
          return NextResponse.redirect(new URL("/vision", req.url));
        }
      }
    }

    // --- PROTECCIÓN DE APIS ---
    if (pathname.startsWith("/api/")) {
      // APIs públicas o de auth
      if (pathname.startsWith("/api/auth")) return NextResponse.next();

      // Permitir que cualquier usuario acceda a SU PROPIO perfil (/api/users/[id])
      const userProfileMatch = pathname.match(/^\/api\/users\/([^\/]+)$/);
      if (userProfileMatch && userProfileMatch[1] === token?.id) {
        return NextResponse.next();
      }

      // Mapeo de APIs a permisos
      const apiPermissionMap: Record<string, string> = {
        "/api/transactions": "transactions", // Por defecto requiere transacciones
        "/api/budgets": "budgets",
        "/api/accounts": "accounts",
        "/api/reports": "reports",
        "/api/stats": "dashboard",
        "/api/vision": "vision",
        "/api/admin": "admin-only",
        "/api/users": "admin-only",
      };

      const requiredApiPermission = Object.entries(apiPermissionMap).find(([apiPath]) =>
        pathname.startsWith(apiPath)
      )?.[1];

      // --- REGLAS ESPECIALES POR PERMISO ---

      // VISION: Permiso para crear transacciones al escanear
      if (pathname === "/api/transactions" && req.method === "POST" && permissions.vision) {
        return NextResponse.next();
      }

      // REPORTES / VISION: Permiso para LEER datos necesarios para el contexto/análisis
      const isReadOperation = req.method === "GET";
      const isDataNeeded = ["/api/transactions", "/api/budgets", "/api/accounts", "/api/categories", "/api/stats"].some(path => pathname.startsWith(path));

      if (isReadOperation && isDataNeeded && (permissions.reports || permissions.vision || permissions.dashboard)) {
        return NextResponse.next();
      }

      // --- PROTECCIÓN ESTÁNDAR ---
      if (requiredApiPermission === "admin-only") {
        return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
      }

      if (requiredApiPermission && !permissions[requiredApiPermission]) {
        return NextResponse.json({ error: "Sin permisos para esta operación" }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - public files (logo.png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|login|logo.png|manifest.json|sw.js|robots.txt).*)",
  ],
};