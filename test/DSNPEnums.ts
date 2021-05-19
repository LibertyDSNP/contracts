/**
 * TypeScript enums to match IDelegation
 * APPEND ONLY
 */
export enum DelegationPermission {
  NONE = 0x0,
  ANNOUNCE = 0x1,
  OWNERSHIP_TRANSFER = 0x2,
  DELEGATE_ADD = 0x3,
  DELEGATE_REMOVE = 0x4,
}

export enum DelegationRole {
  NONE = 0x0,
  OWNER = 0x1,
  ANNOUNCER = 0x2,
}
