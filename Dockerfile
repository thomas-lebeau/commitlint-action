FROM node:alpine

LABEL "com.github.actions.name"="commitlint"
LABEL "com.github.actions.description"="Lint your commit messages"
LABEL "com.github.actions.icon"="check-circle"
LABEL "com.github.actions.color"="gray-dark"

RUN npm install commitlint @commitlint/config-conventional

ENTRYPOINT ["commitlint", "-e", "-x", "@commitlint/config-conventional"]
