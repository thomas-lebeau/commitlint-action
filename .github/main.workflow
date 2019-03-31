workflow "Lint" {
  on = "push"
  resolves = ["Commitlint"]
}

action "Commitlint" {
  uses = "./"
  secrets = ["GITHUB_TOKEN"]
}
