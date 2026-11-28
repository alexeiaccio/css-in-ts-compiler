// Map state: roles: RoleId -> Role, grants: GrantId -> Grant.
module map_state {
  var roles: str -> int

  action init = all { roles' = Map() }
  action setRole = {
    nondet r = Set("admin", "member").oneOf()
    all { roles' = roles.set(r, 1) }
  }
  action step = any { init, setRole }
}
