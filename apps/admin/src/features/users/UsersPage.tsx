import { useEffect, useState } from "react";

import type { AdminUser } from "@boccone/api-client";
import { Alert, Button, Field, Input, Surface, Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
import { CreateUserForm } from "../../components/CreateUserForm";
import { fetchAdminUsers } from "../../lib/admin-api";
import { useAdminRouter } from "../../lib/navigation-context";
import { userPath } from "../../lib/navigation";

const PAGE_SIZE = 20;

export function UsersPage() {
  const { navigate } = useAdminRouter();
  const initialQuery = new URLSearchParams(window.location.search);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(initialQuery.get("q") ?? "");
  const [activeSearch, setActiveSearch] = useState(initialQuery.get("q") ?? "");
  const [offset, setOffset] = useState(Number(initialQuery.get("page") ?? 0) * PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(initialQuery.get("create") === "1");

  useEffect(() => {
    let mounted = true;
    // This effect synchronizes the directory view with the remote request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    void fetchAdminUsers({ search: activeSearch, limit: PAGE_SIZE, offset })
      .then((result) => {
        if (!mounted) return;
        setUsers(result.users);
        setTotal(result.total);
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
  }, [activeSearch, offset]);

  function updateUrl(next: { search?: string; page?: number; create?: boolean }) {
    const params = new URLSearchParams();
    const nextSearch = next.search ?? activeSearch;
    const nextPage = next.page ?? Math.floor(offset / PAGE_SIZE);
    const nextCreate = next.create ?? showCreate;
    if (nextSearch) params.set("q", nextSearch);
    if (nextPage > 0) params.set("page", String(nextPage));
    if (nextCreate) params.set("create", "1");
    const query = params.toString();
    navigate(`/users${query ? `?${query}` : ""}`, true);
  }

  function submitSearch() {
    const nextSearch = search.trim();
    setActiveSearch(nextSearch);
    setOffset(0);
    updateUrl({ search: nextSearch, page: 0 });
  }

  function setPage(nextOffset: number) {
    setOffset(nextOffset);
    updateUrl({ page: Math.floor(nextOffset / PAGE_SIZE) });
  }

  return (
    <div className="admin-route-content">
      <div className="admin-route-intro admin-route-intro-row">
        <div>
          <Text as="h2" variant="headingLg">
            Users
          </Text>
          <Text tone="secondary">Find an account, then open its dedicated workspace.</Text>
        </div>
        <Button
          type="button"
          onClick={() => {
            const next = !showCreate;
            setShowCreate(next);
            updateUrl({ create: next });
          }}
        >
          {showCreate ? "Close create form" : "New user"}
        </Button>
      </div>
      {showCreate ? (
        <CreateUserForm
          onCreated={(user) => {
            setShowCreate(false);
            updateUrl({ create: false });
            navigate(userPath(user.id));
          }}
        />
      ) : null}
      <Surface className="admin-resource-surface">
        <div className="admin-resource-heading">
          <div>
            <Text as="h3" variant="headingMd">
              Account directory
            </Text>
            <Text variant="bodySm" tone="secondary">
              {total} {total === 1 ? "account" : "accounts"}
            </Text>
          </div>
        </div>
        <form
          className="admin-filter-bar"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <Field fieldId="user-search" label="Search users">
            <Input
              id="user-search"
              placeholder="Search by email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {activeSearch ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch("");
                setActiveSearch("");
                setOffset(0);
                updateUrl({ search: "", page: 0 });
              }}
            >
              Clear
            </Button>
          ) : null}
        </form>
        {error ? <Alert tone="danger" message={error} /> : null}
        {loading ? (
          <Text role="status" tone="secondary">
            Loading accounts…
          </Text>
        ) : null}
        {!loading && users.length === 0 ? (
          <div className="admin-empty-state">
            <Text variant="headingSm">No accounts found</Text>
            <Text variant="bodySm" tone="secondary">
              {activeSearch ? "Try a different search." : "New accounts will appear here."}
            </Text>
          </div>
        ) : null}
        {users.length > 0 ? <UserTable users={users} /> : null}
        <div className="admin-pagination">
          <Text variant="bodySm" tone="secondary">
            {total === 0
              ? "No results"
              : `Showing ${offset + 1}–${Math.min(offset + users.length, total)} of ${total}`}
          </Text>
          <div className="admin-pagination-actions">
            <Button
              disabled={loading || offset === 0}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setPage(Math.max(0, offset - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              disabled={loading || offset + PAGE_SIZE >= total}
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setPage(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      </Surface>
    </div>
  );
}

function UserTable({ users }: { users: AdminUser[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Status</th>
            <th scope="col">Role</th>
            <th scope="col">Joined</th>
            <th scope="col">
              <span className="admin-visually-hidden">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <AdminLink className="admin-table-primary" to={userPath(user.id)}>
                  {user.name}
                </AdminLink>
                <span className="admin-table-secondary">{user.email}</span>
              </td>
              <td>
                <span className={`admin-status ${user.banned ? "is-banned" : "is-active"}`}>
                  {user.banned ? "Banned" : "Active"}
                </span>
              </td>
              <td className="admin-table-capitalize">{user.role}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="admin-table-action">
                <AdminLink className="admin-text-link" to={userPath(user.id)}>
                  Open
                </AdminLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
