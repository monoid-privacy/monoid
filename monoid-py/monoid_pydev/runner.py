from typing import Iterable, List

import jsonschema
from monoid_pydev.models.models import MonoidPersistenceConfig
from monoid_pydev.silos import AbstractSilo
import argparse
from jsonschema import validate
from monoid_pydev.models import MonoidMessage, Type


class MonoidRunner():
    def __init__(self, silo: AbstractSilo):
        self.silo = silo

    def parse_args(self, args: List[str]):
        parser = argparse.ArgumentParser()

        authed_parser = argparse.ArgumentParser(add_help=False)
        authed_parser.add_argument("-c", "--config", required=True)

        persistence_parser = argparse.ArgumentParser(add_help=False)
        persistence_parser.add_argument("-p", "--persist_conf", required=True)

        subparsers = parser.add_subparsers(dest='command', required=True)

        scan_parser = subparsers.add_parser(
            "scan", parents=[authed_parser, persistence_parser])
        scan_parser.add_argument(
            "-s", "--schemas", required=True
        )

        delete_parser = subparsers.add_parser(
            "delete", parents=[authed_parser, persistence_parser])
        delete_parser.add_argument(
            "-q", "--query", required=True)

        query_parser = subparsers.add_parser(
            "query",
            parents=[authed_parser, persistence_parser]
        )
        query_parser.add_argument(
            "-q", "--query", required=True)

        req_results_parser = subparsers.add_parser(
            "request-results",
            parents=[authed_parser, persistence_parser]
        )
        req_results_parser.add_argument(
            "-r", "--requests", required=True)

        req_status_parser = subparsers.add_parser(
            "request-status",
            parents=[authed_parser, persistence_parser]
        )
        req_status_parser.add_argument(
            "-r", "--requests", required=True)

        subparsers.add_parser("schema", parents=[authed_parser])
        subparsers.add_parser("validate", parents=[authed_parser])
        subparsers.add_parser("spec")

        self.parse_result = parser.parse_args(args)

    def run(self) -> Iterable[str]:
        spec = self.silo.spec()
        if self.parse_result.command == "spec":
            yield MonoidMessage(type=Type.SPEC, spec=spec).json()
            return

        config = self.silo.parse_config(self.parse_result.config)

        try:
            validate(config, spec.spec)
        except jsonschema.exceptions.ValidationError:
            raise ValueError("Invalid config")

        if self.parse_result.command == "schema":
            yield MonoidMessage(type=Type.SCHEMA, schema_msg=self.silo.schemas(config)).json()
            return

        elif self.parse_result.command == "validate":
            yield MonoidMessage(type=Type.VALIDATE, validate_msg=self.silo.validate(config)).json()
            return

        persist_conf = MonoidPersistenceConfig.parse_file(
            self.parse_result.persist_conf)

        if self.parse_result.command == "scan":
            schemas = self.silo.parse_schema(self.parse_result.schemas)
            for s in self.silo.scan(config, persist_conf, schemas):
                yield MonoidMessage(type=Type.RECORD, record=s).json()

        elif self.parse_result.command == "delete":
            query = self.silo.parse_query(self.parse_result.query)

            for req in self.silo.delete(config, persist_conf, query):
                yield MonoidMessage(type=Type.REQUEST_RESULT, request=req).json()

        elif self.parse_result.command == "query":
            query = self.silo.parse_query(self.parse_result.query)

            for req in self.silo.query(config, persist_conf, query):
                yield MonoidMessage(type=Type.REQUEST_RESULT, request=req).json()

        elif self.parse_result.command == "request-results":
            requests = self.silo.parse_requests(self.parse_result.requests)

            for rec in self.silo.request_results(config, persist_conf, requests):
                yield MonoidMessage(type=Type.RECORD, record=rec).json()

        elif self.parse_result.command == "request-status":
            requests = self.silo.parse_requests(self.parse_result.requests)

            for status in self.silo.request_status(config, persist_conf, requests):
                yield MonoidMessage(type=Type.REQUEST_STATUS, request_status=status).json()


def run_query(silo: AbstractSilo, args: List[str]):
    runner = MonoidRunner(silo)
    runner.parse_args(args)
    for res in runner.run():
        print(res)
