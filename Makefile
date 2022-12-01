TEST_SUBDIRS = monoid-api
BUILD_SUBDIRS = monoid-api
INTEGRATIONS_DIR = monoid-integrations

TEST_TARGETS = $(foreach fd, $(TEST_SUBDIRS), $(fd)/test)
BUILD_TARGETS = $(foreach fd, $(BUILD_SUBDIRS), $(fd)/build)

.PHONY: $(TEST_TARGETS)

$(TEST_TARGETS):
	$(MAKE) -C $(@D) test

$(BUILD_TARGETS):
	$(MAKE) -C $(@D) build

test: $(TEST_TARGETS) 
build: $(BUILD_TARGETS)

docker-build: 
	docker compose -f docker-compose.build.yaml build

docker-push: 
	docker compose -f docker-compose.build.yaml push

build-integrations:
	$(MAKE) -C $(INTEGRATIONS_DIR) docker-build

push-integrations:
	$(MAKE) -C $(INTEGRATIONS_DIR) docker-push
