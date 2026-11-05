#!/usr/bin/env python3
"""Check a signed local AAB without displaying SDK tokens or signing passwords."""
import argparse
import base64
import datetime
import hashlib
import json
import os
import pathlib
import re
import shutil
import subprocess
import urllib.parse
import xml.etree.ElementTree as ET
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('aab', type=pathlib.Path)
parser.add_argument('--build', required=True)
parser.add_argument('--bundletool', type=pathlib.Path, required=True)
parser.add_argument('--output', type=pathlib.Path)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
base = json.loads((root / 'app.json').read_text())['expo']
config = json.loads(subprocess.check_output([
    'node', '-e', "process.stdout.write(JSON.stringify(require('node:util').parseEnv(require('node:fs').readFileSync('.env.local','utf8'))))"
], cwd=root))
credentials = json.loads((root / 'credentials.json').read_text())['android']['keystore']
java_bin = pathlib.Path(os.environ['JAVA_HOME']) / 'bin' if os.environ.get('JAVA_HOME') else None
java = str(java_bin / 'java') if java_bin else shutil.which('java')
keytool = str(java_bin / 'keytool') if java_bin else shutil.which('keytool')
jarsigner = str(java_bin / 'jarsigner') if java_bin else shutil.which('jarsigner')

def require(condition, message):
    if not condition:
        raise SystemExit(message)

def bundletool(*command):
    return subprocess.check_output([java, '-jar', str(args.bundletool.resolve()), *command, '--bundle=' + str(args.aab.resolve())], stderr=subprocess.PIPE)

def fingerprint(output):
    return re.search(r'SHA256:\s*([0-9A-F:]+)', output).group(1).replace(':', '').lower()

require(args.bundletool.is_file(), 'Download Google bundletool before verification')
bundletool('validate')
manifest = ET.fromstring(bundletool('dump', 'manifest'))
android = '{http://schemas.android.com/apk/res/android}'
require(manifest.attrib['package'] == base['android']['package'], 'Unexpected package name')
require(manifest.attrib[android + 'versionName'] == base['version'], 'Unexpected app version')
require(manifest.attrib[android + 'versionCode'] == args.build, 'Unexpected Android version code')
application = manifest.find('application')
require(application is not None and application.get(android + 'debuggable', 'false') == 'false', 'A debuggable artifact was built')
metadata = {entry.get(android + 'name'): entry.get(android + 'value') for entry in application.findall('meta-data')}
require(metadata.get('com.facebook.sdk.AutoInitEnabled') == 'false', 'Meta native auto-init must stay disabled')
require(metadata.get('com.facebook.sdk.AutoLogAppEventsEnabled') == 'true', 'Meta app event configuration is missing')
require(metadata.get('com.facebook.sdk.AdvertiserIDCollectionEnabled') == 'true', 'Meta advertiser-ID configuration is missing')
permissions = {entry.get(android + 'name') for entry in manifest.findall('uses-permission')}
require('com.google.android.gms.permission.AD_ID' in permissions, 'Advertising-ID permission is missing')
for resource, expected in [('facebook_app_id', config['META_APP_ID'].strip()), ('facebook_client_token', config['META_APP_CLIENT_TOKEN'].strip())]:
    values = bundletool('dump', 'resources', '--resource=string/' + resource, '--values').decode()
    require(expected in values, 'Bundled Meta client configuration does not match')

signature = subprocess.run([jarsigner, '-verify', str(args.aab.resolve())], capture_output=True, text=True)
require(signature.returncode == 0 and 'jar verified.' in signature.stdout, 'AAB signature verification failed')
actual_certificate = subprocess.check_output([keytool, '-printcert', '-jarfile', str(args.aab.resolve())], stderr=subprocess.PIPE, text=True)
signing_env = {**os.environ, 'SANCTUARY_VERIFY_STORE_PASSWORD': credentials['keystorePassword']}
expected_certificate = subprocess.check_output([
    keytool, '-list', '-v', '-keystore', str(root / credentials['keystorePath']),
    '-alias', credentials['keyAlias'], '-storepass:env', 'SANCTUARY_VERIFY_STORE_PASSWORD'
], stderr=subprocess.PIPE, text=True, env=signing_env)
require(fingerprint(actual_certificate) == fingerprint(expected_certificate), 'Artifact does not use the existing upload signing key')

with args.aab.open('rb') as source:
    digest = hashlib.sha256()
    for block in iter(lambda: source.read(1024 * 1024), b''):
        digest.update(block)
with zipfile.ZipFile(args.aab) as archive:
    names = archive.namelist()
    javascript = archive.read('base/assets/index.android.bundle')
    expected_host = urllib.parse.urlparse(config['EXPO_PUBLIC_SUPABASE_URL']).hostname
    require(expected_host.encode() in javascript, 'Production database is absent from bundled JavaScript')
    require(config['EXPO_PUBLIC_SUPABASE_ANON_KEY'].encode() in javascript, 'Public database configuration is absent from bundled JavaScript')
    require(b'api.sanctuaryapp.us' in javascript and b'www.sanctuaryapp.us' in javascript, 'Production backend/acquisition configuration is missing')
    require(b'sanctuary_test' in javascript, 'Excluded Play test-referrer handling is missing')
    for variable in ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_BACKEND_URL', 'EXPO_PUBLIC_META_APP_EVENTS_ENABLED', 'EXPO_PUBLIC_ATTRIBUTION_TEST']:
        require(variable.encode() not in javascript, 'A required Expo variable was not inlined: ' + variable)
    for token in re.findall(rb'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', javascript):
        try:
            payload = token.split(b'.')[1]
            claims = json.loads(base64.urlsafe_b64decode(payload + b'=' * (-len(payload) % 4)))
        except (ValueError, TypeError):
            continue
        require(not isinstance(claims, dict) or claims.get('role') != 'service_role', 'A server credential was found in the app bundle')
    abis = sorted({name.split('/')[2] for name in names if name.startswith('base/lib/') and name.endswith('.so')})
    require('arm64-v8a' in abis, 'Missing arm64 native libraries')

report = {
    'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'artifact': str(args.aab.resolve()),
    'sha256': digest.hexdigest(),
    'bytes': args.aab.stat().st_size,
    'version': manifest.attrib[android + 'versionName'],
    'build': manifest.attrib[android + 'versionCode'],
    'package': manifest.attrib['package'],
    'bundletool_validation_passed': True,
    'signature_verified': True,
    'existing_upload_key_matches': True,
    'production_configuration_verified': True,
    'meta_client_configuration_matches': True,
    'meta_native_auto_init': False,
    'advertising_id_permission_present': True,
    'service_role_jwt_absent': True,
    'abis': abis,
    'physical_device_verified': False,
}
if args.output:
    args.output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
