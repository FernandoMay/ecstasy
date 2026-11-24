# Contract API Draft

This is the implementation boundary, not a frozen ABI.

| Method | Actor | Effect |
|---|---|---|
| create_encounter | creator | Creates an invitation and optional stake |
| accept_encounter | participant | Records explicit consent |
| decline_encounter | participant | Cancels invitation |
| complete_encounter | participant(s) | Records completion according to contract rule |
| settle_encounter | authorized actor | Transfers escrow and marks settled |
| cancel_encounter | authorized actor | Cancels where allowed |
| submit_afterglow | each participant | Stores one bounded score |
| get_encounter | public | Reads current state |
