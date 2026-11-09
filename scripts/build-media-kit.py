"""Rebuild or verify the reviewed media-kit ZIP. Python 3, standard library only."""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
press = root / 'public' / 'assets' / 'press'
names = [
    'Luke-Nathan-Hayes-short-bio.txt', 'Luke-Nathan-Hayes-biography.txt',
    'Luke-Nathan-Hayes-work-history.txt', 'Luke-Nathan-Hayes-media-facts.txt', 'Luke-Nathan-Hayes-music-during-campaign.txt',
    'airplay-log-template.csv', 'README.txt', 'luke-hayes-published-portrait.webp',
]
sources = {name: press / name for name in names}
sources.update({
    'LICENCE.md': root / 'LICENCE.md',
    'A-Protopian-Gambit-artwork.webp': root / 'public/assets/music/a-protopian-gambit-cover.webp',
    'generated-favicon-512.png': root / 'public/assets/favicon-512.png',
})
target = press / 'Luke-Nathan-Hayes-media-kit.zip'
def source_bytes(source):
    content = source.read_bytes()
    if source.suffix in {'.txt', '.csv', '.md'}:
        content = content.replace(b'\r\n', b'\n')
    return content

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
if args.check:
    with ZipFile(target) as archive:
        assert sorted(archive.namelist()) == sorted(sources), 'Unexpected or missing kit entries'
        assert archive.testzip() is None, 'Damaged kit entry'
        for name, source in sources.items():
            assert archive.read(name) == source_bytes(source), f'Stale kit entry: {name}'
    print(f'Verified {len(sources)} media-kit entries against their current public sources.')
else:
    with ZipFile(target, 'w', compression=ZIP_DEFLATED) as archive:
        for name, source in sources.items():
            archive.writestr(name, source_bytes(source))
    print(f'Rebuilt {len(sources)} reviewed media-kit entries. No private records included.')
