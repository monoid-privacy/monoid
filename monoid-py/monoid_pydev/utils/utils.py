import pkgutil
from typing import Optional


def load_package_file(package: str, file_name: str) -> Optional[bytes]:
    return pkgutil.get_data(package, file_name)
