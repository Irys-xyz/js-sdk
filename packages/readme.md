# Irys JS SDK monorepository
This monorepo contains all the packages that comprise the Irys JS SDK



## Developer notes

Some important 'gotchas':
- While Node.JS/bundlers will resolve code through package.json export paths, Typescript *will NOT if it's moduleResolution is node* - so make sure all public facing types are exported/imported through index.ts barrel files.