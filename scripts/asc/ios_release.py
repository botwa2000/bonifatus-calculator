#!/usr/bin/env python3
"""App Store Connect helpers for the Codemagic `flutter-release` workflow.

  version        Print the marketing version (CFBundleShortVersionString) this
                 iOS build must carry. Apple closes a version's build train once
                 that version is released, so every App Store release needs a
                 new version string. pubspec.yaml is never bumped (see CLAUDE.md);
                 the version is derived from App Store Connect instead:
                   - an open, unsubmitted version (prepare/rejected) → reuse it
                   - a version waiting for review → reuse it (the publish step
                     cancels that submission and resubmits with the new build)
                   - a version in review or approved but unreleased → fail; that
                     release must finish or be cancelled in App Store Connect
                   - otherwise → next patch above both the pubspec version and
                     every version App Store Connect knows about

  localizations  Write the --app-store-version-localizations JSON for
                 `app-store-connect publish`: one entry per locale of the live
                 App Store version, "What's New" taken from mobile/store/whats_new.json
                 by language prefix ('en' is the fallback).

Runs on Codemagic, where the `Bonistock ASC` integration exposes
APP_STORE_CONNECT_ISSUER_ID / _KEY_IDENTIFIER / _PRIVATE_KEY.
"""
import json, os, re, sys, time, urllib.error, urllib.request

import jwt  # PyJWT (ships with codemagic-cli-tools)

APP_ID = os.environ["APP_STORE_APPLE_ID"]
API = "https://api.appstoreconnect.apple.com/v1"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

OPEN = {"PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED",
        "METADATA_REJECTED", "INVALID_BINARY", "WAITING_FOR_REVIEW"}
BLOCKING = {"IN_REVIEW", "PENDING_DEVELOPER_RELEASE", "PENDING_APPLE_RELEASE",
            "PROCESSING_FOR_APP_STORE", "WAITING_FOR_EXPORT_COMPLIANCE"}


def private_key():
    # Accepts PEM (possibly with literal "\n" escapes), "@env:VAR", "@file:PATH",
    # or a bare base64 key body, and rebuilds clean PEM framing.
    key = os.environ["APP_STORE_CONNECT_PRIVATE_KEY"].strip()
    while key.startswith("@env:") or key.startswith("@file:"):
        ref = key.split(":", 1)[1]
        key = (os.environ[ref] if key.startswith("@env:")
               else open(os.path.expanduser(ref), encoding="utf-8").read()).strip()
    key = key.replace("\\n", "\n").strip().strip('"')
    body = "".join(re.sub(r"-----(BEGIN|END)[A-Z ]*-----", "", key).split())
    return ("-----BEGIN PRIVATE KEY-----\n"
            + "\n".join(body[i:i + 64] for i in range(0, len(body), 64))
            + "\n-----END PRIVATE KEY-----\n")


def token():
    now = int(time.time())
    return jwt.encode(
        {"iss": os.environ["APP_STORE_CONNECT_ISSUER_ID"], "iat": now,
         "exp": now + 1000, "aud": "appstoreconnect-v1"},
        private_key(), algorithm="ES256",
        headers={"kid": os.environ["APP_STORE_CONNECT_KEY_IDENTIFIER"], "typ": "JWT"})


def get(path):
    req = urllib.request.Request(API + path)
    req.add_header("Authorization", "Bearer " + token())
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"GET {path} → HTTP {e.code}\n{e.read().decode(errors='replace')}")


def parse(v):
    return tuple(int(p) for p in v.split("."))


def store_versions():
    data = get(f"/apps/{APP_ID}/appStoreVersions?filter[platform]=IOS&limit=200")["data"]
    return [(v["attributes"]["versionString"], v["attributes"]["appStoreState"], v["id"])
            for v in data]


def pubspec_version():
    text = open(os.path.join(ROOT, "mobile", "pubspec.yaml"), encoding="utf-8").read()
    return re.search(r"^version:\s*([0-9.]+)", text, re.M).group(1)


def next_version():
    versions = store_versions()
    for v, state, _ in versions:
        print(f"  App Store version {v}: {state}", file=sys.stderr)
    for v, state, _ in versions:
        if state in BLOCKING:
            raise SystemExit(f"iOS {v} is {state}; release or cancel it in App Store Connect first")
    open_versions = [v for v, state, _ in versions if state in OPEN]
    if open_versions:
        return max(open_versions, key=parse)
    base = pubspec_version()
    known = [v for v, _, _ in versions]
    if base not in known and all(parse(base) > parse(v) for v in known):
        return base
    major, minor, patch = (list(parse(max(known + [base], key=parse))) + [0, 0])[:3]
    return f"{major}.{minor}.{patch + 1}"


def localizations(out_path):
    notes = json.load(open(os.path.join(ROOT, "mobile", "store", "whats_new.json"), encoding="utf-8"))
    live = [vid for _, state, vid in store_versions() if state == "READY_FOR_SALE"]
    if not live:
        raise SystemExit("no live App Store version to copy locales from")
    locs = get(f"/appStoreVersions/{live[0]}/appStoreVersionLocalizations?limit=50")["data"]
    entries = [{"locale": loc["attributes"]["locale"],
                "whats_new": notes.get(loc["attributes"]["locale"].split("-")[0].lower(), notes["en"])}
               for loc in locs]
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False)
    for e in entries:
        print(f"  whatsNew {e['locale']}: {e['whats_new']}", file=sys.stderr)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "version":
        print(next_version())
    elif cmd == "localizations" and len(sys.argv) == 3:
        localizations(sys.argv[2])
    else:
        raise SystemExit("usage: ios_release.py version | localizations <out.json>")
