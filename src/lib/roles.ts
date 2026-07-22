export const ROLES = {
  OWNER: "owner",
  EDITOR: "editor",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
