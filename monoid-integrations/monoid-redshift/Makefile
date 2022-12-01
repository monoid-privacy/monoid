IMAGE_NAME := 'monoidco/monoid-redshift'
IMAGE_VERSION := '0.0.1'

build:
	docker build . -t ${IMAGE_NAME}:${IMAGE_VERSION}

push: build
	docker push ${IMAGE_NAME}:${IMAGE_VERSION}
