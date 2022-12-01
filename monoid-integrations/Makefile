INTEGRATIONS = monoid-bigquery monoid-mysql monoid-postgres monoid-redshift monoid-snowflake

DOCKER_BUILD_TARGETS = $(foreach fd, $(INTEGRATIONS), $(fd)/docker-build)
DOCKER_PUSH_TARGETS = $(foreach fd, $(INTEGRATIONS), $(fd)/docker-build)

.PHONY: $(DOCKER_BUILD_TARGETS) $(DOCKER_PUSH_TARGETS)

$(DOCKER_BUILD_TARGETS):
	$(MAKE) -C $(@D) docker-build

$(DOCKER_PUSH_TARGETS):
	$(MAKE) -C $(@D) docker-push

docker-build: $(DOCKER_BUILD_TARGETS)
docker-push: $(DOCKER_PUSH_TARGETS)
