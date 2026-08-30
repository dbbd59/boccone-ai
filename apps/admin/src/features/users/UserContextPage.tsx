import { useEffect, useState } from "react";

import type { AdminUser } from "@boccone/api-client";
import { Surface, Text } from "@boccone/ui-web";

import { AdminLink } from "../../components/AdminLink";
import { fetchAdminUser } from "../../lib/admin-api";
import { useAdminRouter } from "../../lib/navigation-context";
import { userPath, type UserSection } from "../../lib/navigation";
import { UserAccountPage } from "./UserAccountPage";
import { UserMealsPage } from "./UserMealsPage";
import { UserNutritionPage } from "./UserNutritionPage";
import { UserOverviewPage } from "./UserOverviewPage";
import { UserProfilePage } from "./UserProfilePage";
import { UserMealDetailPage } from "./UserMealDetailPage";

type ContextSection = UserSection | "meal-detail";

const USER_NAVIGATION: { label: string; section: UserSection }[] = [
  { label: "Overview", section: "overview" },
  { label: "Profile", section: "profile" },
  { label: "Meals", section: "meals" },
  { label: "Nutrition", section: "nutrition" },
  { label: "Account", section: "account" },
];

export function UserContextPage({
  userId,
  currentAdminId,
  locationKey,
  section,
  mealId,
}: {
  userId: string;
  currentAdminId: string;
  locationKey: string;
  section: ContextSection;
  mealId?: string;
}) {
  const { navigate } = useAdminRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetchAdminUser(userId)
      .then((nextUser) => {
        if (mounted) setUser(nextUser);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : "Unable to load user");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="admin-route-state">
        <Text role="status" tone="secondary">
          Loading user workspace…
        </Text>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-route-state">
        <Text as="h2" variant="headingLg">
          User not found
        </Text>
        <Text tone="secondary">{error ?? "This account is unavailable."}</Text>
        <AdminLink className="admin-text-link" to="/users">
          Back to users
        </AdminLink>
      </div>
    );
  }

  return (
    <div className="admin-route-content">
      <nav aria-label="Breadcrumbs" className="admin-breadcrumbs">
        <AdminLink to="/users">Users</AdminLink>
        <span aria-hidden="true">/</span>
        <span>{user.name}</span>
        {section !== "overview" && section !== "meal-detail" ? (
          <>
            <span aria-hidden="true">/</span>
            <span>{sectionLabel(section)}</span>
          </>
        ) : null}
        {section === "meal-detail" ? (
          <>
            <span aria-hidden="true">/</span>
            <span>Meals</span>
            <span aria-hidden="true">/</span>
            <span>Meal details</span>
          </>
        ) : null}
      </nav>
      <Surface className="admin-user-context-header">
        <div className="admin-user-identity">
          <div className="admin-avatar" aria-hidden="true">
            {initials(user.name)}
          </div>
          <div>
            <Text as="h2" variant="headingLg">
              {user.name}
            </Text>
            <Text variant="bodySm" tone="secondary">
              {user.email}
            </Text>
          </div>
        </div>
        <span className={`admin-status ${user.banned ? "is-banned" : "is-active"}`}>
          {user.banned ? "Banned" : "Active"}
        </span>
      </Surface>
      <nav aria-label={`${user.name} sections`} className="admin-secondary-nav">
        {USER_NAVIGATION.map((item) => (
          <AdminLink
            aria-current={activeSection(section) === item.section ? "page" : undefined}
            className={activeSection(section) === item.section ? "is-active" : undefined}
            key={item.section}
            to={userPath(user.id, item.section)}
          >
            {item.label}
          </AdminLink>
        ))}
      </nav>
      <UserSectionView
        key={
          section === "meals"
            ? locationKey
            : section === "meal-detail"
              ? `${section}:${mealId ?? ""}`
              : section
        }
        currentAdminId={currentAdminId}
        mealId={mealId}
        onRemoved={() => navigate("/users")}
        onUserChanged={setUser}
        section={section}
        user={user}
      />
    </div>
  );
}

function UserSectionView({
  user,
  section,
  currentAdminId,
  mealId,
  onUserChanged,
  onRemoved,
}: {
  user: AdminUser;
  section: ContextSection;
  currentAdminId: string;
  mealId?: string;
  onUserChanged: (user: AdminUser) => void;
  onRemoved: () => void;
}) {
  switch (section) {
    case "overview":
      return <UserOverviewPage user={user} />;
    case "profile":
      return <UserProfilePage user={user} onChanged={onUserChanged} />;
    case "meals":
      return <UserMealsPage user={user} />;
    case "nutrition":
      return <UserNutritionPage user={user} />;
    case "account":
      return (
        <UserAccountPage
          currentAdminId={currentAdminId}
          user={user}
          onChanged={onUserChanged}
          onRemoved={onRemoved}
        />
      );
    case "meal-detail":
      return mealId ? <UserMealDetailPage mealId={mealId} user={user} /> : null;
  }
}

function activeSection(section: ContextSection): UserSection {
  return section === "meal-detail" ? "meals" : section;
}

function sectionLabel(section: UserSection): string {
  return section.charAt(0).toUpperCase() + section.slice(1);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
