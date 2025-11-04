import configparser
import json
import logging
import os
import ssl
import subprocess
import threading
import time
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from collections import OrderedDict

FORMAT = '%(asctime)s %(levelname)s %(message)s'
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format=FORMAT)

app = Flask(__name__)
CORS(app, supports_credentials=True)

REMOTE_HOST = '192.168.12.23'
REMOTE_USER = 'apmosys'
REMOTE_PASS = 'Welcome@2025'

LAMA_SERVICES_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), 'lama_services/lama_volumes/dist')) if os.environ.get('DOCKERIZED') else os.path.abspath(os.path.join(os.path.dirname(__file__), '../lama_services/lama_volumes/dist'))
CONF_DIR = os.path.join(LAMA_SERVICES_DIST, './')
SCHEDULER_EXECUTABLE = os.path.join(LAMA_SERVICES_DIST, 'lama_service')
SCHEDULER_LOG_FILE = os.path.join(CONF_DIR, 'lama_service.log')
CONFIG_FILE_PATH = os.path.join(LAMA_SERVICES_DIST, 'ConfigFile.Properties')
SCHEDULER_PID_FILE = os.path.join(LAMA_SERVICES_DIST, 'scheduler.pid')

scheduler_process = None
scheduler_lock = threading.Lock()

CACHE_DURATION = 5  # seconds
log_cache = {"data": None, "timestamp": 0}

# --- Scheduler Management ---
def is_scheduler_running():
    if os.path.exists(SCHEDULER_PID_FILE):
        try:
            with open(SCHEDULER_PID_FILE, 'r') as f:
                pid = int(f.read().strip())
            os.kill(pid, 0)
            return True, pid
        except Exception:
            return False, None
    return False, None

def start_scheduler():
    global scheduler_process
    with scheduler_lock:
        running, pid = is_scheduler_running()
        if running:
            return False, pid
        process = subprocess.Popen(
            [SCHEDULER_EXECUTABLE],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=LAMA_SERVICES_DIST
        )
        with open(SCHEDULER_PID_FILE, 'w') as f:
            f.write(str(process.pid))
        scheduler_process = process
        time.sleep(2)
        if process.poll() is not None:
            out, err = process.communicate()
            logger.error(f"Scheduler failed to start. stdout: {out.decode(errors='replace')}, stderr: {err.decode(errors='replace')}")
            return False, None
        return True, process.pid

# --- Scheduler API Routes ---
@app.route('/api/scheduler/start', methods=['POST'])
def api_start_scheduler():
    try:
        subprocess.run(["docker", "start", "lama_service"], capture_output=True, text=True)
        if result.returncode == 0:
            return jsonify({'status': 'started'}), 200
        else:
            logger.error(f"Failed to start lama_service: {result.stderr}")
            return jsonify({'status': 'error', 'error': result.stderr}), 500
    except Exception as e:
        logger.error(f"Error starting lama_service: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scheduler/status', methods=['GET'])
def api_scheduler_status():
    try:
        result = subprocess.run([
            'docker', 'ps', '--filter', 'name=lama_service', '--filter', 'status=running', '--format', '{{.Names}}'
        ], capture_output=True, text=True)
        running = 'lama_service' in result.stdout.strip().split('\n')
        return jsonify({'running': running}), 200
    except Exception as e:
        logger.error(f"Error checking lama_service status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scheduler/logs', methods=['GET'])
def api_scheduler_logs():
    try:
        num_lines = int(request.args.get('lines', 100))
        log_path = SCHEDULER_LOG_FILE

        print(f"👉 Trying to read: {log_path}")

        if not os.path.exists(log_path):
            print("❌ Log file does not exist")
            os.makedirs(os.path.dirname(log_path), exist_ok=True)
            open(log_path, 'a').close()
            return jsonify({'log': ''}), 200

        with open(log_path, 'r') as f:
            lines = f.readlines()

        print(f"✅ Read {len(lines)} lines from log")

        last_lines = lines[-num_lines:] if len(lines) > num_lines else lines
        return jsonify({'log': ''.join(last_lines)}), 200

    except Exception as e:
        logger.error(f"Error reading scheduler logs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/scheduler/stop', methods=['POST'])
def api_stop_scheduler():
    try:
        result = subprocess.run(['docker', 'stop', 'lama_service'], capture_output=True, text=True)
        if result.returncode == 0:
            return jsonify({'status': 'stopped'}), 200
        else:
            logger.error(f"Failed to stop lama_service: {result.stderr}")
            return jsonify({'status': 'error', 'error': result.stderr}), 500
    except Exception as e:
        logger.error(f"Error stopping lama_service: {e}")
        return jsonify({'error': str(e)}), 500


# --- Log File Listing/Content ---
@app.route('/api/log-files')
def list_log_files():
    date = request.args.get('date')
    if not date:
        return jsonify({'error': 'Missing date parameter'}), 400
    try:
        dt = datetime.strptime(date, '%Y-%m-%d')
        year = dt.strftime('%Y')
        month_name = dt.strftime('%B')
        date_prefix = dt.strftime('%Y-%B-%d_')
        local_path = os.path.join(LAMA_SERVICES_DIST, year, month_name)
        file_list = []

        logger.info(f"Checking path: {local_path}, prefix: {date_prefix}")

        if os.path.exists(local_path):
            for filename in os.listdir(local_path):
                if date_prefix in filename and filename.endswith('.txt'):
                    file_list.append(filename)
        return jsonify({'files': file_list, 'local_path': local_path})
    except Exception as e:
        logger.error(f"Error listing log files: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/log-file-content')
def get_log_file_content():
    filename = request.args.get('filename')
    date = request.args.get('date')
    if not filename or not date:
        return jsonify({'error': 'Missing filename or date parameter'}), 400
    if '/' in filename or '\\' in filename or '..' in filename:
        return jsonify({'error': 'Invalid filename'}), 400
    try:
        dt = datetime.strptime(date, '%Y-%m-%d')
        year = dt.strftime('%Y')
        month_name = dt.strftime('%B')
        local_path = os.path.join(LAMA_SERVICES_DIST, year, month_name)
        full_local_path = os.path.join(local_path, filename)
        if not os.path.exists(full_local_path):
            return jsonify({'error': 'File not found'}), 404
        with open(full_local_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        return jsonify({'filename': filename, 'content': content, 'local_path': local_path})
    except Exception as e:
        logger.error(f"Error reading log file: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/logs/summary', methods=['GET'])
def logs_summary():
    log_path = os.path.join(LAMA_SERVICES_DIST, 'lama_service.log')
    summary = {
        'hardware': {'error': 0, 'success': 0, 'warning': 0},
        'network': {'error': 0, 'success': 0, 'warning': 0},
        'database': {'error': 0, 'success': 0, 'warning': 0},
        'application': {'error': 0, 'success': 0, 'warning': 0},
        'login': {'error': 0, 'success': 0, 'warning': 0},
        'logout': {'error': 0, 'success': 0, 'warning': 0},
    }
    if not os.path.exists(log_path):
        return jsonify({'error': 'Log file not found', 'summary': summary}), 404
    try:
        with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
            for line in f:
                line_lower = line.lower()
                # Determine log level
                level = None
                if 'info' in line_lower or 'successfully' in line_lower:
                    level = 'success'
                elif 'error' in line_lower:
                    level = 'error'
                elif 'warning' in line_lower:
                    level = 'warning'
                # Determine category
                category = None
                for cat in summary.keys():
                    if cat in line_lower:
                        category = cat
                        break
                # If both found, increment
                if level and category:
                    summary[category][level] += 1
        return jsonify({'summary': summary}), 200
    except Exception as e:
        logger.error(f"Error summarizing logs: {e}")
        return jsonify({'error': str(e), 'summary': summary}), 500

@app.route('/api/logs/summary-by-date', methods=['GET'])
def logs_summary_by_date():
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Missing date parameter'}), 400
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        year = dt.strftime('%Y')
        month_name = dt.strftime('%B')
        # File name format: lama-YY-MM-DD.log
        file_name = f"lama-{dt.strftime('%d-%m-%y')}.log"
        local_path = os.path.join(LAMA_SERVICES_DIST, "logs")
        log_path = os.path.join(local_path, file_name)
        summary = {
            'hardware': {'error': 0, 'success': 0, 'warning': 0},
            'network': {'error': 0, 'success': 0, 'warning': 0},
            'database': {'error': 0, 'success': 0, 'warning': 0},
            'application': {'error': 0, 'success': 0, 'warning': 0},
            'login': {'error': 0, 'success': 0, 'warning': 0},
            'logout': {'error': 0, 'success': 0, 'warning': 0},
        }
        if not os.path.exists(log_path):
            return jsonify({'error': 'Log file not found', 'summary': summary}), 404
        with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
            for line in f:
                line_lower = line.lower()
                level = None
                if 'info' in line_lower or 'successfully' in line_lower:
                    level = 'success'
                elif 'error' in line_lower:
                    level = 'error'
                elif 'warning' in line_lower:
                    level = 'warning'
                category = None
                for cat in summary.keys():
                    if cat in line_lower:
                        category = cat
                        break
                if level and category:
                    summary[category][level] += 1
        return jsonify({'summary': summary}), 200
    except Exception as e:
        logger.error(f"Error summarizing logs by date: {e}")
        return jsonify({'error': str(e)}), 500

# --- Config File API ---
@app.route('/api/config', methods=['GET'])
def get_config():
    config = configparser.RawConfigParser(dict_type=OrderedDict)
    config.read(CONFIG_FILE_PATH)
    data = OrderedDict()
    for section in config.sections():
        data[section] = OrderedDict(config.items(section))
    return app.response_class(
        response=json.dumps(data, indent=2),
        status=200,
        mimetype='application/json'
    )

@app.route('/api/config', methods=['POST'])
def update_config():
    new_data = request.json
    if not isinstance(new_data, dict):
        return jsonify({'error': 'Invalid data'}), 400
    config = configparser.RawConfigParser()
    config.read(CONFIG_FILE_PATH)
    for section in config.sections():
        config.remove_section(section)
    for section, items in new_data.items():
        config.add_section(section)
        for k, v in items.items():
            config.set(section, k, str(v))
    with open(CONFIG_FILE_PATH, 'w') as f:
        config.write(f)
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6001)

