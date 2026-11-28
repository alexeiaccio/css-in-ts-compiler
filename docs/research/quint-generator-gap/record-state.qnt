// Record state: the Roomy pattern puts the whole world in one record var.
module record_state {
  var world: { members: int, admins: int }

  action init = all { world' = { members: 0, admins: 0 } }
  action addMember = all {
    world' = { ...world, members: world.members + 1 }
  }
  action step = any { init, addMember }
}
