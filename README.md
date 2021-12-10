# photos-server

## Get started
- Install and use Node v16 (last LTS).
- Install yarn (```npm i -g yarn```)
- Install a MongoDB running on default port :27017 (```docker run -p 27017:27017 -d mongo```)

### Installation
- Create a `.npmrc` file from the `.npmrc.template` example provided in the repo.
- Replace `TOKEN` with your own [Github Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token) with `read:packages` permission **ONLY**

### Initialize database
```yarn db:init```

This project generates fixtures in order to run tests against the database. So having a MongoDB running on Docker (and exposed on :27017 of course) or elsewhere is required.

### Run tests
```yarn run test```

### Lint
```yarn run lint```

### Build
```yarn run build```
