TEST_SUBDIRS = monoid-api
INTEGRATIONS_DIR = monoid-integrations

TEST_TARGETS = $(foreach fd, $(TEST_SUBDIRS), $(fd)/test)

.PHONY: $(TEST_TARGETS)

$(TEST_TARGETS):
	$(MAKE) -C $(@D) test

test: $(TEST_TARGETS) 

docker-build: 
	docker compose -f docker-compose.build.yaml build

docker-push: 
	docker compose -f docker-compose.build.yaml push

build-integrations:
	$(MAKE) -C $(INTEGRATIONS_DIR) docker-build

push-integrations:
	$(MAKE) -C $(INTEGRATIONS_DIR) docker-push
