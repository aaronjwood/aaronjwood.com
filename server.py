import binascii
import hashlib
import zlib
from pathlib import Path
from datetime import datetime

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
article_templates = Jinja2Templates(directory="templates/articles/models")
tool_templates = Jinja2Templates(directory="templates/tools/models")


async def get_models(templates: Jinja2Templates, **kwargs):
    models = []
    for template_name in templates.env.list_templates():
        template = templates.env.get_template(template_name)
        models.append({"name": Path(template.name).stem, "module": template.module})

    if kwargs:
        models.sort(**kwargs)

    return models


async def parse_template(request: Request, template: str):
    article_models = await get_models(
        article_templates,
        key=lambda m: datetime.strptime(m["module"].date(), "%B, %Y"),
        reverse=True,
    )
    tool_models = await get_models(tool_templates)
    try:
        return templates.TemplateResponse(
            request=request,
            name=template,
            context={"models": {"articles": article_models, "tools": tool_models}},
        )
    except TemplateNotFound as e:
        raise HTTPException(status_code=404) from e


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return await parse_template(request, "index.html")


@app.get("/tools/{tool}/", response_class=HTMLResponse)
async def tools(request: Request, tool: str):
    return await parse_template(request, f"tools/views/{tool}.html")


@app.get("/employment/{employer}/", response_class=HTMLResponse)
async def employment(request: Request, employer: str):
    return await parse_template(request, f"employment/views/{employer}.html")


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
    return await parse_template(request, f"articles/views/{article}.html")
