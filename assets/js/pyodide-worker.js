self.importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');

const pyodideReady = loadPyodide();
pyodideReady.then(() => self.postMessage({type: 'ready'}));

self.onmessage = async (e) => {
  const data = e.data;
  if (data.type !== 'run') return;
  try {
    const pyodide = await pyodideReady;
    const snippet = `import json, sys
from io import StringIO
input_data = ${JSON.stringify(data.stdin || '')}
class PatchedInput:
    def __init__(self, data):
        self.lines = data.splitlines()
        self.index = 0
    def __call__(self, prompt=None):
        if self.index < len(self.lines):
            line = self.lines[self.index]
            self.index += 1
            return line
        raise EOFError('No more input')
_input = PatchedInput(input_data)
__builtins__.input = _input
_out_buf = StringIO()
_sys_out = sys.stdout
sys.stdout = _out_buf
args = json.loads('${JSON.stringify(data.args || {})}')
result = ${data.funcName}(**args)
sys.stdout = _sys_out
json.dumps({'return': result, 'stdout': _out_buf.getvalue()})`;
    const res = await pyodide.runPythonAsync(data.code.replace(/\t/g, '    ') + '\n' + snippet);
    self.postMessage({id: data.id, result: res});
  } catch (err) {
    self.postMessage({id: data.id, error: err.message || String(err)});
  }
};
