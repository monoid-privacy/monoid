---
sidebar_position: 1
sidebar_label: "Deploy Monoid"
---
# Deploy Monoid

Deploying Monoid Open-Source locally takes just a couple of steps:

:::tip

You'll need to have Docker installed to follow these instructions. If you don't have Docker already, you can get it [here](https://www.docker.com/products/docker-desktop).

:::

1. Generate an encryption key with `openssl rand -base64 32`
2. Run the following commands:

```
git clone https://github.com/monoid-privacy/monoid.git
cd monoid
ENCRYPTION_KEY=[key generated in the previous step] docker compose up
```

3. Navigate to `localhost:8080` to create your workspace
