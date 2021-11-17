# photos-server

## Get started
- Install and use Node v16 (last LTS).
- Install yarn (```npm i -g yarn```)
- Install a MongoDB running on default port :27017 (```docker run -p 27017:27017 -d mongo```)

### Install deps
```yarn```

### Initialize database
```yarn db:init```

This project generates fixtures in order to run tests against the database. So having a MongoDB running on Docker (and exposed on :27017 of course) or elsewhere is required.

### Run tests
```yarn run test```

### Lint
```yarn run lint```

### Build
```yarn run build```
