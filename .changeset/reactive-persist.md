---
"@cssints/reactive": minor
---

`persist(value, key)` keeps a state in `localStorage` across a reload: the runtime restores it when the owner is initialised (a stored value wins over the declared one) and stores it on every write, with the keys in a new non-inheriting `--reactive-persist` protocol property.
