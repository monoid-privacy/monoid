# Monoid Code Scanning

This folder includes the OSS version of Monoid's code scanning features. A basic
set of config files to use with the scanner can be found in the `config` folder --
it does not have a complete set of scanning criteria by any means -- you'll likely
need to add your own sets of matching criterial.

## Configuration

If you want a pre-configured scanning tool, please [contact us](mailto:support@monoid.co), and
we can get you set up with the beta of our closed-source scanner, which includes a complete set
of configuration files you can use to get started.

## Running the Docker Image
To analyze a repository, you can use the `monoidco/monoid-codescan` docker image. The following 
command will analyze a repository on your docker host with the example config in `monoid-codescan/config`,
assuming you are in the root of this repository:

```
docker run -v $(pwd)/monoid-codescan/config:/config -v /path/to/repo-on-host:/analyze_repo monoidco/monoid-codescan:0.0.1 -c /config /analyze_repo
```
