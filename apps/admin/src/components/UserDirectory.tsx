import type { AdminUser } from "@boccone/api-client";
import { Button, Field, Input, Text } from "@boccone/ui-web";

interface UserDirectoryProps {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
  search: string;
  loading: boolean;
  selectedUserId: string | null;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onSelect: (userId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function UserDirectory({
  users,
  total,
  limit,
  offset,
  search,
  loading,
  selectedUserId,
  onSearchChange,
  onSearch,
  onSelect,
  onPrevious,
  onNext,
}: UserDirectoryProps) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="admin-directory" aria-labelledby="users-heading">
      <div className="admin-section-heading">
        <div>
          <Text as="h2" id="users-heading">
            Users
          </Text>
          <Text variant="bodySm" tone="secondary">
            {total} accounts
          </Text>
        </div>
      </div>
      <form
        className="admin-search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <Field fieldId="user-search" label="Search by email">
          <Input
            id="user-search"
            placeholder="name@example.com"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </Field>
        <Button variant="secondary" type="submit">
          Search
        </Button>
      </form>
      {loading ? (
        <Text role="status" tone="secondary">
          Loading accounts…
        </Text>
      ) : null}
      {!loading && users.length === 0 ? (
        <div className="admin-empty-state">
          <Text variant="headingSm">No accounts found</Text>
          <Text variant="bodySm" tone="secondary">
            Try a different email search.
          </Text>
        </div>
      ) : null}
      <div className="admin-user-list">
        {users.map((user) => (
          <button
            className={`admin-user-row${selectedUserId === user.id ? " is-selected" : ""}`}
            key={user.id}
            type="button"
            onClick={() => onSelect(user.id)}
          >
            <span>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
            <span className="admin-user-row-meta">
              <span className={`admin-status ${user.banned ? "is-banned" : "is-active"}`}>
                {user.banned ? "Banned" : "Active"}
              </span>
              <small>{user.role}</small>
            </span>
          </button>
        ))}
      </div>
      <div className="admin-pagination" aria-label="User list pagination">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={offset === 0 || loading}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Text className="admin-muted">
          Page {page} of {totalPages}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={offset + limit >= total || loading}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
