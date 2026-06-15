# Claude (Static Site)

This folder contains a static site. Use Vercel to deploy quickly.

Deploy options:

- From your machine (requires `npm` and `vercel` CLI):

```bash
# install vercel CLI
npm i -g vercel
# login and deploy
vercel login
vercel
```

- From Git (recommended):
  1. Create a GitHub repo and push this folder.
  2. Connect the repo to Vercel and import the project.

Local preview:

```bash
# from this folder
ruby -run -e httpd . -p 8000
# open http://localhost:8000/locdoula.html
```
