import binascii
import collections
import hashlib
import os
import urllib2
import zlib
from xml.etree import ElementTree

import passlib.hash
from flask import Flask
from flask import render_template, request, jsonify, make_response

app = Flask(__name__)


@app.route("/")
def index():
    res = make_response(render_template("index.html"))
    res.headers['Cache-Control'] = "no-cache, no-store, must-revalidate"

    return res


@app.route("/dev-activity/")
def dev_activity():
    html = ""
    try:
        data = urllib2.urlopen("https://github.com/aaronjwood.atom").read()
        tree = ElementTree.fromstring(data)
        children = tree.findall("{http://www.w3.org/2005/Atom}entry")
        for i in range(len(children)):
            if i == 10:
                break

            content = children[i].find("{http://www.w3.org/2005/Atom}content").text
            content = content.replace("https://github.com", "")
            content = content.replace('href="aaronjwood', 'href="https://github.com/aaronjwood')
            content = content.replace('href="/', 'href="https://github.com/')
            html += content
    except urllib2.HTTPError:
        html = "Problem reaching GitHub...is it down?"

    return html


@app.route("/tools/<tool>/")
def tools(tool):
    return render_template("tools/%s.html" % tool)


@app.route("/employment/<employer>/")
def employment(employer):
    return render_template("employment/%s.html" % employer)


@app.route("/tools/hash/dohash", methods=["POST"])
def do_hash():
    text = request.form["key"]
    hashes = collections.OrderedDict()

    hashes["NTLM"] = passlib.hash.nthash.encrypt(text)
    hashes["LM"] = passlib.hash.lmhash.encrypt(text)

    for type in hashlib.algorithms_available:
        hash = hashlib.new(type)
        hash.update(text)
        hashes[type.upper()] = hash.hexdigest()

    hashes["CRC32"] = "%08X".lower() % (binascii.crc32(text) & 0xffffffff)
    hashes["MD4"] = passlib.hash.hex_md4.encrypt(text)
    hashes["ADLER32"] = format(zlib.adler32(text) & 0xffffffff, "x")
    hashes["CISCO PIX"] = passlib.hash.cisco_pix.encrypt(text)
    hashes["MYSQL 3.2.3"] = passlib.hash.mysql323.encrypt(text)
    hashes["MYSQL 4.1"] = passlib.hash.mysql41.encrypt(text)
    hashes["LDAP MD5"] = passlib.hash.ldap_md5.encrypt(text)
    hashes["LDAP SHA1"] = passlib.hash.ldap_sha1.encrypt(text)

    return jsonify(**hashes)


@app.route("/articles/<article>/")
def articles(article):
    return render_template("articles/%s.html" % article)


if __name__ == "__main__":
    app.run(threaded=True, host="0.0.0.0") if os.environ.get("MODE") == "RELEASE" else app.run(debug=True)
