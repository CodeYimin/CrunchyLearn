import json
from Crypto.Cipher import AES
import base64
from Crypto.Protocol.KDF import PBKDF2

from Crypto import Random
from Crypto.Cipher import AES
import base64
from hashlib import md5
import sys
import argparse
from requests import get
import asyncio
import aiohttp
import os


class SubtitleDecryptor:
    """Python reimplementation of Animelon's unencryption of it's subtitle files.
      ASS.fromString = function(raw, type) {
        return void 0 === type && (type = misc_5.Format.ASS),
        "d(^-^" === raw.slice(-5) ? ASS.fromStream(new parser.StringStream(ASS.parseString(raw)), type) : ASS.fromStream(new parser.StringStream(raw), type)
    }
    ,
    ASS.parseString = function(s) {
        return CryptoJS.AES.decrypt(s.substring(8, s.length - 5), s.substring(0, 8).split("").reverse().join("")).toString(CryptoJS.enc.Utf8).replace(/undefined/g, "")
    }
    """

    def pad(self, data):
        """
        Pads the data for AES encryption/decryption.
            Parameters:
                data (bytes): The data to pad.
            Returns:
                (bytes): The padded data.
        """
        length = 16 - (len(data) % 16)
        return data + (chr(length) * length).encode()

    def unpad(self, data):
        """
        Unpads the data for AES encryption/decryption.
            Parameters:
                data (bytes): The data to unpad.
            Returns:
                (bytes): The unpadded data.
        """
        return data[: -(data[-1] if type(data[-1]) == int else ord(data[-1]))]

    def bytes_to_key(self, data, salt, output=48):
        """
        Derive a key from a password using the PBKDF2 algorithm.
            Parameters:
                data (bytes): The password to derive the key from.
                salt (bytes): Salt for the password.
                output (int): The length of the key to return.
            Returns:
                (bytes): The derived key.
        """
        # extended from https://gist.github.com/gsakkis/4546068
        assert len(salt) == 8, len(salt)
        data += salt
        key = md5(data).digest()
        final_key = key
        while len(final_key) < output:
            key = md5(key + data).digest()
            final_key += key
        return final_key[:output]

    def encrypt(self, message, passphrase):
        """
        Encrypts the message using the passphrase.
            Parameters:
                message (bytes): The message to encrypt.
                passphrase (bytes): The passphrase to use for encryption.
            Returns:
                (bytes): The encrypted message.
        """
        salt = Random.new().read(8)
        key_iv = self.bytes_to_key(passphrase, salt, 32 + 16)
        key = key_iv[:32]
        iv = key_iv[32:]
        aes = AES.new(key, AES.MODE_CBC, iv)
        return base64.b64encode(b"Salted__" + salt + aes.encrypt(self.pad(message)))

    def decrypt(self, encrypted: bytes, passphrase: bytes):
        """
        Decrypts the message using the passphrase.
            Parameters:
                encrypted (bytes): The encrypted message.
                passphrase (bytes): The passphrase to use for decryption.
            Returns:
                (bytes): The decrypted message.
        """
        encrypted = base64.b64decode(encrypted)
        encrypted = self.pad(encrypted)
        assert encrypted[0:8] == b"Salted__"
        salt = encrypted[8:16]
        key_iv = self.bytes_to_key(passphrase, salt, 32 + 16)
        key = key_iv[:32]
        iv = key_iv[32:]
        aes = AES.new(key, AES.MODE_CBC, iv)
        return self.unpad(aes.decrypt(encrypted[16:]))

    def decrypt_subtitle(self, encryptedSubtitle: str):
        """
        Decrypts the encrypted subtitles
            Parameters:
                encryptedSubtitle (str): The encrypted subtitle in base64
            Returns:
                (bytes): The decrypted subtitle as a byte string
        """
        encryptedSubtitle = bytes(encryptedSubtitle, "utf-8")
        key = encryptedSubtitle[0:8][::-1]
        data = encryptedSubtitle[8:-5]
        encrypted = data
        decryptor = SubtitleDecryptor()
        uncrypted = decryptor.decrypt(encrypted, key)
        return uncrypted


async def writeVideoInfo(series: str, id: str, n: int):
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0"

    if os.path.exists(f"./src/output/downloaded_subtitles/{series}/{series} Episode {n}.ass"):
        print(f"Already done {n}")
        return

    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"https://animelon.com/api/languagevideo/findByVideo?videoId={id}&learnerLanguage=en&subs=1&cdnLink=1&viewCounter=1",
            headers={"User-Agent": userAgent},
        ) as res:
            data = await res.json()

            videoUrl = ""
            videosList = data["resObj"]["video"]["videoURLsData"]
            for video in videosList.items():
                linkUserAgent = video[0].replace("=+(dot)+=", ".")
                url = video[1]["videoURLs"]["tsz"]
                if linkUserAgent == userAgent:
                    videoUrl = url

            dec = b""
            subtitlesList = data["resObj"]["subtitles"]
            for subtitle in subtitlesList:
                language = subtitle["type"]
                content = subtitle["content"][f"{language}Sub"]
                if language == "japanese":
                    dec = SubtitleDecryptor().decrypt_subtitle(content)

            title = data["resObj"]["title"]

            # return (title, videoUrl, dec)
            os.makedirs(f"./src/output/downloaded_subtitles/{series}", exist_ok=True)
            f = open(f"./src/output/downloaded_subtitles/{series}/{title}.ass", "wb")
            f.write(dec)
            f.close()
            print(f"Done {title}")


async def anime(series: str):
    res = get(f"https://animelon.com/api/series/{series}", headers={"user-Agent": ""})
    data = res.json()
    seasons = data["resObj"]["seasons"]

    async with aiohttp.ClientSession() as session:
        for season in seasons:
            number = season["number"]
            episodes = season["episodes"]
            await asyncio.gather(
                *[
                    writeVideoInfo(series, episodes[i], i + 1)
                    for i in range(len(episodes))
                ],
                return_exceptions=True,
            )


if __name__ == "__main__":
    # parser = argparse.ArgumentParser(description="Downloads videos from animelon.com")
    # parser.add_argument(
    #     "series",
    #     metavar="series",
    #     type=str,
    #     help="A series or video page URL, eg: https://animelon.com/series/Death%%20Note or https://animelon.com/video/579b1be6c13aa2a6b28f1364",
    # )
    # args = parser.parse_args()

    # asyncio.run(anime(args.series))

    file = open("src/data/iphoneCharger.json")
    data = json.load(file)
    for d in data:
        asyncio.run(anime(d["id"]))
