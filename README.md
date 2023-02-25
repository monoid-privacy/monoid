<p align="center">
 <picture>
   <source srcset="https://storage.googleapis.com/monoid-public-marketing/wordmark-light.png" media="(prefers-color-scheme: dark)">
   <img src="https://storage.googleapis.com/monoid-public-marketing/wordmark-dark.png" height="200">
 </picture>
</p>

<p align="center">
 
  <a href='http://makeapullrequest.com'><img alt='PRs Welcome' src='https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=shields'/></a>
  <a href='https://join.slack.com/t/monoidworkspace/shared_invite/zt-1nlqb5si8-JXLu9sJuZBwgMr3YsXnyLw'><img alt="Join Slack Community" src="https://img.shields.io/badge/slack%20community-join-blue"/></a>

</p>

## Monoid is an open-source suite of tools for automating data privacy 
* Scan your data silos for PII to maintain an up-to-date data map.
* Automate user data deletion & right-to-know requests with our pre-built SaaS, DB, and warehouse automators. Are we missing a data silo that you use? Build your own automator easily, or make an issue if you'd like us to do so.
* Stay compliant with existing (GDPR, CCPA, etc.) and emerging (CPRA, Virginia, etc.) regulations.
* **Coming soon**: cookie banners, CRM connectors, analytics tool connectors, and more!
* For RoPA generation, audit trails, teams, and more, sign up for our [Monoid Cloud (beta)](https://monoid.co).

See our [docs](https://docs.monoid.co) for a more thorough introduction to Monoid.

## Get started for free

### Option 1. Two-line deploy
1. Generate an encryption key with `openssl rand -base64 32`.
2. Run `ENCRYPTION_KEY=[key generated in the previous step] docker compose up`. 

### Option 2: If you don't need to self-host

Monoid Cloud is available [here](https://app.monoid.co)! Contact jagath@monoid.co if you'd like any help getting set up.

## Code Scanning
Monoid supports static analysis to detect privacy violations at the code-level. Check out the docs in the [monoid-codescan directory](monoid-codescan/README.md).

## Support 

Sign up for a paid plan to get white-glove support, regardless of how you choose to deploy. Contact jagath@monoid.co for more information.

For more information on getting set up, please check out our [quick-start guide.](https://docs.monoid.co/category/monoid-open-source-quick-start)

## Monoid v1.0 Features (WIP)

### Data Mapping

<img src="https://user-images.githubusercontent.com/11621962/202405009-85646a32-4ed0-4a4a-ac32-d06f6a322f14.gif" width=100%></img>

Scan your silos for information automatically and map PII. 

### Automated Scanning 

<img src="https://user-images.githubusercontent.com/11621962/202404973-c948a9f9-80a7-4669-8c74-9fd693356c1a.gif" width=100%></img>

Schedule routine scans for updated schemas and new PII.

### Data Deletion/Export Request Automation

<img src="https://user-images.githubusercontent.com/11621962/202386107-7ec9addb-0937-4e89-94f5-50610ffad096.gif" width=100%></img>

Automate user data deletion/export requests across all silos.

## Getting the most out of Monoid

Documentation is available [here](https://docs.monoid.co).

Join our [Slack community](https://join.slack.com/t/monoidworkspace/shared_invite/zt-1nlqb5si8-JXLu9sJuZBwgMr3YsXnyLw) if you need help, want to chat, or are thinking of a new feature. We're here to help - and to make Monoid even better.

## Philosophy

We believe that user data privacy is a fundamental right, and that the next decade will see an explosion of new regulations and standards around how companies handle data.

We also believe that even the most well-meaning companies can have poor privacy practices because being truly compliant is *hard*. If you're big enough to take on a privacy vendor, you're stuck with a pretty long integration process that doesn't handle the things you want it to; it's either missing the integrations you need out-of-the-box, or it doesn't handle automation so you're left doing the bulk of the work anyways. If you're not big enough to get a vendor, you're probably either sweeping privacy under the rug or spending a ton of time manually dealing with user data requests.

As the implications of holding user data get more dangerous (see: generative AI, deepfakes), regulation can only do so much to curb a disaster. We need tooling that's developer-first, that handles the heavy tail of data silos, and that automates data requests so they actually get carried out. We think that open-source is the way to go.

## What's cool about this?

Monoid v1.0 is a data-mapping, PII-scanning, and right-to-know/right-to-delete request automation solution. We think that making this open-source solves a lot of blind spots of other solutions: 

* **Monoid can be used for internal data-stores *and* external SaaS vendors.** Most solutions don't play well with self-hosting, so you're stuck making an internal copy to handle internal DB's/warehouses/etc. With Monoid, you can have a private local instance up-and-running in minutes. 
* **Monoid is easily extensible**. We might not have all the automation connectors you need, but you can build them yourself very easily (or enlist us to as part of our paid plans!). 
* **Monoid is automated!** This part isn't necessarily *just* an open-source thing, but we were surprised to find that most existing solutions have little-to-no request fulfillment automation. Monoid is built around the abstractions of connectors that can execute query and delete requests for user data, so automation is at its core.

## Contributing

We value community contributions, especially around building new connectors. Our contributions guide is still WIP, but if you're interested in helping out, please feel free to make a PR or contact jagath@monoid.co

## Open-source vs. paid

This repo is entirely [MIT licensed](/LICENSE).

Paid plans include support and cloud-hosted solutions. Contact us at jagath@monoid.co for more information.

Credit to PostHog and Airbyte for inspiration around public-facing materials (like this README!) and the design of our software (as well as OSS trailblazing!)
