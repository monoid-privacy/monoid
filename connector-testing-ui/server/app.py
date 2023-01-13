import os
import subprocess
from flask import Flask, send_from_directory, request
import json

app = Flask(__name__, static_folder='../client/build')

@app.route('/spec', methods=['POST'])
def run_spec():
    req = request.get_json()
    docker_image = req['docker_image']
    print(docker_image)
    with open("tmp/output.log", "w") as output:
        subprocess.call(f'docker run {docker_image} spec', shell=True, stdout=output, stderr=output)
    return 'Success'

@app.route('/schema', methods=['POST'])
def run_schema():
    req = request.get_json()
    docker_image = req['docker_image']
    print(docker_image)
    with open("tmp/output.log", "w") as output:
        absolute_path = os.path.abspath("secrets")
        subprocess.call(f'docker run -v {absolute_path}:/secrets {docker_image} schema -c /secrets/config.json', shell=True, stdout=output, stderr=output)
    return 'Success'

@app.route('/validate', methods=['POST'])
def run_validate():
    req = request.get_json()
    docker_image = req['docker_image']
    print(docker_image)
    with open("tmp/output.log", "w") as output:
        absolute_path = os.path.abspath("secrets")
        subprocess.call(f'docker run -v {absolute_path}:/secrets {docker_image} validate -c /secrets/config.json -p /secrets/persistence_config.json', shell=True, stdout=output, stderr=output)
    return 'Success'

@app.route('/request_results', methods=['POST'])
def run_request_results():
    print("running request results")
    req = request.get_json()
    docker_image = req['docker_image']
    print(docker_image)
    with open("tmp/output.log", "w") as output:
        absolute_path = os.path.abspath("secrets")
        subprocess.call(f'docker run -v {absolute_path}:/secrets {docker_image} request-results -c /secrets/config.json -r /secrets/handle.json -p /secrets/persistence_config.json', shell=True, stdout=output, stderr=output)
    return 'Success'

@app.route('/request_status', methods=['POST'])
def run_request_status():
    print("running request status")
    req = request.get_json()
    docker_image = req['docker_image']
    print(docker_image)
    with open("tmp/output.log", "w") as output:
        absolute_path = os.path.abspath("secrets")
        subprocess.call(f'docker run -v {absolute_path}:/secrets {docker_image} request-status -c /secrets/config.json -r /secrets/handle.json -p /secrets/persistence_config.json', shell=True, stdout=output, stderr=output)
    return 'Success'

# run_query because query is already an endpoint
@app.route('/run_query', methods=['POST'])
def run_query():
    req = request.get_json()
    docker_image = req['docker_image']
    print(docker_image)
    with open("tmp/output.log", "w") as output:
        absolute_path = os.path.abspath("secrets")
        subprocess.call(f'docker run -v {absolute_path}:/secrets {docker_image} query -c /secrets/config.json -q /secrets/query.json -p /secrets/persistence_config.json', shell=True, stdout=output, stderr=output)
    return 'Success'

@app.route('/delete', methods=['POST'])
def run_delete():
    req = request.get_json()
    docker_image = req['docker_image']
    print(docker_image)
    with open("tmp/output.log", "w") as output:
        absolute_path = os.path.abspath("secrets")
        subprocess.call(f'docker run -v {absolute_path}:/secrets {docker_image} delete -c /secrets/config.json -q /secrets/query.json -p /secrets/persistence_config.json', shell=True, stdout=output, stderr=output)
    return 'Success'


@app.route('/output')
def get_output():
    with open("tmp/output.log", "r") as output:
        st = output.read()
        print(st)
        return st


@app.route('/config')
def get_config():
    with open('secrets/config.json') as f:
        config = json.load(f)
        return config

@app.route('/query')
def get_query():
    with open('secrets/query.json') as f:
        query = json.load(f)
        return query

@app.route('/handle')
def get_handle():
    with open('secrets/handle.json') as f:
        handle = json.load(f)
        return handle

@app.route('/persistence')
def get_persistence():
    with open('secrets/persistence_config.json') as f:
        persistence = json.load(f)
        return persistence


@app.route('/config', methods=['POST'])
def set_config():
    config = request.get_json()
    with open('secrets/config.json', 'w') as f:
        config_str = json.dumps(config)
        f.write(config_str)
    return 'Success'

@app.route('/handle', methods=['POST'])
def set_handle():
    handle = request.get_json()
    with open('secrets/handle.json', 'w') as f:
        handle_str = json.dumps(handle)
        f.write(handle_str)
    return 'Success'

@app.route('/query', methods=['POST'])
def set_query():
    query = request.get_json()
    with open('secrets/query.json', 'w') as f:
        query_str = json.dumps(query)
        f.write(query_str)
    return 'Success'

@app.route('/persistence', methods=['POST'])
def set_persistence():
    persistence = request.get_json()
    with open('secrets/persistence_config.json', 'w') as f:
        persistence_str = json.dumps(persistence)
        f.write(persistence_str)
    return 'Success'


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists("../client/build/" + path):
        return send_from_directory('../client/build', path)
    else:
        return send_from_directory('../client/build', 'index.html')

if __name__ == '__main__':
    if not os.path.exists('secrets'):
        os.makedirs('secrets')

    if not os.path.exists('tmp'):
        os.makedirs('tmp')

    if not os.path.exists('secrets/config.json'):
        with open('secrets/config.json', 'w') as f:
            f.write('{}')
    
    if not os.path.exists('secrets/handle.json'):
        with open('secrets/handle.json', 'w') as f:
            f.write('{}')

    if not os.path.exists('secrets/query.json'):
        with open('secrets/query.json', 'w') as f:
            f.write('{}')
    
    if not os.path.exists('secrets/persistence_config.json'):
        with open('secrets/persistence_config.json', 'w') as f:
            f.write('{}')
    
    if not os.path.exists('tmp/output.log'):
        with open('tmp/output.log', 'w') as f:
            f.write('')

    app.run()
