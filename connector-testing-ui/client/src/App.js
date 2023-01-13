import logo from './logo.svg';
import React, { useState, useEffect } from 'react';
import './App.css';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; //Example style, you can use another

async function getConfig() {
    try {
        const response = await fetch('/config');
        const config = await response.json();
        return config
    } catch (error) {
        console.error(error);
    }
}

async function getQuery() {
    try {
        const response = await fetch('/query');
        const query = await response.json();
        return query
    } catch (error) {
        console.error(error);
    }
}

async function getHandle() {
    try {
        const response = await fetch('/handle');
        const handle = await response.json();
        return handle
    } catch (error) {
        console.error(error);
    }
}

async function setHandleRequest(handle) {
    try {

        await fetch('/handle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(handle)
        });
        console.log("done with set handle request")
        console.log(handle)
    } catch (error) {
        console.error(error);
    }
}

async function getPersistence() {
    try {
        const response = await fetch('/persistence');
        const persistence = await response.json();
        return persistence
    } catch (error) {
        console.error(error);
    }
}

async function getOutput() {
    try {
        const response = await fetch('/output');
        const output = await response.text();
        return output
    } catch (error) {
        console.error(error);
    }
}

async function setQueryRequest(query) {
    try {

        await fetch('/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(query)
        });
        console.log("done")
    } catch (error) {
        console.error(error);
    }
}

async function runAction(docker_image, action) {
    try {

        await fetch('/' + action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "docker_image": docker_image
            })
        });
        console.log("done")
    } catch (error) {
        console.error(error);
    }
}


async function setPersistenceRequest(persistence) {
    try {

        await fetch('/persistence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(persistence)
        });
        console.log("done")
    } catch (error) {
        console.error(error);
    }
}

async function setConfigRequest(config) {
    try {

        await fetch('/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        console.log("done")
    } catch (error) {
        console.error(error);
    }
}


function App() {

    const [config, setConfig] = React.useState(
        `{}`
    );

    const [query, setQuery] = React.useState(
        `{}`
    );

    const [persistence, setPersistence] = React.useState(
        `{}`
    );

    const [handle, setHandle] = React.useState(
        `{}`
    );

    const [output, setOutput] = React.useState("");

    const [dockerImageName, setDockerImageName] = React.useState("docker.io/monoidco/monoid-mixpanel:0.0.1");
    const [action, setAction] = React.useState("spec");

    useEffect(() => {
        getConfig().then((config) => {
            console.log(config);
            setConfig(JSON.stringify(config, null, 2));
        }
        );

        getQuery().then((query) => {
            console.log(query);
            setQuery(JSON.stringify(query, null, 2));
        }
        );

        getPersistence().then((persistence) => {
            console.log(persistence);
            setPersistence(JSON.stringify(persistence, null, 2));
        }
        );

        getHandle().then((handle) => {
            console.log(handle);
            setHandle(JSON.stringify(handle, null, 2));
        }
        );

        getOutput().then((output) => {
            console.log(output);
            setOutput(output);
        }
        );
    }, []);

    return (
        <div className="App">
            <p>
                Docker Image Name
            </p>
            <input type="text" value={dockerImageName} style={{ 
                    width: '100%', 
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 15,
                    border: '1px solid #ddd',}} 
                    onChange={(e) => setDockerImageName(e.target.value)} 
                />
            <p>
                Config JSON
            </p>
            <Editor
                value={config}
                onValueChange={config => setConfig(config)}
                highlight={config => highlight(config, languages.plain, 'plain')}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 15,
                    border: '1px solid #ddd',
                }}
            />

            <p>
                Query JSON
            </p>
            <Editor
                value={query}
                onValueChange={query => setQuery(query)}
                highlight={query => highlight(query, languages.plain, 'plain')}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 15,
                    border: '1px solid #ddd',
                }}
            />

            <p>
                Persistence JSON
            </p>
            <Editor
                value={persistence}
                onValueChange={persistence => setPersistence(persistence)}
                highlight={persistence => highlight(persistence, languages.plain, 'plain')}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 15,
                    border: '1px solid #ddd',
                }}
            />

            <p>
                Handle JSON
            </p>
            <Editor
                value={handle}
                onValueChange={handle => setHandle(handle)}
                highlight={handle => highlight(handle, languages.plain, 'plain')}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 15,
                    border: '1px solid #ddd',
                }}
            />
            <button onClick={() => {
                setConfigRequest(JSON.parse(config));
                setQueryRequest(JSON.parse(query));
                setPersistenceRequest(JSON.parse(persistence));
                setHandleRequest(JSON.parse(handle));
            }}>Save</button>
            <div>
                <select value={action} onChange={(e) => setAction(e.target.value)}>
                    <option value="spec">Spec</option>
                    <option value="schema">Schema</option>
                    <option value="validate">Validate</option>
                    <option value="run_query">Query</option>
                    <option value="delete">Delete</option>
                    <option value="request_status">Request Status</option>
                    <option value="request_results">Request Results</option>
                </select>
                <button onClick={() => {
                    runAction(dockerImageName, action);
                }}>Run Docker Action</button>
            </div>
            <div>
                <p>
                    Output
                </p>
                <textarea value={output} style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 15,
                    border: '1px solid #ddd',
                    width: '100%',
                }} readOnly />
            </div>
        </div>
    );
}

export default App;
