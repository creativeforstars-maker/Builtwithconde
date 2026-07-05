#!/usr/bin/env python3
"""Generate a single narration clip with gTTS. Usage: gen_tts.py <text> <out.mp3> [lang]"""
import sys
from gtts import gTTS

def main():
    text = sys.argv[1]
    out = sys.argv[2]
    lang = sys.argv[3] if len(sys.argv) > 3 else "es"
    tld = sys.argv[4] if len(sys.argv) > 4 else "com"
    tts = gTTS(text=text, lang=lang, tld=tld, slow=False)
    tts.save(out)

if __name__ == "__main__":
    main()
