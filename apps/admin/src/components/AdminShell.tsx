import { useEffect, useState } from "react";

import type { AdminUser } from "@boccone/api-client";
import { Button, Screen, Surface, Text } from "@boccone/ui-web";

import { AuditLogPanel } from "./AuditLogPanel";
import { AdminIcon } from "./AdminIcon";
import { BrandMark } from "./BrandMark";
import { CreateUserForm } from "./CreateUserForm";
import { ThemeToggle } from "./ThemeToggle";
import { UserDetail } from "./UserDetail";
import { UserDirectory } from "./UserDirectory";
import { fetchAdminUsers } from "../lib/admin-api";
import { authClient } from "../lib/auth-client";
import { readSidebarCollapsed, storeSidebarCollapsed } from "../lib/sidebar-state";

const PAGE_SIZE = 20;

export function AdminShell({ email, userId }: { email: string; userId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    storeSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  useEffect(() => {
    let mounted = true;
    // This effect synchronizes the view with the remote directory request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void fetchAdminUsers({ search: activeSearch, limit: PAGE_SIZE, offset })
      .then((result) => {
        if (!mounted) return;
        setUsers(result.users);
        setTotal(result.total);
        const firstUser = result.users[0];
        if (firstUser) {
          setSelectedUserId((current) => current ?? firstUser.id);
        }
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load users");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeSearch, offset, refreshToken]);

  function handleChanged(user: AdminUser) {
    setUsers((current) => current.map((entry) => (entry.id === user.id ? user : entry)));
    setRefreshToken((value) => value + 1);
  }

  function handleCreated(user: AdminUser) {
    setShowCreate(false);
    setSelectedUserId(user.id);
    setOffset(0);
    setRefreshToken((value) => value + 1);
  }

  function handleRemoved(userIdToRemove: string) {
    setSelectedUserId(null);
    setRefreshToken((value) => value + 1);
    setUsers((current) => current.filter((user) => user.id !== userIdToRemove));
  }

  return (
    <Screen className="admin-screen">
      <div className={`admin-shell${sidebarCollapsed ? " is-collapsed" : ""}`}>
        <button
          aria-label="Close navigation"
          className={`admin-sidebar-backdrop${sidebarOpen ? " is-visible" : ""}`}
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
        <aside
          aria-label="Operations navigation"
          className={`admin-sidebar${sidebarOpen ? " is-open" : ""}`}
        >
          <div className="admin-sidebar-top">
            <div className="admin-sidebar-brand" aria-label="Boccone AI Operations">
              <BrandMark size={32} />
              <span className="admin-sidebar-brand-label">BOCCONE AI</span>
            </div>
            <button
              aria-label={
                sidebarOpen
                  ? "Close navigation"
                  : sidebarCollapsed
                    ? "Expand navigation"
                    : "Collapse navigation"
              }
              className="admin-sidebar-toggle"
              onClick={() => {
                if (sidebarOpen) {
                  setSidebarOpen(false);
                } else {
                  setSidebarCollapsed((collapsed) => !collapsed);
                }
              }}
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
            <Text className="admin-sidebar-eyebrow" variant="caption" tone="secondary">
              Workspace
            </Text>
            <a
              aria-current="page"
              className="admin-nav-item is-active"
              href="#accounts"
              onClick={() => setSidebarOpen(false)}
              title="Accounts"
            >
              <AdminIcon name="accounts" />
              <span>Accounts</span>
            </a>
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
                  className="admin-mobile-menu"
                  onClick={() => setSidebarOpen(true)}
                  type="button"
                >
                  <AdminIcon name="menu" />
                  <span>Menu</span>
                </button>
                <Text as="h1" variant="title">
                  User management
                </Text>
                <Text tone="secondary">Keep account access clear, deliberate and traceable.</Text>
              </div>
            </header>
            <div className="admin-toolbar" aria-label="User management actions" id="accounts">
              <div>
                <Text variant="headingSm">Accounts</Text>
                <Text variant="bodySm" tone="secondary">
                  Server-authorized changes are recorded in the audit log.
                </Text>
              </div>
              <Button type="button" onClick={() => setShowCreate((visible) => !visible)}>
                {showCreate ? "Close create form" : "New user"}
              </Button>
            </div>
            {showCreate ? <CreateUserForm onCreated={handleCreated} /> : null}
            {error ? <Text className="admin-error">{error}</Text> : null}
            <div className="admin-management-grid">
              <Surface>
                <UserDirectory
                  users={users}
                  total={total}
                  limit={PAGE_SIZE}
                  offset={offset}
                  search={search}
                  loading={loading}
                  selectedUserId={selectedUserId}
                  onSearchChange={setSearch}
                  onSearch={() => {
                    setOffset(0);
                    setActiveSearch(search.trim());
                  }}
                  onSelect={setSelectedUserId}
                  onPrevious={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
                  onNext={() => setOffset((value) => value + PAGE_SIZE)}
                />
              </Surface>
              <UserDetail
                userId={selectedUserId}
                currentAdminId={userId}
                refreshToken={refreshToken}
                onChanged={handleChanged}
                onRemoved={handleRemoved}
              />
            </div>
            <Surface>
              <AuditLogPanel refreshToken={refreshToken} />
            </Surface>
          </main>
        </div>
      </div>
    </Screen>
  );
}
