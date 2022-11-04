from typing import Iterable, List

import jsonschema
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

        subparsers = parser.add_subparsers(dest='command', required=True)

        sample_parser = subparsers.add_parser(
            "sample", parents=[authed_parser])
        sample_parser.add_argument(
            "-s", "--schemas", required=True)

        delete_parser = subparsers.add_parser(
            "delete", parents=[authed_parser])
        delete_parser.add_argument(
            "-q", "--query", required=True)

        query_parser = subparsers.add_parser("query", parents=[authed_parser])
        query_parser.add_argument(
            "-q", "--query", required=True)

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

        if self.parse_result.command == "sample":
            schemas = self.silo.parse_schema(self.parse_result.schemas)
            for s in self.silo.sample(config, schemas):
                yield MonoidMessage(type=Type.RECORD, record=s).json()

        elif self.parse_result.command == "delete":
            query = self.silo.parse_query(self.parse_result.query)
            for s in self.silo.delete(config, query):
                yield MonoidMessage(type=Type.RECORD, record=s).json()

        elif self.parse_result.command == "query":
            query = self.silo.parse_query(self.parse_result.query)
            for s in self.silo.query(config, query):
                yield MonoidMessage(type=Type.RECORD, record=s).json()

        elif self.parse_result.command == "schema":
            yield MonoidMessage(type=Type.SCHEMA, schema_msg=self.silo.schemas(config)).json()

        elif self.parse_result.command == "validate":
            yield MonoidMessage(type=Type.VALIDATE, validate_msg=self.silo.validate(config)).json()


def run_query(silo: AbstractSilo, args: List[str]):
    runner = MonoidRunner(silo)
    runner.parse_args(args)
    for res in runner.run():
        print(res)
