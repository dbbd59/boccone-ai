import { useEffect, useState } from "react";

import { Button, Screen, Text } from "@boccone/ui-web";

import { AdminLink } from "./AdminLink";
import { AdminIcon, type AdminIconName } from "./AdminIcon";
import { BrandMark } from "./BrandMark";
import { ThemeToggle } from "./ThemeToggle";
import { OverviewPage } from "../features/overview/OverviewPage";
import { MealsPage, GlobalMealDetailPage } from "../features/meals/MealsPage";
import { NutritionPage } from "../features/nutrition/NutritionPage";
import { AuditPage } from "../features/system/AuditPage";
import { SettingsPage } from "../features/system/SettingsPage";
import { UserContextPage } from "../features/users/UserContextPage";
import { UsersPage } from "../features/users/UsersPage";
import {
  FoodDetailPage,
  FoodSubmissionDetailPage,
  FoodSubmissionsPage,
  FoodsPage,
} from "../features/foods/FoodsPage";
import { useAdminHistory } from "../lib/navigation-context";
import { AdminNavigationProvider } from "../lib/navigation-provider";
import { isUserRouteActive, type AdminRoute } from "../lib/navigation";
import { authClient } from "../lib/auth-client";
import { readSidebarCollapsed, storeSidebarCollapsed } from "../lib/sidebar-state";

const NAVIGATION: {
  label: string;
  items: {
    label: string;
    path: string;
    icon: AdminIconName;
    active: (route: AdminRoute) => boolean;
  }[];
}[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        path: "/",
        icon: "overview",
        active: (route) => route.kind === "overview",
      },
      { label: "Users", path: "/users", icon: "users", active: isUserRouteActive },
      {
        label: "Meals",
        path: "/meals",
        icon: "meals",
        active: (route) => route.kind === "meals" || route.kind === "meal",
      },
      {
        label: "Nutrition",
        path: "/nutrition",
        icon: "nutrition",
        active: (route) => route.kind === "nutrition",
      },
      {
        label: "Food catalog",
        path: "/foods",
        icon: "foods",
        active: (route) => route.kind === "foods" || route.kind === "food",
      },
      {
        label: "Food review",
        path: "/food-submissions",
        icon: "review",
        active: (route) => route.kind === "food-submissions" || route.kind === "food-submission",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Audit log",
        path: "/audit-log",
        icon: "audit",
        active: (route) => route.kind === "audit",
      },
      {
        label: "Settings",
        path: "/settings",
        icon: "settings",
        active: (route) => route.kind === "settings",
      },
    ],
  },
];

export function AdminShell({ email, userId }: { email: string; userId: string }) {
  const navigation = useAdminHistory();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(
    () => window.matchMedia("(max-width: 980px)").matches,
  );

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      storeSidebarCollapsed(next);
      return next;
    });
  }

  useEffect(() => {
    const media = window.matchMedia("(max-width: 980px)");
    const onViewportChange = (event: MediaQueryListEvent) => setIsNarrowViewport(event.matches);
    media.addEventListener("change", onViewportChange);
    return () => media.removeEventListener("change", onViewportChange);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  const mobileSidebarHidden = isNarrowViewport && !sidebarOpen;

  return (
    <AdminNavigationProvider {...navigation}>
      <Screen className="admin-screen">
        <div className={`admin-shell${sidebarCollapsed ? " is-collapsed" : ""}`}>
          <button
            aria-label="Close navigation"
            aria-hidden={!sidebarOpen}
            className={`admin-sidebar-backdrop${sidebarOpen ? " is-visible" : ""}`}
            onClick={() => setSidebarOpen(false)}
            tabIndex={sidebarOpen ? 0 : -1}
            type="button"
          />
          <aside
            id="admin-navigation"
            aria-label="Operations navigation"
            aria-hidden={mobileSidebarHidden || undefined}
            className={`admin-sidebar${sidebarOpen ? " is-open" : ""}`}
            inert={mobileSidebarHidden ? true : undefined}
          >
            <div className="admin-sidebar-top">
              <div className="admin-sidebar-brand" aria-label="Boccone AI Operations">
                <BrandMark size={32} />
                <span className="admin-sidebar-brand-label">BOCCONE AI</span>
              </div>
              <button
                aria-controls="admin-navigation"
                aria-label={
                  sidebarOpen
                    ? "Close navigation"
                    : sidebarCollapsed
                      ? "Expand navigation"
                      : "Collapse navigation"
                }
                className="admin-sidebar-toggle"
                onClick={() => (sidebarOpen ? setSidebarOpen(false) : toggleSidebar())}
                title={
                  sidebarOpen
                    ? "Close navigation"
                    : sidebarCollapsed
                      ? "Expand navigation"
                      : "Collapse navigation"
                }
                type="button"
              >
                <AdminIcon name={sidebarOpen ? "close" : "menu"} />
              </button>
            </div>
            <nav className="admin-sidebar-nav">
              {NAVIGATION.map((group) => (
                <div className="admin-sidebar-group" key={group.label}>
                  <Text className="admin-sidebar-eyebrow" variant="caption" tone="secondary">
                    {group.label}
                  </Text>
                  {group.items.map((item) => {
                    const active = item.active(navigation.route);
                    return (
                      <AdminLink
                        aria-current={active ? "page" : undefined}
                        className={`admin-nav-item${active ? " is-active" : ""}`}
                        key={item.path}
                        onNavigate={() => setSidebarOpen(false)}
                        title={sidebarCollapsed ? item.label : undefined}
                        to={item.path}
                      >
                        <AdminIcon name={item.icon} />
                        <span>{item.label}</span>
                      </AdminLink>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className="admin-sidebar-bottom">
              <div className="admin-sidebar-account">
                <Text className="admin-sidebar-eyebrow" variant="caption" tone="secondary">
                  Signed in as
                </Text>
                <Text className="admin-sidebar-email" variant="bodySm">
                  {email}
                </Text>
              </div>
              <div className="admin-sidebar-actions">
                <ThemeToggle collapsed={sidebarCollapsed} />
                <Button
                  aria-label="Sign out"
                  className={sidebarCollapsed ? "admin-icon-button" : undefined}
                  title={sidebarCollapsed ? "Sign out" : undefined}
                  variant="ghost"
                  onClick={() => void authClient.signOut()}
                >
                  {sidebarCollapsed ? <AdminIcon name="logout" /> : "Sign out"}
                </Button>
              </div>
            </div>
          </aside>
          <div className="admin-workspace">
            <main className="admin-content">
              <header className="admin-header">
                <div className="admin-title-block">
                  <button
                    aria-expanded={sidebarOpen}
                    aria-label="Open navigation"
                    aria-controls="admin-navigation"
                    className="admin-mobile-menu"
                    onClick={() => setSidebarOpen(true)}
                    type="button"
                  >
                    <AdminIcon name="menu" />
                    <span>Menu</span>
                  </button>
                  <Text as="h1" variant="title">
                    {routeTitle(navigation.route)}
                  </Text>
                  <Text tone="secondary">Boccone AI operations workspace.</Text>
                </div>
              </header>
              <RouteView
                email={email}
                locationKey={navigation.locationKey}
                route={navigation.route}
                currentAdminId={userId}
              />
            </main>
          </div>
        </div>
      </Screen>
    </AdminNavigationProvider>
  );
}

function RouteView({
  email,
  locationKey,
  route,
  currentAdminId,
}: {
  email: string;
  locationKey: string;
  route: AdminRoute;
  currentAdminId: string;
}) {
  switch (route.kind) {
    case "overview":
      return <OverviewPage />;
    case "users":
      return <UsersPage key={locationKey} />;
    case "user":
      return (
        <UserContextPage
          key={route.userId}
          currentAdminId={currentAdminId}
          locationKey={locationKey}
          section={route.section}
          userId={route.userId}
        />
      );
    case "user-meal":
      return (
        <UserContextPage
          key={route.userId}
          currentAdminId={currentAdminId}
          locationKey={locationKey}
          mealId={route.mealId}
          section="meal-detail"
          userId={route.userId}
        />
      );
    case "meals":
      return <MealsPage key={locationKey} />;
    case "meal":
      return <GlobalMealDetailPage key={route.mealId} mealId={route.mealId} />;
    case "foods":
      return <FoodsPage key={locationKey} />;
    case "food":
      return <FoodDetailPage key={route.foodId} foodId={route.foodId} />;
    case "food-submissions":
      return <FoodSubmissionsPage key={locationKey} />;
    case "food-submission":
      return (
        <FoodSubmissionDetailPage key={route.submissionId} submissionId={route.submissionId} />
      );
    case "nutrition":
      return <NutritionPage />;
    case "audit":
      return <AuditPage />;
    case "settings":
      return <SettingsPage email={email} />;
    case "not-found":
      return <NotFoundPage />;
  }
}

function routeTitle(route: AdminRoute): string {
  switch (route.kind) {
    case "overview":
      return "Overview";
    case "users":
    case "user":
    case "user-meal":
      return "Users";
    case "meals":
    case "meal":
      return "Meals";
    case "foods":
    case "food":
      return "Food catalog";
    case "food-submissions":
    case "food-submission":
      return "Food review";
    case "nutrition":
      return "Nutrition";
    case "audit":
      return "Audit log";
    case "settings":
      return "Settings";
    case "not-found":
      return "Page not found";
  }
}

function NotFoundPage() {
  return (
    <section className="admin-route-state" aria-labelledby="not-found-title">
      <Text as="h2" id="not-found-title" variant="headingLg">
        This page does not exist
      </Text>
      <Text tone="secondary">Use the sidebar to return to a known workspace.</Text>
      <AdminLink className="admin-text-link" to="/">
        Return to overview
      </AdminLink>
    </section>
  );
}
