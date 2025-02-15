import binascii
import hashlib
import zlib
from datetime import datetime, timedelta
from urllib.request import HTTPError, urlopen
from xml.etree import ElementTree

import passlib.hash

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from pydantic import BaseModel

from jinja2.exceptions import TemplateNotFound

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
feed_cache = {}


async def fetch_feed():
    res = ""
    try:
        data = urlopen("https://github.com/aaronjwood.atom").read()
        tree = ElementTree.fromstring(data)
        children = tree.findall("{http://www.w3.org/2005/Atom}entry")
        for i, child in enumerate(children):
            if i == 10:
                break

            content = child.find("{http://www.w3.org/2005/Atom}content").text
            content = content.replace("https://github.com", "")
            content = content.replace(
                'href="aaronjwood', 'href="https://github.com/aaronjwood'
            )
            content = content.replace('href="/', 'href="https://github.com/')
            res += content

        return res
    except HTTPError:
        return "Can't display development feed, try again later."


async def parse_template(request: Request, template: str):
    try:
        return templates.TemplateResponse(request=request, name=template)
    except TemplateNotFound:
        raise HTTPException(status_code=404)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    global feed_cache
    if not feed_cache or datetime.now() >= feed_cache.get("time") + timedelta(
        minutes=30
    ):
        feed_cache = {"time": datetime.now(), "data": await fetch_feed()}

    return templates.TemplateResponse(
        request=request, name="index.html", context={"feed": feed_cache.get("data")}
    )


@app.get("/tools/{tool}/", response_class=HTMLResponse)
async def tools(request: Request, tool: str):
    return await parse_template(request, f"tools/{tool}.html")


@app.get("/employment/{employer}/", response_class=HTMLResponse)
async def employment(request: Request, employer: str):
    return await parse_template(request, f"employment/{employer}.html")


class HashPayload(BaseModel):
    text: str


@app.post("/tools/hash/do")
async def do_hash(payload: HashPayload):
    hashes = {}
    for algo in hashlib.algorithms_available:
        hasher = hashlib.new(algo)
        hasher.update(payload.text.encode())
        if algo == "shake_128":
            hashes[algo.upper()] = hasher.hexdigest(256)
        elif algo == "shake_256":
            hashes[algo.upper()] = hasher.hexdigest(512)
        else:
            hashes[algo.upper()] = hasher.hexdigest()

    hashes["NTLM"] = passlib.hash.nthash.encrypt(payload.text)
    hashes["LM"] = passlib.hash.lmhash.encrypt(payload.text)
    hashes["CRC32"] = "%08X".lower() % (
        binascii.crc32(payload.text.encode()) & 0xFFFFFFFF
    )
    hashes["MD4"] = passlib.hash.hex_md4.encrypt(payload.text)
    hashes["ADLER32"] = format(zlib.adler32(payload.text.encode()) & 0xFFFFFFFF, "x")
    if len(payload.text) <= 16:
        hashes["CISCO PIX"] = passlib.hash.cisco_pix.encrypt(payload.text)

    hashes["MYSQL 3.2.3"] = passlib.hash.mysql323.encrypt(payload.text)
    hashes["MYSQL 4.1"] = passlib.hash.mysql41.encrypt(payload.text)
    hashes["LDAP MD5"] = passlib.hash.ldap_md5.encrypt(payload.text)
    hashes["LDAP SHA1"] = passlib.hash.ldap_sha1.encrypt(payload.text)

    return hashes


@app.get("/articles/{article}/", response_class=HTMLResponse)
async def articles(request: Request, article: str):
    return await parse_template(request, f"articles/{article}.html")
