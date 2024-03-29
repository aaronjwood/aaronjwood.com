import binascii
import hashlib
import os
import zlib
from functools import wraps
from urllib.request import HTTPError, urlopen
from xml.etree import ElementTree

import passlib.hash
from flask import Flask, render_template, request, jsonify, make_response, abort
from jinja2 import TemplateNotFound

app = Flask(__name__)


def template_check(route):
    @wraps(route)
    def wrapper(**kwargs):
        try:
            for key, value in kwargs.items():
                return route(value)
        except TemplateNotFound:
            return abort(404)

    return wrapper


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/dev-activity/")
def dev_activity():
    html = ""
    try:
        data = urlopen("https://github.com/aaronjwood.atom").read()
        tree = ElementTree.fromstring(data)
        children = tree.findall("{http://www.w3.org/2005/Atom}entry")
        for i, child in enumerate(children):
            if i == 10:
                break

            content = child.find("{http://www.w3.org/2005/Atom}content").text
            content = content.replace("https://github.com", "")
            content = content.replace('href="aaronjwood', 'href="https://github.com/aaronjwood')
            content = content.replace('href="/', 'href="https://github.com/')
            html += content
    except HTTPError:
        html = "Problem reaching GitHub...is it down?"

    res = make_response(html)
    res.headers['Cache-Control'] = "no-cache, no-store, must-revalidate"

    return res


@app.route("/tools/<tool>/")
@template_check
def tools(tool):
    return render_template("tools/%s.html" % tool)


@app.route("/employment/<employer>/")
@template_check
def employment(employer):
    return render_template("employment/%s.html" % employer)


@app.route("/tools/hash/dohash", methods=["POST"])
def do_hash():
    text = request.form["key"]
    hashes = {}

    for algo in hashlib.algorithms_available:
        hasher = hashlib.new(algo)
        hasher.update(text.encode())
        if algo == "shake_128":
            hashes[algo.upper()] = hasher.hexdigest(256)
        elif algo == "shake_256":
            hashes[algo.upper()] = hasher.hexdigest(512)
        else:
            hashes[algo.upper()] = hasher.hexdigest()

    hashes["NTLM"] = passlib.hash.nthash.encrypt(text)
    hashes["LM"] = passlib.hash.lmhash.encrypt(text)
    hashes["CRC32"] = "%08X".lower() % (binascii.crc32(text.encode()) & 0xffffffff)
    hashes["MD4"] = passlib.hash.hex_md4.encrypt(text)
    hashes["ADLER32"] = format(zlib.adler32(text.encode()) & 0xffffffff, "x")
    if len(text) <= 16:
        hashes["CISCO PIX"] = passlib.hash.cisco_pix.encrypt(text)

    hashes["MYSQL 3.2.3"] = passlib.hash.mysql323.encrypt(text)
    hashes["MYSQL 4.1"] = passlib.hash.mysql41.encrypt(text)
    hashes["LDAP MD5"] = passlib.hash.ldap_md5.encrypt(text)
    hashes["LDAP SHA1"] = passlib.hash.ldap_sha1.encrypt(text)

    return jsonify(**hashes)


@app.route("/articles/<article>/")
@template_check
def articles(article):
    return render_template("articles/%s.html" % article)


if __name__ == "__main__":
    app.run(threaded=True, host="0.0.0.0") if os.environ.get("MODE") == "RELEASE" else app.run(debug=True)
