FROM node:alpine

LABEL "com.github.actions.name"="commitlint"
LABEL "com.github.actions.description"="Lint your commit messages"
LABEL "com.github.actions.icon"="check-circle"
LABEL "com.github.actions.color"="gray-dark"

COPY . .
RUN npm ci

ENTRYPOINT ["node", "/index.js"]
