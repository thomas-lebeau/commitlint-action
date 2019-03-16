workflow "Limt" {
  on = "push"
  resolves = ["Commitlint"]
}

action "Commitlint" {
  uses = "thomas-lebeau/commitlint-action@master"
}
