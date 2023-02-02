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

### For Dockerfile to work, we must copy the project inside bin/delete-photos
```mkdir bin/delete-photos/photos-server-copy```
```rsync -av --progress /path-to/photos-server /path-to/photos-server/bin/delete-photos/photos-server-copy --exclude /path-to/photos-server/bin```
Don't remember to delete all files related with github inside this folder.
