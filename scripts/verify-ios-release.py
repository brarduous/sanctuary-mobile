#!/usr/bin/env python3
"""Verify a locally built release IPA without printing bundled credentials."""
import argparse
import base64
import datetime
import hashlib
import json
import pathlib
import plistlib
import re
import subprocess
import tempfile
import urllib.parse
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('ipa', type=pathlib.Path)
parser.add_argument('--build', required=True)
parser.add_argument('--output', type=pathlib.Path)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
base = json.loads((root / 'app.json').read_text())['expo']
config = json.loads(subprocess.check_output([
    'node', '-e', "process.stdout.write(JSON.stringify(require('node:util').parseEnv(require('node:fs').readFileSync('.env.local','utf8'))))"
], cwd=root))

def require(condition, message):
    if not condition:
        raise SystemExit(message)

with args.ipa.open('rb') as source:
    digest = hashlib.sha256()
    for block in iter(lambda: source.read(1024 * 1024), b''):
        digest.update(block)

with zipfile.ZipFile(args.ipa) as archive:
    names = archive.namelist()
    info_name = next(name for name in names if name.startswith('Payload/') and name.count('/') == 2 and name.endswith('/Info.plist'))
    app_prefix = info_name.rsplit('/', 1)[0]
    info = plistlib.loads(archive.read(info_name))
    require(info['CFBundleIdentifier'] == base['ios']['bundleIdentifier'], 'Unexpected bundle identifier')
    require(info['CFBundleShortVersionString'] == base['version'], 'Unexpected app version')
    require(info['CFBundleVersion'] == args.build, 'Unexpected build number')
    require(info.get('FacebookAppID') == config['META_APP_ID'].strip(), 'Unexpected Meta app ID')
    require(info.get('FacebookClientToken') == config['META_APP_CLIENT_TOKEN'].strip(), 'Bundled Meta client configuration does not match')
    require(info.get('FacebookAutoInitEnabled') is False, 'Meta native auto-init must stay disabled')
    require(info.get('FacebookAutoLogAppEventsEnabled') is True, 'Meta app events are not configured')
    require(info.get('FacebookAdvertiserIDCollectionEnabled') is True, 'Meta advertiser-ID configuration is missing')
    require(bool(info.get('NSUserTrackingUsageDescription')), 'Missing ATT purpose string')
    require(info.get('ITSAppUsesNonExemptEncryption') is False, 'Unexpected encryption declaration')

    javascript = archive.read(app_prefix + '/main.jsbundle')
    expected_host = urllib.parse.urlparse(config['EXPO_PUBLIC_SUPABASE_URL']).hostname
    require(expected_host.encode() in javascript, 'Production database is absent from bundled JavaScript')
    require(config['EXPO_PUBLIC_SUPABASE_ANON_KEY'].encode() in javascript, 'Public database configuration is absent from bundled JavaScript')
    require(b'api.sanctuaryapp.us' in javascript, 'Production backend is absent from bundled JavaScript')
    require(b'www.sanctuaryapp.us' in javascript and b'sanctuary_test' in javascript, 'Acquisition/test-referrer code is absent from bundled JavaScript')
    for variable in ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_BACKEND_URL', 'EXPO_PUBLIC_META_APP_EVENTS_ENABLED', 'EXPO_PUBLIC_ATTRIBUTION_TEST']:
        require(variable.encode() not in javascript, 'A required Expo variable was not inlined into the release bundle: ' + variable)
    for token in re.findall(rb'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', javascript):
        try:
            payload = token.split(b'.')[1]
            claims = json.loads(base64.urlsafe_b64decode(payload + b'=' * (-len(payload) % 4)))
        except (ValueError, TypeError):
            continue
        require(not isinstance(claims, dict) or claims.get('role') != 'service_role', 'A server credential was found in the app bundle')

    verify_folder = root / '.local-builds'
    verify_folder.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='verify-ios-', dir=verify_folder) as temporary:
        target = pathlib.Path(temporary)
        for entry in archive.infolist():
            if not entry.filename.startswith(app_prefix + '/'):
                continue
            destination = (target / entry.filename).resolve()
            require(target.resolve() in destination.parents, 'Unsafe archive path')
            archive.extract(entry, target)
            if not entry.is_dir():
                destination.chmod((entry.external_attr >> 16) & 0o777 or 0o644)
        app = target / app_prefix
        signature = subprocess.run(['codesign', '--verify', '--deep', '--strict', str(app)], capture_output=True)
        require(signature.returncode == 0, 'IPA code signature verification failed')
        profile = plistlib.loads(subprocess.check_output(['security', 'cms', '-D', '-i', str(app / 'embedded.mobileprovision')], stderr=subprocess.DEVNULL))
        require(profile['Entitlements']['application-identifier'].endswith('.' + base['ios']['bundleIdentifier']), 'Unexpected signing profile application ID')
        require(profile['Entitlements'].get('get-task-allow') is False, 'A development signing profile was used')
        require('ProvisionedDevices' not in profile and not profile.get('ProvisionsAllDevices'), 'IPA is not signed for App Store distribution')
        require(profile['ExpirationDate'] > datetime.datetime.utcnow(), 'Signing profile expired')

report = {
    'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'artifact': str(args.ipa.resolve()),
    'sha256': digest.hexdigest(),
    'bytes': args.ipa.stat().st_size,
    'version': info['CFBundleShortVersionString'],
    'build': info['CFBundleVersion'],
    'bundle_identifier': info['CFBundleIdentifier'],
    'code_signature_verified': True,
    'app_store_profile_verified': True,
    'production_configuration_verified': True,
    'meta_client_configuration_matches': True,
    'meta_native_auto_init': False,
    'tracking_permission_purpose_present': True,
    'service_role_jwt_absent': True,
    'physical_device_verified': False,
}
if args.output:
    args.output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
