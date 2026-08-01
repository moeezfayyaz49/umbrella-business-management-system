export const Role = {
  Admin: 'Admin',
  Accountant: 'Accountant',
  Employee: 'Employee',
} as const;

export type RoleType = typeof Role[keyof typeof Role];

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: RoleType;
}
